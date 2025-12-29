from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Exists, OuterRef, Q
from .models import Space, Booking, Availability, Seat
from .serializers import SpaceSerializer, BookingSerializer, AvailabilitySerializer, SeatSerializer
from .services import AvailabilityService
import jdatetime

class SpaceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List active spaces.
    """
    queryset = Space.objects.filter(is_active=True)
    serializer_class = SpaceSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['type', 'capacity']

class SeatViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List seats with status for a specific date.
    """
    serializer_class = SeatSerializer
    filterset_fields = ['space', 'is_active']
    
    def get_queryset(self):
        return Seat.objects.filter(is_active=True)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                year, month, day = map(int, date_str.split('-'))
                query_date = jdatetime.date(year, month, day)
                
                # Fetch bookings overlapping with this date
                active_bookings = Booking.objects.filter(
                    status__in=['pending', 'confirmed'],
                    start_date_jalali__lte=query_date,
                    end_date_jalali__gte=query_date
                ).select_related('seat')
                
                # Map seat_id to booking
                booking_map = {}
                for b in active_bookings:
                    # If multiple bookings (e.g. hourly), we might have issues.
                    # For now, take the last one or just mark as booked.
                    booking_map[str(b.seat.id)] = b
                
                for seat_data in data:
                    seat_id = seat_data['id']
                    booking = booking_map.get(seat_id)
                    
                    if booking:
                        seat_data['status'] = 'booked'
                        seat_data['booked_until'] = str(booking.end_date_jalali)
                        # Add more details if needed for authenticated users
                    else:
                        seat_data['status'] = 'available'
                        
            except ValueError:
                pass
        else:
             for seat_data in data:
                seat_data['status'] = 'available'

        return Response(data)

class BookingViewSet(mixins.CreateModelMixin,
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    """
    Create new bookings and retrieve status.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
