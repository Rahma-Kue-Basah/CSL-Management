import re

from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer as BaseLoginSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress


from .models import Profile

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
            
            if not EmailAddress.objects.filter(user=user, verified=True).exists():
                raise serializers.ValidationError({'detail': 'Email belum diverifikasi', 'code': 'email_not_verified'})

            # Set backend attribute for multiple authentication backends
            user.backend = 'django.contrib.auth.backends.ModelBackend'
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


def _generate_unique_username(base):
    sanitized = re.sub(r"[^a-zA-Z0-9_]+", "", base).lower()
    username = sanitized or "user"

    if not User.objects.filter(username=username).exists():
        return username

    suffix = 1
    while True:
        candidate = f"{username}{suffix}"
        if not User.objects.filter(username=candidate).exists():
            return candidate
        suffix += 1


class CustomRegisterSerializer(RegisterSerializer):
    full_name = serializers.CharField(write_only=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        full_name = self.validated_data.get("full_name", "").strip()
        email = data.get("email") or self.validated_data.get("email") or ""
        base = email.split("@")[0] if email else "user"

        data["username"] = _generate_unique_username(base)
        data["full_name"] = full_name
        return data

    def save(self, request):
        user = super().save(request)
        full_name = self.get_cleaned_data().get("full_name")
        defaults = {
            "user_type": "external",
        }
        if full_name:
            defaults["full_name"] = full_name

        Profile.objects.update_or_create(
            user=user,
            defaults=defaults,
        )
        return user


class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = (
            "id",
            "email",
            "full_name",
            "role",
            "batch",
            "department",
            "id_number",
            "user_type",
        )
        read_only_fields = ("id", "email")


class EmailVerificationStatusSerializer(serializers.Serializer):
    """Serializer to validate email status checks."""

    email = serializers.EmailField()
