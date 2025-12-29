from django.db import transaction
from .models import Booking, AuditLog
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
        seat = data.get('seat')
        start_date = data.get('start_date_jalali')
        end_date = data.get('end_date_jalali')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        booking_type = data.get('booking_type', 'hourly')

        # Check availability
        if not AvailabilityService.is_seat_available(seat, start_date, end_date, start_time, end_time):
             raise ValidationError(
                 "The selected seat is not available for the requested time.",
                 code='seat_unavailable'
             )

        try:
            with transaction.atomic():
                booking = Booking.objects.create(**data)
                
                # Create Audit Log
                AuditLog.objects.create(
                    booking=booking,
                    action='created',
                    new_status=booking.status,
                    notes=f"Booking created ({booking_type})"
                )
                
                transaction.on_commit(lambda: BookingService.safe_send_email(booking.id))
                
                return booking
        except Exception as e:
            if isinstance(e, ValidationError):
                raise e
            raise ValidationError(
                f"Failed to create booking: {str(e)}",
                code='booking_creation_failed'
            )

class AvailabilityService:
    @staticmethod
    def is_seat_available(seat, start_date, end_date, start_time=None, end_time=None):
        """
        Checks if a specific seat is available for the given range.
        """
        # 1. Query potential conflicting bookings
        # We look for any booking on this seat that overlaps in DATE first.
        qs = Booking.objects.filter(
            seat=seat,
            status__in=['pending', 'confirmed'],
            start_date_jalali__lte=end_date,
            end_date_jalali__gte=start_date
        )

        for booking in qs:
            # Check for actual overlap
            if AvailabilityService.check_overlap(
                start_date, end_date, start_time, end_time,
                booking.start_date_jalali, booking.end_date_jalali, booking.start_time, booking.end_time,
                booking.booking_type
            ):
                return False
        
        return True

    @staticmethod
    def check_overlap(req_start_date, req_end_date, req_start_time, req_end_time,
                      exist_start_date, exist_end_date, exist_start_time, exist_end_time,
                      exist_type):
        """
        Determines if two intervals overlap.
        """
        # Date overlap is already guaranteed by the query filter (start <= end AND end >= start)
        
        # If existing booking is NOT hourly, it consumes the full dates.
        # Since dates overlap, it's a conflict.
        if exist_type != 'hourly':
            return True
        
        # If requested booking is NOT hourly (and existing IS hourly), 
        # the request consumes full dates. Conflict.
        # (We don't strictly know request type here but if req_start_time is None, it's daily+)
        if req_start_time is None or req_end_time is None:
            return True

        # If both are hourly:
        # We need to check if they are on the SAME day(s).
        # Assuming hourly bookings are single-day for simplicity (enforced in validation).
        # If dates don't touch exactly, they might not overlap in time? 
        # But the date filter says they overlap.
        
        # If the overlap involves the same date, we check time.
        # Simplest logic: If valid time ranges are provided for both, check time intersection.
        # If multiple days are involved in hourly booking (edge case), this logic might be too simple,
        # but let's assume single-day hourly.
        
        if req_start_date == exist_start_date:
             # Check time overlap
             # (StartA < EndB) and (EndA > StartB)
             if req_start_time < exist_end_time and req_end_time > exist_start_time:
                 return True
                 
        return False