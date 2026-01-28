import re
import secrets
import string

from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer as BaseLoginSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress


from .models import Profile

ADMIN_ROLE_GROUPS = {"Administrator", "SuperAdministrator"}


def _can_assign_profile_fields(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_superuser", False):
        return True
    return user.groups.filter(name__in=ADMIN_ROLE_GROUPS).exists()

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
    max_length = User._meta.get_field("username").max_length

    if len(username) > max_length:
        username = username[:max_length]

    if not User.objects.filter(username=username).exists():
        return username

    alphabet = string.ascii_lowercase + string.digits

    def build_candidate(base_value, suffix_value):
        base_limit = max_length - len(suffix_value)
        trimmed = base_value[:base_limit] if base_limit > 0 else ""
        return f"{trimmed}{suffix_value}" or "user"

    for _ in range(20):
        suffix = "_" + "".join(secrets.choice(alphabet) for _ in range(4))
        candidate = build_candidate(username, suffix)
        if not User.objects.filter(username=candidate).exists():
            return candidate

    suffix_counter = 1
    while True:
        suffix = f"_{suffix_counter}"
        candidate = build_candidate(username, suffix)
        if not User.objects.filter(username=candidate).exists():
            return candidate
        suffix_counter += 1


class CustomRegisterSerializer(RegisterSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=[choice[0] for choice in Profile.ROLE_CHOICES],
        required=False,
        allow_null=True,
    )
    department = serializers.ChoiceField(
        choices=[choice[0] for choice in Profile.DEPARTMENT_CHOICE],
        required=False,
        allow_null=True,
    )
    batch = serializers.ChoiceField(
        choices=[choice[0] for choice in Profile.BATCH_CHOICES],
        required=False,
        allow_null=True,
    )
    id_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    user_type = serializers.ChoiceField(
        choices=[choice[0] for choice in Profile.USER_TYPE_CHOICES],
        required=False,
        allow_null=True,
    )

    def validate_username(self, username):
        # Allow duplicates here; we will auto-generate a unique username later.
        return username

    def validate(self, data):
        data = super().validate(data)
        email = data.get("email") or self.initial_data.get("email") or ""
        base = email.split("@")[0] if email else "user"
        data["username"] = _generate_unique_username(base)
        return data

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        full_name = self.validated_data.get("full_name", "").strip()
        data["username"] = self.validated_data.get("username") or data.get("username")
        data["full_name"] = full_name
        return data

    def save(self, request):
        if _can_assign_profile_fields(request):
            setattr(request, "_skip_email_confirmation", True)

        user = super().save(request)
        full_name = self.get_cleaned_data().get("full_name")
        defaults = {
            "user_type": "external",
        }
        if full_name:
            defaults["full_name"] = full_name

        if _can_assign_profile_fields(request):
            role = self.validated_data.get("role")
            department = self.validated_data.get("department")
            batch = self.validated_data.get("batch")
            id_number = self.validated_data.get("id_number")
            user_type = self.validated_data.get("user_type")

            if role:
                defaults["role"] = role
            if department:
                defaults["department"] = department
            if batch:
                defaults["batch"] = batch
            if id_number:
                defaults["id_number"] = id_number
            if user_type:
                defaults["user_type"] = user_type

        Profile.objects.update_or_create(
            user=user,
            defaults=defaults,
        )

        if _can_assign_profile_fields(request):
            email = user.email
            if email:
                email_address, _ = EmailAddress.objects.get_or_create(
                    user=user,
                    email=email,
                    defaults={"verified": True, "primary": True},
                )
                if not email_address.verified or not email_address.primary:
                    email_address.verified = True
                    email_address.primary = True
                    email_address.save(update_fields=["verified", "primary"])
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


class UserWithProfileSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True, allow_null=True)
    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "is_verified",
            "profile",
        )


class EmailVerificationStatusSerializer(serializers.Serializer):
    """Serializer to validate email status checks."""

    email = serializers.EmailField()
