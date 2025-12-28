from django.contrib.auth.base_user import BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, mobile, national_id, password=None, **extra_fields):
        """
        Creates and saves a User with the given mobile and national_id.
        Password is set to national_id by default if not provided.
        """
        if not mobile:
            raise ValueError('The Mobile number must be set')
        if not national_id:
            raise ValueError('The National ID must be set')
        
        user = self.model(mobile=mobile, national_id=national_id, **extra_fields)
        
        # If password is provided, use it. Otherwise use national_id.
        # The prompt says "password is the national id", so we default to that.
        if password:
            user.set_password(password)
        else:
            user.set_password(national_id)
            
        user.save(using=self._db)
        return user

    def create_superuser(self, mobile, national_id, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given mobile and national_id.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(mobile, national_id, password, **extra_fields)
