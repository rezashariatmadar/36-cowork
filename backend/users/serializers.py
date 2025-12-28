from rest_framework import serializers
from django.contrib.auth import get_user_model
from bookings.validators import validate_national_id, validate_mobile_number

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    national_id = serializers.CharField(validators=[validate_national_id])
    mobile = serializers.CharField(validators=[validate_mobile_number])

    class Meta:
        model = User
        fields = ('mobile', 'national_id', 'full_name', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            mobile=validated_data['mobile'],
            national_id=validated_data['national_id'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            email=validated_data.get('email', '')
        )
        return user
