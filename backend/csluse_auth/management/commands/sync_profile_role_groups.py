from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from csluse_auth.models import Profile
from csluse_auth.permissions import (
    ADMINISTRATOR,
    ALL_ROLES,
    GUEST,
    LECTURER,
    STAFF,
    STUDENT,
    SUPER_ADMINISTRATOR,
    assign_role,
)


PROFILE_TO_GROUP_ROLE_MAP = {
    "ADMIN": ADMINISTRATOR,
    "LECTURER": LECTURER,
    "STUDENT": STUDENT,
    "STAFF": STAFF,
    "GUEST": GUEST,
    "OTHER": GUEST,
}

GROUP_TO_PROFILE_ROLE_MAP = {
    STUDENT: "Student",
    LECTURER: "Lecturer",
    STAFF: "Staff",
    ADMINISTRATOR: "Admin",
    SUPER_ADMINISTRATOR: "Admin",
    GUEST: "Guest",
}

GROUP_NAME_NORMALIZATION_MAP = {
    "student": STUDENT,
    "lecturer": LECTURER,
    "staff": STAFF,
    "administrator": ADMINISTRATOR,
    "admin": ADMINISTRATOR,
    "superadministrator": SUPER_ADMINISTRATOR,
    "super_administrator": SUPER_ADMINISTRATOR,
    "super-administrator": SUPER_ADMINISTRATOR,
    "super administrator": SUPER_ADMINISTRATOR,
    "guest": GUEST,
    "other": GUEST,
}


def pick_user_group_role(user_group_names):
    normalized_roles = set()
    for raw_name in user_group_names:
        key = str(raw_name or "").strip().lower()
        role = GROUP_NAME_NORMALIZATION_MAP.get(key)
        if role:
            normalized_roles.add(role)

    for role_name in [SUPER_ADMINISTRATOR, ADMINISTRATOR, STAFF, LECTURER, STUDENT, GUEST]:
        if role_name in normalized_roles:
            return role_name
    return None


class Command(BaseCommand):
    help = "Synchronize Profile.role and User.groups for existing users."

    def handle(self, *args, **options):
        User = get_user_model()

        updated_profile_role = 0
        updated_group_role = 0
        users_processed = 0
        unresolved_group_users = 0

        for user in User.objects.all().prefetch_related("groups").select_related("profile"):
            users_processed += 1

            profile, _ = Profile.objects.get_or_create(
                user=user,
                defaults={"user_type": "External"},
            )

            profile_role_value = str(profile.role or "").strip()
            normalized_profile_role = PROFILE_TO_GROUP_ROLE_MAP.get(profile_role_value.upper()) if profile_role_value else None

            user_group_names = set(user.groups.values_list("name", flat=True))
            selected_group_role = pick_user_group_role(user_group_names)

            if normalized_profile_role:
                if selected_group_role != normalized_profile_role:
                    if assign_role(user, normalized_profile_role):
                        updated_group_role += 1
                continue

            # Profile role is empty/invalid: infer it from group if possible.
            inferred_profile_role = GROUP_TO_PROFILE_ROLE_MAP.get(selected_group_role)
            if inferred_profile_role and profile.role != inferred_profile_role:
                Profile.objects.filter(pk=profile.pk).update(role=inferred_profile_role)
                updated_profile_role += 1

            # If there is no valid profile role and no known role group, remove stray role groups.
            if not inferred_profile_role:
                removed_any = False
                for role_name in ALL_ROLES:
                    if role_name in user_group_names:
                        removed_any = True
                        break
                if removed_any:
                    user.groups.remove(*user.groups.filter(name__in=ALL_ROLES))
                    updated_group_role += 1
                elif user_group_names:
                    unresolved_group_users += 1

        self.stdout.write(self.style.SUCCESS("Sync completed."))
        self.stdout.write(f"Users processed: {users_processed}")
        self.stdout.write(f"Profiles updated from groups: {updated_profile_role}")
        self.stdout.write(f"Groups updated from profiles: {updated_group_role}")
        self.stdout.write(f"Users with non-role/unknown groups left unchanged: {unresolved_group_users}")
