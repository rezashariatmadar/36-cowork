from rest_framework import serializers
from .models import Space, Booking, Availability, Seat
from .services import BookingService
import jdatetime
import datetime
from django.core.exceptions import ValidationError as DjangoValidationError

class SpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = '__all__'

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def to_jdate(self, value):
        if isinstance(value, datetime.date) and not isinstance(value, jdatetime.date):
            return jdatetime.date(value.year, value.month, value.day)
        return value

    def validate_start_date_jalali(self, value):
        value = self.to_jdate(value)
        today = jdatetime.date.today()
        if value < today:
             raise serializers.ValidationError("Start date cannot be in the past.", code='past_date')
        return value

    def validate_end_date_jalali(self, value):
        return self.to_jdate(value)

    def validate(self, data):
        seat = data.get('seat')
        booking_type = data.get('booking_type', 'hourly')
        start_date = self.to_jdate(data.get('start_date_jalali'))
        end_date = self.to_jdate(data.get('end_date_jalali'))
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        # 1. Duration Rules
        if seat:
            if booking_type == 'hourly' and not seat.space.allow_hourly:
                raise serializers.ValidationError("Hourly bookings are not allowed for this space.")
            if booking_type == 'daily' and not seat.space.allow_daily:
                raise serializers.ValidationError("Daily bookings are not allowed for this space.")
            if booking_type == 'weekly' and not seat.space.allow_weekly:
                raise serializers.ValidationError("Weekly bookings are not allowed for this space.")
            if booking_type == 'monthly' and not seat.space.allow_monthly:
                raise serializers.ValidationError("Monthly bookings are not allowed for this space.")

        # 2. Date Logic
        if start_date and end_date:
            if start_date > end_date:
                raise serializers.ValidationError("Start date must be before or equal to end date.")
            
            if booking_type == 'hourly' and start_date != end_date:
                 raise serializers.ValidationError("Hourly bookings must be on the same day.")

        # 3. Time Logic
        if booking_type == 'hourly':
            if not start_time or not end_time:
                raise serializers.ValidationError("Start and End times are required for hourly bookings.")
            if start_time >= end_time:
                raise serializers.ValidationError("End time must be after start time.")

        return data

    def create(self, validated_data):
        try:
            return BookingService.create_booking(validated_data)
        except DjangoValidationError as e:
            # Convert to DRF ValidationError to preserve code/detail structure if possible
            if hasattr(e, 'error_dict'):
                raise serializers.ValidationError(e.message_dict)
            elif hasattr(e, 'error_list'):
                 # Extract code if available
                 # e.error_list is a list of ValidationError objects
                 details = []
                 for error in e.error_list:
                     details.append(error.message)
                     # Handling code with DRF is tricky with simple strings
                 raise serializers.ValidationError(details, code=e.code if hasattr(e, 'code') else 'invalid')
            else:
                raise serializers.ValidationError(e.message, code=e.code if hasattr(e, 'code') else 'invalid')

class AvailabilitySerializer(serializers.Serializer):
    """
    Serializer for checking availability status (simplified).
    """
    is_available = serializers.BooleanField()
