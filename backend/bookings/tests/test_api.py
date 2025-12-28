from rest_framework.test import APITestCase
from rest_framework import status
from bookings.models import Space, Booking
import jdatetime
import datetime

class ApiTests(APITestCase):
    def setUp(self):
        self.space = Space.objects.create(
            name="API Test Space",
            capacity=5,
            hourly_rate=100.00
        )
        self.today_jalali = jdatetime.date.today()
        self.base_url = '/api/v1/bookings/'
        
        self.valid_payload = {
            "space": self.space.id,
            "full_name": "API User",
            "national_id": "0060495219",
            "mobile": "09123456789",
            "booking_date_jalali": self.today_jalali.strftime("%Y-%m-%d"),
            "start_time": "14:00",
            "end_time": "16:00",
            "duration_hours": 2.0,
            "terms_accepted": True
        }

    def test_create_booking_success(self):
        response = self.client.post(self.base_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['status'], 'pending')

    def test_create_booking_invalid_national_id(self):
        payload = self.valid_payload.copy()
        payload['national_id'] = '123' # Invalid
        
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verify specific error code if DRF renders it. 
        # Standard DRF: {'national_id': [ErrorDetail(string='...', code='invalid_national_id')]}
        self.assertEqual(response.data['national_id'][0].code, 'invalid_national_id')

    def test_create_booking_invalid_mobile(self):
        payload = self.valid_payload.copy()
        payload['mobile'] = '08123456789'
        
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['mobile'][0].code, 'invalid_mobile')

    def test_create_booking_past_date(self):
        past_date = self.today_jalali - jdatetime.timedelta(days=1)
        payload = self.valid_payload.copy()
        payload['booking_date_jalali'] = past_date.strftime("%Y-%m-%d")
        
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['booking_date_jalali'][0].code, 'past_date')

    def test_create_booking_slot_unavailable(self):
        # First booking
        self.client.post(self.base_url, self.valid_payload, format='json')
        
        # Duplicate booking
        response = self.client.post(self.base_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Non-field error usually
        # {"non_field_errors": [ErrorDetail(string='...', code='slot_unavailable')]}
        self.assertEqual(response.data['non_field_errors'][0].code, 'slot_unavailable')

    def test_list_spaces(self):
        response = self.client.get('/api/v1/spaces/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        self.assertEqual(response.data[0]['name'], "API Test Space")

    def test_availability_endpoint(self):
        # 14:00-16:00 is booked (from other tests if we didn't reset DB, but APITestCase resets DB per test)
        # Fresh DB per test in Django APITestCase.
        
        # Empty day
        url = f'/api/v1/availability/?space_id={self.space.id}&date={self.today_jalali.strftime("%Y-%m-%d")}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Default: 08-23
        self.assertEqual(len(response.data), 1)
        
        # Book 14-16
        Booking.objects.create(
            space=self.space,
            booking_date_jalali=self.today_jalali,
            start_time=datetime.time(14, 0),
            end_time=datetime.time(16, 0),
            duration_hours=2,
            full_name="Blocker",
            national_id="0060495219",
            mobile="09123456789"
        )
        
        response = self.client.get(url)
        # Split: 08-14, 16-23
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['end_time'], '14:00:00')
        self.assertEqual(response.data[1]['start_time'], '16:00:00')
