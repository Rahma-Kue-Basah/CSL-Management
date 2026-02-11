from django.db import migrations, models


def forward_replace_other_with_guest(apps, schema_editor):
    Profile = apps.get_model("csluse_auth", "Profile")
    Group = apps.get_model("auth", "Group")

    for legacy_role in ("other", "Other", "OTHER"):
        Profile.objects.filter(role=legacy_role).update(role="Guest")

    Profile.objects.filter(role="GUEST").update(role="Guest")

    guest_group, _ = Group.objects.get_or_create(name="Guest")
    for legacy_group_name in ("other", "Other", "OTHER"):
        legacy_group = Group.objects.filter(name=legacy_group_name).first()
        if not legacy_group:
            continue

        guest_group.user_set.add(*legacy_group.user_set.all())
        legacy_group.delete()


def backward_replace_guest_with_other(apps, schema_editor):
    Profile = apps.get_model("csluse_auth", "Profile")
    Group = apps.get_model("auth", "Group")

    Profile.objects.filter(role="Guest").update(role="Other")

    other_group, _ = Group.objects.get_or_create(name="Other")
    guest_group = Group.objects.filter(name="Guest").first()
    if guest_group:
        other_group.user_set.add(*guest_group.user_set.all())
        guest_group.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("csluse_auth", "0005_alter_profile_role"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="role",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Student", "Student"),
                    ("Lecturer", "Lecturer"),
                    ("Admin", "Admin"),
                    ("Staff", "Staff"),
                    ("Guest", "Guest"),
                ],
                max_length=10,
                null=True,
            ),
        ),
        migrations.RunPython(
            forward_replace_other_with_guest,
            backward_replace_guest_with_other,
        ),
    ]
