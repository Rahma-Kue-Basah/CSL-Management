from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile
from .permissions import assign_role, ALL_ROLES

User = get_user_model()


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    if not created:
        return

    full_name = f"{instance.first_name} {instance.last_name}".strip()
    
    profile, profile_created = Profile.objects.get_or_create(
        user=instance,
        defaults={
            **({"full_name": full_name} if full_name else {}),
            "user_type": "EXTERNAL",
        },
    )
    
    if not profile_created and not profile.full_name and full_name:
        profile.full_name = full_name
        profile.save()


@receiver(post_save, sender=Profile)
def sync_profile_role_to_group(sender, instance, **kwargs):
    """Keep Django auth groups in sync with Profile.role."""
    role_value = instance.role
    if not role_value:
        return

    # Map Profile role (stored uppercase) to Group name (title-case)
    role_map = {
        "ADMIN": "Administrator",
        "LECTURER": "Lecturer",
        "STUDENT": "Student",
        "STAFF": "Staff",
        "OTHER": "Other",
    }
    group_name = role_map.get(role_value)
    if not group_name or group_name not in ALL_ROLES:
        return

    assign_role(instance.user, group_name)
