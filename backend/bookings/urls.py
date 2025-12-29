from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpaceViewSet, BookingViewSet, SeatViewSet

router = DefaultRouter()
router.register(r'spaces', SpaceViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'seats', SeatViewSet, basename='seats')

urlpatterns = [
    path('', include(router.urls)),
]
