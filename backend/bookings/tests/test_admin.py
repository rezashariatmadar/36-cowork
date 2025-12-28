from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse

class AdminPanelTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = get_user_model().objects.create_superuser(
            mobile='09120000000',
            national_id='0000000000',
            password='password123',
            full_name='Admin User'
        )
        self.client.force_login(self.admin_user)

    def test_admin_space_list(self):
        url = reverse('admin:bookings_space_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_admin_booking_list(self):
        url = reverse('admin:bookings_booking_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_admin_availability_list(self):
        url = reverse('admin:bookings_availability_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_admin_auditlog_list(self):
        url = reverse('admin:bookings_auditlog_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
