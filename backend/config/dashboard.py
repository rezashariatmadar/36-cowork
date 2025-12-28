from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from bookings.models import Booking, Space

def dashboard_callback(request, context):
    """
    Callback to provide custom dashboard widgets for Unfold.
    """
    # Simple stats
    total_bookings = Booking.objects.count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    active_spaces = Space.objects.filter(is_active=True).count()
    
    # Calculate simple revenue (sum of hourly_rate * duration_hours for confirmed bookings)
    # Note: precise calculation should be done in DB, this is just a quick estimate for dashboard
    revenue = 0
    confirmed_objs = Booking.objects.filter(status='confirmed').select_related('space')
    for b in confirmed_objs:
        revenue += b.space.hourly_rate * b.duration_hours

    context.update({
        "navigation": [
            {"title": _("Dashboard"), "link": reverse_lazy("admin:index"), "icon": "dashboard"},
            {"title": _("Bookings"), "link": reverse_lazy("admin:bookings_booking_changelist"), "icon": "event"},
            {"title": _("Spaces"), "link": reverse_lazy("admin:bookings_space_changelist"), "icon": "business"},
        ],
        "kpi": [
            {
                "title": "Total Bookings",
                "metric": total_bookings,
                "footer": format(confirmed_bookings, ",") + " Confirmed",
            },
            {
                "title": "Revenue (Est.)",
                "metric": f"${revenue:,.2f}",
            },
            {
                "title": "Active Spaces",
                "metric": active_spaces,
            },
        ],
    })
    return context
