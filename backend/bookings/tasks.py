from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Booking

@shared_task
def send_booking_confirmation_email(booking_id):
    try:
        booking = Booking.objects.select_related('seat__space').get(id=booking_id)
    except Booking.DoesNotExist:
        return f"Booking {booking_id} not found."

    if not booking.email:
        return "No email provided for this booking."

    # Format time conditionally
    start_time_str = booking.start_time.strftime('%H:%M') if booking.start_time else "N/A"
    end_time_str = booking.end_time.strftime('%H:%M') if booking.end_time else "N/A"
    
    date_str = str(booking.start_date_jalali)
    if booking.start_date_jalali != booking.end_date_jalali:
        date_str += f" to {booking.end_date_jalali}"

    context = {
        'full_name': booking.full_name,
        'booking_id': str(booking.id),
        'space_name': booking.seat.space.name,
        'seat_name': booking.seat.visual_id,
        'date': date_str,
        'start_time': start_time_str,
        'end_time': end_time_str,
        'booking_type': booking.get_booking_type_display(),
    }

    # Template might need updates too, but passing context is the first step.
    # Assuming template is flexible or I might need to update it if strict.
    # I'll update the plain message at least.
    
    plain_message = f"Dear {booking.full_name}, your {booking.booking_type} booking for {booking.seat.space.name} ({booking.seat.visual_id}) on {date_str} is confirmed."

    try:
        html_message = render_to_string('emails/booking_confirmation.html', context)
    except Exception:
        # Fallback if template is missing or broken
        html_message = None

    send_mail(
        subject='Booking Confirmation',
        message=plain_message,
        html_message=html_message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[booking.email],
        fail_silently=False,
    )

    return f"Email sent to {booking.email}"