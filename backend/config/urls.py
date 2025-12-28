from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('bookings.urls')),
    path('api/v1/auth/', include('users.urls')), # Registration
    path('api-auth/', include('rest_framework.urls')), # For Browsable API login
    path('api/v1/token-auth/', obtain_auth_token, name='api_token_auth'), # Token generation endpoint
]