from django.contrib import admin
from django.utils.html import format_html
from django_jalali.admin.filters import JDateFieldListFilter
from unfold.admin import ModelAdmin
from unfold.decorators import action, display
from .models import Space, Booking, Availability, AuditLog

@admin.register(Space)
class SpaceAdmin(ModelAdmin):
    list_display = ('name', 'type', 'capacity', 'hourly_rate', 'is_active_badge')
    list_filter = ('type', 'is_active', 'capacity')
    search_fields = ('name', 'description')
    actions = ['make_active', 'make_inactive']

    @display(description='Active', label=True)
    def is_active_badge(self, obj):
        return obj.is_active

    @action(description='Mark selected spaces as active')
    def make_active(self, request, queryset):
        queryset.update(is_active=True)

    @action(description='Mark selected spaces as inactive')
    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)

@admin.register(Booking)
class BookingAdmin(ModelAdmin):
    list_display = ('full_name', 'mobile', 'space', 'booking_date_jalali', 'start_time', 'status_colored')
    list_filter = ('status', 'space__type', 'gender', ('booking_date_jalali', JDateFieldListFilter))
    search_fields = ('full_name', 'national_id', 'mobile', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'booking_date_jalali'
    actions = ['mark_confirmed', 'mark_cancelled', 'mark_completed']

    @display(description='Status', ordering='status', label=True)
    def status_colored(self, obj):
        # Unfold handles label styling automatically with label=True if we return specific values,
        # or we can return HTML. Unfold's "label" usually maps boolean/choices to badges.
        # Let's try custom HTML compatible with Tailwind/Unfold.
        colors = {
            'pending': 'warning',   # Unfold/Tailwind classes usually map to specific semantic names
            'confirmed': 'success',
            'cancelled': 'danger',
            'completed': 'info',
        }
        color = colors.get(obj.status, 'default')
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            color,
            obj.get_status_display()
        )

    @action(description='Mark selected bookings as Confirmed')
    def mark_confirmed(self, request, queryset):
        queryset.update(status='confirmed')

    @action(description='Mark selected bookings as Cancelled')
    def mark_cancelled(self, request, queryset):
        queryset.update(status='cancelled')

    @action(description='Mark selected bookings as Completed')
    def mark_completed(self, request, queryset):
        queryset.update(status='completed')

@admin.register(Availability)
class AvailabilityAdmin(ModelAdmin):
    list_display = ('space', 'date_jalali', 'start_time', 'end_time', 'is_available')
    list_filter = ('space', 'is_available', ('date_jalali', JDateFieldListFilter))
    actions = ['mark_available', 'mark_unavailable']

    @action(description='Mark selected slots as Available')
    def mark_available(self, request, queryset):
        queryset.update(is_available=True)

    @action(description='Mark selected slots as Unavailable')
    def mark_unavailable(self, request, queryset):
        queryset.update(is_available=False)

@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    list_display = ('booking', 'action', 'previous_status', 'new_status', 'timestamp')
    list_filter = ('action', ('timestamp', JDateFieldListFilter))
    search_fields = ('booking__full_name', 'booking__national_id')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
