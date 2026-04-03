from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("csluse_auth", "0008_alter_profile_department_alter_profile_user_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="is_mentor",
            field=models.BooleanField(default=False),
        ),
    ]
