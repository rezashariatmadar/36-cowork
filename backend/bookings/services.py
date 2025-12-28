from django.db import transaction
from .models import Booking, AuditLog, Space, Availability
from django.core.exceptions import ValidationError
from .tasks import send_booking_confirmation_email
import jdatetime
import datetime

class BookingService:
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
                transaction.on_commit(lambda: send_booking_confirmation_email.delay(booking.id))
                
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
        Checks if the requested time overlaps with existing confirmed/pending bookings.
        """
        qs = Booking.objects.filter(
            space=space,
            booking_date_jalali=date,
            status__in=['pending', 'confirmed']
        )
        
        for b in qs:
            if start_time < b.end_time and end_time > b.start_time:
                return True
        return False

class AvailabilityService:
    @staticmethod
    def get_available_slots(space, date):
        """
        Calculates available slots for a given space and date.
        Returns a list of dicts: [{'start': '08:00', 'end': '10:00'}, ...]
        """
        # 1. Get defined availability (Business Hours)
        availabilities = list(Availability.objects.filter(
            space=space,
            date_jalali=date,
            is_available=True
        ))
        
        # If no specific availability defined, assume default full day open (08:00 - 23:00)
        # This meets the "all times are open" requirement for now.
        if not availabilities:
            class DefaultAvailability:
                start_time = datetime.time(8, 0)
                end_time = datetime.time(23, 0)
            availabilities = [DefaultAvailability()]

        # 2. Get existing bookings
        bookings = Booking.objects.filter(
            space=space,
            booking_date_jalali=date,
            status__in=['pending', 'confirmed']
        ).order_by('start_time')

        # 3. Calculate gaps
        final_slots = []
        
        for avail in availabilities:
            current_start = avail.start_time
            avail_end = avail.end_time
            
            # Find bookings that intersect this availability window
            relevant_bookings = [
                b for b in bookings 
                if b.end_time > current_start and b.start_time < avail_end
            ]
            
            for b in relevant_bookings:
                if b.start_time > current_start:
                    final_slots.append({
                        'start_time': current_start,
                        'end_time': b.start_time
                    })
                
                if b.end_time > current_start:
                    current_start = b.end_time
            
            if current_start < avail_end:
                 final_slots.append({
                        'start_time': current_start,
                        'end_time': avail_end
                    })
                    
        return final_slots
