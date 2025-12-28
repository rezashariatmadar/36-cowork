from django.test import TestCase
from django.core.exceptions import ValidationError
from bookings.models import Space, Booking, AuditLog
from bookings.services import BookingService
import jdatetime
import datetime

class BookingServiceTests(TestCase):
    def setUp(self):
        self.space = Space.objects.create(
            name="Service Test Space",
            capacity=1,
            hourly_rate=100.00
        )
        self.today = jdatetime.date.today()
        self.valid_data = {
            'space': self.space,
            'full_name': "Service User",
            'national_id': "0060495219",
            'mobile': "09123456789",
            'booking_date_jalali': self.today,
            'start_time': datetime.time(9, 0),
            'end_time': datetime.time(11, 0),
            'duration_hours': 2.0,
            'terms_accepted': True
        }

    def test_create_booking_happy_path(self):
        booking = BookingService.create_booking(self.valid_data)
        
        # Check Booking
        self.assertIsNotNone(booking.id)
        self.assertEqual(booking.status, 'pending')
        
        # Check Audit Log
        self.assertEqual(AuditLog.objects.count(), 1)
        log = AuditLog.objects.first()
        self.assertEqual(log.booking, booking)
        self.assertEqual(log.action, 'created')

    def test_overlap_protection_exact_match(self):
        BookingService.create_booking(self.valid_data)
        
        # Try to create exact same booking
        with self.assertRaises(ValidationError) as cm:
            BookingService.create_booking(self.valid_data)
        self.assertEqual(cm.exception.code, 'slot_unavailable')

    def test_overlap_protection_partial(self):
        BookingService.create_booking(self.valid_data) # 9-11
        
        # Overlap: 10-12
        overlap_data = self.valid_data.copy()
        overlap_data['start_time'] = datetime.time(10, 0)
        overlap_data['end_time'] = datetime.time(12, 0)
        
        with self.assertRaises(ValidationError) as cm:
            BookingService.create_booking(overlap_data)
        self.assertEqual(cm.exception.code, 'slot_unavailable')

    def test_touching_edges_allowed(self):
        BookingService.create_booking(self.valid_data) # 9-11
        
        # Touch edge: 11-13 (Allowed)
        next_data = self.valid_data.copy()
        next_data['start_time'] = datetime.time(11, 0)
        next_data['end_time'] = datetime.time(13, 0)
        
        booking = BookingService.create_booking(next_data)
        self.assertIsNotNone(booking.id)

    def test_transaction_rollback_on_error(self):
        # Simulate an error during creation after booking save but before return
        # We can't easily inject inside the method without mocking.
        # However, we can test that if validation fails BEFORE save, nothing is saved.
        
        # Force a validation error (e.g. overlap)
        BookingService.create_booking(self.valid_data)
        
        with self.assertRaises(ValidationError):
            BookingService.create_booking(self.valid_data)
            
        # Ensure only 1 booking exists (the first one)
        self.assertEqual(Booking.objects.count(), 1)
        self.assertEqual(AuditLog.objects.count(), 1)
