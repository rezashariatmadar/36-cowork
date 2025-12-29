from django.contrib import admin
from django.utils.html import format_html
from django_jalali.admin.filters import JDateFieldListFilter
from unfold.admin import ModelAdmin
from unfold.decorators import action, display
from .models import Space, Booking, Availability, AuditLog, Seat

class SeatInline(admin.TabularInline):
    model = Seat
    extra = 1

@admin.register(Space)
class SpaceAdmin(ModelAdmin):
    list_display = ('name', 'type', 'capacity', 'hourly_rate', 'daily_rate', 'is_active_badge')
    list_filter = ('type', 'is_active', 'capacity')
    search_fields = ('name', 'description')
    inlines = [SeatInline]
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

@admin.register(Seat)
class SeatAdmin(ModelAdmin):
    list_display = ('visual_id', 'space', 'name', 'is_active')
    list_filter = ('space__type', 'is_active')
    search_fields = ('visual_id', 'name', 'space__name')

@admin.register(Booking)
class BookingAdmin(ModelAdmin):
    list_display = ('full_name', 'mobile', 'seat', 'booking_type', 'start_date_jalali', 'status_colored')
    list_filter = ('status', 'seat__space__type', 'gender', ('start_date_jalali', JDateFieldListFilter))
    search_fields = ('full_name', 'national_id', 'mobile', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'start_date_jalali'
    actions = ['mark_confirmed', 'mark_cancelled', 'mark_completed']

    @display(description='Status', ordering='status', label=True)
    def status_colored(self, obj):
        colors = {
            'pending': 'warning',
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