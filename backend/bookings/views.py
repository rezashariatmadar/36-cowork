from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Space, Booking, Availability
from .serializers import SpaceSerializer, BookingSerializer, AvailabilitySerializer
from .services import AvailabilityService
from django_jalali.db.models import jDateField
import jdatetime

class SpaceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List active spaces.
    """
    queryset = Space.objects.filter(is_active=True)
    serializer_class = SpaceSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['type', 'capacity']

class BookingViewSet(mixins.CreateModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    """
    Create new bookings and retrieve status.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    # Optional: If we want to allow lookup by UUID without authentication, we might need permission checks.
    # The roadmap says "GET /api/v1/bookings/{booking_id}/ — Check booking status"
    # This is covered by RetrieveModelMixin.

class AvailabilityViewSet(viewsets.GenericViewSet):
    """
    Calculate availability.
    """
    serializer_class = AvailabilitySerializer

    def list(self, request):
        space_id = request.query_params.get('space_id')
        date_str = request.query_params.get('date') # YYYY-MM-DD (Jalali)

        if not space_id or not date_str:
            return Response(
                {"error": "space_id and date parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse date string to jdate
            year, month, day = map(int, date_str.split('-'))
            date_obj = jdatetime.date(year, month, day)
        except ValueError:
             return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD (Jalali)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            space = Space.objects.get(id=space_id)
        except Space.DoesNotExist:
             return Response(
                {"error": "Space not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        slots = AvailabilityService.get_available_slots(space, date_obj)
        serializer = AvailabilitySerializer(slots, many=True)
        return Response(serializer.data)
