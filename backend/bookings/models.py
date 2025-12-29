from django.db import models
from django_jalali.db import models as jmodels
import uuid
from .validators import validate_national_id, validate_mobile_number

class Space(models.Model):
    SPACE_TYPES = [
        ('hot_desk', 'Hot Desk'),
        ('dedicated_desk', 'Dedicated Desk'),
        ('private_office', 'Private Office'),
        ('meeting_room', 'Meeting Room'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=SPACE_TYPES, default='hot_desk')
    capacity = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Pricing
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weekly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Duration Rules
    allow_hourly = models.BooleanField(default=True)
    allow_daily = models.BooleanField(default=True)
    allow_weekly = models.BooleanField(default=True)
    allow_monthly = models.BooleanField(default=True)

    # Privacy
    show_availability_details = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Seat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='seats')
    visual_id = models.CharField(max_length=50, unique=True, help_text="e.g., T1-A")
    name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    # Override Pricing (Optional)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weekly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.visual_id} ({self.space.name})"

    @property
    def current_hourly_rate(self):
        return self.hourly_rate if self.hourly_rate is not None else self.space.hourly_rate

    @property
    def current_daily_rate(self):
        return self.daily_rate if self.daily_rate is not None else self.space.daily_rate
    
    # Add other helpers as needed


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    BOOKING_TYPE_CHOICES = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Personal Info
    full_name = models.CharField(max_length=255)
    national_id = models.CharField(max_length=10, validators=[validate_national_id])
    mobile = models.CharField(max_length=11, validators=[validate_mobile_number])
    email = models.EmailField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)

    # Booking Details
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name='bookings')
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPE_CHOICES, default='hourly')
    
    start_date_jalali = jmodels.jDateField()
    end_date_jalali = jmodels.jDateField()
    
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    duration_hours = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True) # Optional for non-hourly

    # Metadata
    referral_source = models.CharField(max_length=100, blank=True)
    special_requests = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Agreements
    terms_accepted = models.BooleanField(default=False)
    privacy_accepted = models.BooleanField(default=False)
    newsletter_opt_in = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['national_id']),
            models.Index(fields=['mobile']),
            models.Index(fields=['start_date_jalali']),
            models.Index(fields=['end_date_jalali']),
            models.Index(fields=['status']),
            models.Index(fields=['seat', 'start_date_jalali', 'status']),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.seat.visual_id} ({self.start_date_jalali})"


class Availability(models.Model):
    # Keeping Space here for now, or should it be Seat?
    # Context implies Space-level availability overrides might still exist,
    # but the service logic is changing. I'll leave it as Space for now to avoid too many breakages,
    # or I can update it to Seat if needed.
    # Given the prompt, I'll assume this model is less critical or needs to be adapted.
    # I'll leave it as is but it might not be used by the new simple service.
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='availabilities')
    date_jalali = jmodels.jDateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Availabilities"
        indexes = [
            models.Index(fields=['space', 'date_jalali']),
        ]

    def __str__(self):
        return f"{self.space.name} - {self.date_jalali} ({self.start_time}-{self.end_time})"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('cancelled', 'Cancelled'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    previous_status = models.CharField(max_length=20, blank=True, null=True)
    new_status = models.CharField(max_length=20, blank=True, null=True)
    changed_by = models.CharField(max_length=100, blank=True, null=True) # User or System
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.booking.id} - {self.action} at {self.timestamp}"
