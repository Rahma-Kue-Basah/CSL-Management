from dj_rest_auth.serializers import LoginSerializer as BaseLoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class CustomLoginSerializer(BaseLoginSerializer):
    """Custom login serializer that accepts both username and email"""
    
    username = serializers.CharField(
        label="Username or Email",
        write_only=True,
        required=True,
    )

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            # Try to find user by username first
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                # If not found, try to find by email
                try:
                    user = User.objects.get(email=username)
                except User.DoesNotExist:
                    msg = 'Unable to log in with provided credentials.'
                    raise serializers.ValidationError(msg, code='authorization')

            # Verify password
            if not user.check_password(password):
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')

            if not user.is_active:
                msg = 'User account is disabled.'
                raise serializers.ValidationError(msg, code='authorization')

            attrs['user'] = user
            return attrs

        msg = 'Must include "username" and "password".'
        raise serializers.ValidationError(msg, code='authorization')

    def get_auth_user(self, username, password):
        """Override to support email login"""
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None
        
        if user.check_password(password) and user.is_active:
            return user
        return None