from django.db import transaction
from .models import Booking, AuditLog, Space, Availability
from django.core.exceptions import ValidationError
from .tasks import send_booking_confirmation_email
import jdatetime
import datetime

class BookingService:
    @staticmethod
    def safe_send_email(booking_id):
        try:
            send_booking_confirmation_email.delay(booking_id)
        except Exception as e:
            print(f"Warning: Failed to queue email task for booking {booking_id}: {e}")

    @staticmethod
    def create_booking(data):
        """
        Creates a booking with validation, transaction, and audit logging.
        """
        space = data.get('space')
        date = data.get('booking_date_jalali')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        # Check for overlaps
        if BookingService.check_overlap(space, date, start_time, end_time):
             raise ValidationError(
                 "The selected time slot is already booked.",
                 code='slot_unavailable'
             )

        try:
            with transaction.atomic():
                booking = Booking.objects.create(**data)
                
                # Create Audit Log
                AuditLog.objects.create(
                    booking=booking,
                    action='created',
                    new_status=booking.status,
                    notes="Booking created via API"
                )
                
                # Trigger email sending (async)
                # transaction.on_commit ensures the DB row exists before Celery picks it up
                transaction.on_commit(lambda: BookingService.safe_send_email(booking.id))
                
                return booking
        except Exception as e:
            # If it's already a ValidationError, re-raise it
            if isinstance(e, ValidationError):
                raise e
            # Otherwise wrap it
            raise ValidationError(
                f"Failed to create booking: {str(e)}",
                code='booking_creation_failed'
            )

    @staticmethod
    def check_overlap(space, date, start_time, end_time):
        """
        Checks if the requested time overlaps with existing confirmed/pending bookings
        exceeding the space's capacity.
        """
        qs = Booking.objects.filter(
            space=space,
            booking_date_jalali=date,
            status__in=['pending', 'confirmed']
        )
        
        # We need to check if AT ANY POINT in the requested range, 
        # the number of active bookings >= capacity.
        # This requires checking the 'density' of bookings.
        
        # Simple approach for validation:
        # Check against every booking. If we find `capacity` number of bookings
        # that ALL overlap with the requested time AND each other, that's a problem.
        # But 'overlap with each other' is the hard part.
        
        # Reliable approach:
        # 1. Get all bookings that overlap with requested [start_time, end_time].
        # 2. If len(overlapping_bookings) < space.capacity, we are definitely safe. 
        #    (Even if they all overlap each other, they don't fill the room).
        
        overlapping_bookings = []
        for b in qs:
            # Check intersection
            if start_time < b.end_time and end_time > b.start_time:
                overlapping_bookings.append(b)
        
        if len(overlapping_bookings) < space.capacity:
            return False

        # 3. If count >= capacity, we need to check if they actually overlap *simultaneously*
        # to exceed capacity at any specific minute.
        # We do a "Sweep Line" algorithm on the overlapping bookings.
        
        events = []
        for b in overlapping_bookings:
            # Limit the event scope to the requested window for efficiency
            # (only care about overlaps INSIDE the requested window)
            s = max(start_time, b.start_time)
            e = min(end_time, b.end_time)
            if s < e:
                events.append((s, 1))  # Start of a booking
                events.append((e, -1)) # End of a booking
        
        events.sort(key=lambda x: x[0])
        
        current_occupancy = 0
        max_occupancy = 0
        
        for _, change in events:
            current_occupancy += change
            if current_occupancy > max_occupancy:
                max_occupancy = current_occupancy
                
        # If max_occupancy reaches capacity, we can't add one more.
        return max_occupancy >= space.capacity

class AvailabilityService:
    @staticmethod
    def get_available_slots(space, date):
        """
        Calculates available slots for a given space and date, respecting capacity.
        """
        # 1. Define Business Hours (Default 08:00 - 23:00)
        # In a real app, this might come from the Space model or separate Settings.
        day_start = datetime.time(8, 0)
        day_end = datetime.time(23, 0)
        
        # Check specific availability overrides
        availabilities = Availability.objects.filter(
            space=space,
            date_jalali=date,
            is_available=True
        )
        if availabilities.exists():
            # Use the union of defined availability windows? 
            # For simplicity, let's take the first one or iterate. 
            # The current requirement is just "calculate available slots".
            # Let's assume the first positive availability defines the day's bounds.
            avail = availabilities.first()
            day_start = avail.start_time
            day_end = avail.end_time

        # 2. Get existing bookings
        bookings = Booking.objects.filter(
            space=space,
            booking_date_jalali=date,
            status__in=['pending', 'confirmed']
        )

        # 3. Sweep Line Algorithm to find "Free" windows
        # Events: (time, type)
        # type: +1 (booking start), -1 (booking end)
        
        events = []
        # Add bookings as events
        for b in bookings:
            # Clip booking times to business hours
            s = max(day_start, b.start_time)
            e = min(day_end, b.end_time)
            if s < e:
                events.append((s, 1))
                events.append((e, -1))

        # Sort events. 
        # Crucial: if times are equal, process END (-1) before START (+1) 
        # to strictly allow touching intervals? 
        # No, usually we want to see occupancy. 
        events.sort(key=lambda x: x[0])
        
        available_slots = []
        current_occupancy = 0
        
        # We scan from day_start to day_end
        # We need to construct intervals where current_occupancy < space.capacity
        
        last_time = day_start
        
        # Insert "boundary" events to ensure we process the full day
        # But real events are driven by bookings.
        # We just need to iterate through the timeline.
        
        # Merging duplicate timestamps in events is helpful but not strictly required if logic is robust.
        
        for time_point, change in events:
            # Before applying change, check the interval [last_time, time_point]
            if time_point > last_time:
                if current_occupancy < space.capacity:
                    # This interval is free!
                    # Check if we can merge with previous slot?
                    if available_slots and available_slots[-1]['end_time'] == last_time:
                        available_slots[-1]['end_time'] = time_point
                    else:
                        available_slots.append({
                            'start_time': last_time,
                            'end_time': time_point
                        })
            
            current_occupancy += change
            last_time = time_point
            
        # Handle tail (from last event to day_end)
        if last_time < day_end:
            if current_occupancy < space.capacity:
                 if available_slots and available_slots[-1]['end_time'] == last_time:
                        available_slots[-1]['end_time'] = day_end
                 else:
                    available_slots.append({
                        'start_time': last_time,
                        'end_time': day_end
                    })

        return available_slots
