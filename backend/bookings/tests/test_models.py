from django.test import TestCase
from django.db.utils import IntegrityError
from bookings.models import Space, Booking
from bookings.validators import validate_national_id
import jdatetime
import datetime
from django.core.exceptions import ValidationError

class ModelTests(TestCase):
    def setUp(self):
        self.space = Space.objects.create(
            name="Model Test Space",
            capacity=10,
            hourly_rate=200.00
        )
        self.today = jdatetime.date.today()

    def test_space_creation_defaults(self):
        """
        Test Space defaults (is_active=True).
        """
        self.assertTrue(self.space.is_active)
        self.assertIsNotNone(self.space.created_at)
        self.assertEqual(self.space.type, 'hot_desk') # Default

    def test_booking_required_fields(self):
        """
        Test that creating a booking requires mandatory fields.
        Note: Model validation isn't run automatically on .save() in Django, 
        but IntegrityError (DB level) or full_clean() (App level) catches it.
        """
        booking = Booking(
            space=self.space,
            # Missing fields
        )
        # full_clean should raise ValidationError for missing fields
        with self.assertRaises(ValidationError):
            booking.full_clean()

    def test_booking_creation_happy_path(self):
        booking = Booking.objects.create(
            space=self.space,
            full_name="Valid User",
            national_id="0060495219",
            mobile="09123456789",
            booking_date_jalali=self.today,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            duration_hours=1
        )
        self.assertEqual(booking.status, 'pending')
        self.assertIsNotNone(booking.created_at)
        self.assertIsNotNone(booking.updated_at)

    def test_booking_status_choices(self):
        booking = Booking.objects.create(
            space=self.space,
            full_name="Status User",
            national_id="0060495219",
            mobile="09123456789",
            booking_date_jalali=self.today,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            duration_hours=1,
            status='confirmed'
        )
        self.assertEqual(booking.status, 'confirmed')
