from django.core.management.base import BaseCommand

from csluse_auth.models import Profile


ROLE_NORMALIZATION_MAP = {
    "STUDENT": "Student",
    "LECTURER": "Lecturer",
    "ADMIN": "Admin",
    "STAFF": "Staff",
    "GUEST": "Guest",
    "OTHER": "Guest",
}


class Command(BaseCommand):
    help = "Normalize legacy Profile.role values (e.g. STUDENT -> Student, OTHER -> Guest)."

    def handle(self, *args, **options):
        updated_count = 0
        unchanged_count = 0

        for profile in Profile.objects.all().only("id", "role"):
            current_role = str(profile.role or "").strip()
            if not current_role:
                unchanged_count += 1
                continue

            normalized_role = ROLE_NORMALIZATION_MAP.get(current_role.upper())
            if not normalized_role or normalized_role == profile.role:
                unchanged_count += 1
                continue

            Profile.objects.filter(pk=profile.pk).update(role=normalized_role)
            updated_count += 1

        self.stdout.write(self.style.SUCCESS("Profile role normalization completed."))
        self.stdout.write(f"Updated profiles: {updated_count}")
        self.stdout.write(f"Unchanged profiles: {unchanged_count}")
