from rest_framework import serializers
from .models import Space, Booking, Availability
from .services import BookingService
import jdatetime

class SpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def validate_booking_date_jalali(self, value):
        """
        Check that the date is not in the past and not too far in the future.
        """
        import datetime
        # Fix: DRF DateField returns datetime.date with Jalali components if passed string like '1403-...'
        # We need to ensure we compare apples to apples.
        if isinstance(value, datetime.date) and not isinstance(value, jdatetime.date):
            value = jdatetime.date(value.year, value.month, value.day)

        today = jdatetime.date.today()
        
        if value < today:
            raise serializers.ValidationError(
                "Booking date cannot be in the past.",
                code='past_date'
            )
        
        # Limit to 6 months in future
        # Simple approximation: 6 * 30 = 180 days
        max_future = today + jdatetime.timedelta(days=180)
        if value > max_future:
             raise serializers.ValidationError(
                "Booking date cannot be more than 6 months in the future.",
                code='date_too_far'
            )
        
        return value

    def validate(self, data):
        """
        Check for overlaps using the service.
        """
        space = data.get('space')
        date = data.get('booking_date_jalali')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                "End time must be after start time.",
                code='invalid_time_range'
            )

        if space and date and start_time and end_time:
             if BookingService.check_overlap(space, date, start_time, end_time):
                raise serializers.ValidationError(
                    "The selected time slot is already booked.",
                    code='slot_unavailable'
                )

        return data

    def create(self, validated_data):
        # Use service to create
        return BookingService.create_booking(validated_data)

class AvailabilitySerializer(serializers.Serializer):
    """
    Serializer for calculated availability slots (not the model).
    """
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
