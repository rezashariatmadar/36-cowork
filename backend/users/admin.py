from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    # The forms to add and change user instances
    # We can use default forms for now or custom ones if needed.
    # BaseUserAdmin expects 'username', but we use 'mobile'.
    
    ordering = ['mobile']
    list_display = ['mobile', 'national_id', 'full_name', 'is_staff']
    list_filter = ['is_staff', 'is_active']
    search_fields = ['mobile', 'national_id', 'full_name', 'email']
    
    # Fieldsets controls the layout of the change "User" page
    fieldsets = (
        (None, {'fields': ('mobile', 'password')}),
        ('Personal info', {'fields': ('national_id', 'full_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # add_fieldsets controls the layout of the add "User" page
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('mobile', 'national_id', 'password', 'confirm_password'), # BaseUserAdmin handles password stuff usually
        }),
    )