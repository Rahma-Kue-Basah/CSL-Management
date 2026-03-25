import re

from django.db import migrations, models


def normalize_initials(value, full_name="", email=""):
    normalized = re.sub(r"[^A-Za-z0-9]+", "", str(value or "")).upper()[:3]
    if normalized:
        return normalized

    source = str(full_name or "").strip()
    if source:
        words = [re.sub(r"[^A-Za-z0-9]+", "", word) for word in source.split()]
        words = [word for word in words if word]
        candidate = "".join(word[0] for word in words[:3]).upper()
        if len(candidate) < 3:
            candidate += "".join(words).upper()
        candidate = re.sub(r"[^A-Z0-9]+", "", candidate)[:3]
        if candidate:
            return candidate

    local_part = str(email or "").split("@")[0]
    fallback = re.sub(r"[^A-Za-z0-9]+", "", local_part).upper()[:3]
    return fallback or "USR"


def populate_profile_initials(apps, schema_editor):
    Profile = apps.get_model("csluse_auth", "Profile")

    for profile in Profile.objects.select_related("user").all():
        profile.initials = normalize_initials(
            getattr(profile, "initials", ""),
            full_name=getattr(profile, "full_name", ""),
            email=getattr(getattr(profile, "user", None), "email", ""),
        )
        if getattr(profile, "role", None) != "Guest":
            profile.institution = None
        profile.save(update_fields=["initials", "institution", "updated_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("csluse_auth", "0006_replace_other_role_with_guest"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="initials",
            field=models.CharField(blank=True, max_length=3),
        ),
        migrations.AddField(
            model_name="profile",
            name="institution",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.RunPython(populate_profile_initials, migrations.RunPython.noop),
    ]
