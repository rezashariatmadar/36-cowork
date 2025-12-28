from django.test import TestCase
from django.core import mail
from bookings.models import Space, Booking
from bookings.tasks import send_booking_confirmation_email
import jdatetime
import datetime

class TaskTests(TestCase):
    def setUp(self):
        self.space = Space.objects.create(
            name="Task Space",
            capacity=5,
            hourly_rate=100.00
        )
        self.booking = Booking.objects.create(
            space=self.space,
            full_name="Email User",
            national_id="0060495219",
            mobile="09123456789",
            email="user@example.com",
            booking_date_jalali=jdatetime.date.today(),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(11, 0),
            duration_hours=1,
            status='confirmed'
        )

    def test_send_email_task(self):
        # Call task directly (synchronous)
        result = send_booking_confirmation_email(self.booking.id)
        
        # Check output
        self.assertEqual(result, f"Email sent to {self.booking.email}")
        
        # Check email box
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Booking Confirmation')
        self.assertEqual(mail.outbox[0].to, ['user@example.com'])
        self.assertIn("is confirmed", mail.outbox[0].body)
        # Note: send_mail puts message in body. html_message in alternatives.
