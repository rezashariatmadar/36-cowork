from rest_framework.test import APITestCase
from rest_framework import status
from bookings.models import Space, Booking, Seat
import jdatetime
import datetime

class ApiTests(APITestCase):
    def setUp(self):
        self.space = Space.objects.create(
            name="API Test Space",
            capacity=1,
            hourly_rate=100.00
        )
        self.seat = Seat.objects.create(
            space=self.space,
            visual_id="T1-A",
            name="Test Seat"
        )
        self.today_jalali = jdatetime.date.today()
        self.base_url = '/api/v1/bookings/'
        
        self.valid_payload = {
            "seat": self.seat.id,
            "full_name": "API User",
            "national_id": "0060495219",
            "mobile": "09123456789",
            "start_date_jalali": self.today_jalali.strftime("%Y-%m-%d"),
            "end_date_jalali": self.today_jalali.strftime("%Y-%m-%d"),
            "start_time": "14:00",
            "end_time": "16:00",
            "duration_hours": 2.0,
            "terms_accepted": True,
            "booking_type": "hourly"
        }

    def test_create_booking_success(self):
        response = self.client.post(self.base_url, self.valid_payload, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Create Failed: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['status'], 'pending')

    def test_create_booking_invalid_national_id(self):
        payload = self.valid_payload.copy()
        payload['national_id'] = '123' # Invalid
        
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
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
        payload['start_date_jalali'] = past_date.strftime("%Y-%m-%d")
        
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['start_date_jalali'][0].code, 'past_date')

    def test_create_booking_slot_unavailable(self):
        # First booking
        self.client.post(self.base_url, self.valid_payload, format='json')
        
        # Duplicate booking
        response = self.client.post(self.base_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Response might be a list directly if raised as list
        error = response.data[0] if isinstance(response.data, list) else response.data['non_field_errors'][0]
        self.assertEqual(error.code, 'seat_unavailable')

    def test_list_spaces(self):
        response = self.client.get('/api/v1/spaces/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        self.assertEqual(response.data[0]['name'], "API Test Space")