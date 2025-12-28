from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from .managers import UserManager
from bookings.validators import validate_mobile_number, validate_national_id

class User(AbstractBaseUser, PermissionsMixin):
    mobile = models.CharField(
        max_length=11, 
        unique=True, 
        validators=[validate_mobile_number],
        verbose_name='Mobile Number'
    )
    national_id = models.CharField(
        max_length=10, 
        unique=True, 
        validators=[validate_national_id],
        verbose_name='National ID'
    )
    full_name = models.CharField(max_length=255, blank=True, verbose_name='Full Name')
    email = models.EmailField(blank=True, null=True, verbose_name='Email Address')
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'mobile'
    REQUIRED_FIELDS = ['national_id', 'full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.full_name} ({self.mobile})"
        
    @property
    def username(self):
        """
        Alias for mobile to support 3rd party apps expecting 'username'.
        """
        return self.mobile
