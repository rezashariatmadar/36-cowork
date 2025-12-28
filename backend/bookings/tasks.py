from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Booking

@shared_task
def send_booking_confirmation_email(booking_id):
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return f"Booking {booking_id} not found."

    if not booking.email:
        return "No email provided for this booking."

    context = {
        'full_name': booking.full_name,
        'booking_id': str(booking.id),
        'space_name': booking.space.name,
        'date': str(booking.booking_date_jalali),
        'start_time': booking.start_time.strftime('%H:%M'),
        'end_time': booking.end_time.strftime('%H:%M'),
    }

    html_message = render_to_string('emails/booking_confirmation.html', context)
    plain_message = f"Dear {booking.full_name}, your booking for {booking.space.name} on {booking.booking_date_jalali} is confirmed."

    send_mail(
        subject='Booking Confirmation',
        message=plain_message,
        html_message=html_message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[booking.email],
        fail_silently=False,
    )

    return f"Email sent to {booking.email}"
