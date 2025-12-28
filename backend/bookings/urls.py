from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpaceViewSet, BookingViewSet, AvailabilityViewSet

router = DefaultRouter()
router.register(r'spaces', SpaceViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'availability', AvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]