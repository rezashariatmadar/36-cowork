from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from bookings.models import Space, Booking
from bookings.services import AvailabilityService
import jdatetime
import datetime

class DefaultAvailabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.space = Space.objects.create(
            name="Default Space",
            capacity=1,
            hourly_rate=100.00
        )
        self.today_jalali = jdatetime.date.today()
        # No Availability object created intentionally

    def test_default_availability(self):
        # Should return default 08:00 - 23:00
        slots = AvailabilityService.get_available_slots(self.space, self.today_jalali)
        
        self.assertEqual(len(slots), 1)
        self.assertEqual(slots[0]['start_time'], datetime.time(8, 0))
        self.assertEqual(slots[0]['end_time'], datetime.time(23, 0))

    def test_default_availability_with_booking(self):
        # Create a booking 10-12
        Booking.objects.create(
            space=self.space,
            booking_date_jalali=self.today_jalali,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(12, 0),
            duration_hours=2,
            full_name="Blocker",
            national_id="0060495219",
            mobile="09123456789",
            status='confirmed'
        )

        slots = AvailabilityService.get_available_slots(self.space, self.today_jalali)
        
        # Should be split: 08-10 and 12-23
        self.assertEqual(len(slots), 2)
        self.assertEqual(slots[0]['start_time'], datetime.time(8, 0))
        self.assertEqual(slots[0]['end_time'], datetime.time(10, 0))
        self.assertEqual(slots[1]['start_time'], datetime.time(12, 0))
        self.assertEqual(slots[1]['end_time'], datetime.time(23, 0))
