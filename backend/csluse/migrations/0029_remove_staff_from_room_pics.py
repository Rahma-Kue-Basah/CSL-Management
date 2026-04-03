from django.db import migrations


def remove_staff_from_room_pics(apps, schema_editor):
    Room = apps.get_model("csluse", "Room")

    for room in Room.objects.prefetch_related("pics").all():
        staff_pic_ids = [
            profile.id
            for profile in room.pics.all()
            if str(getattr(profile, "role", "")).strip().lower() == "staff"
        ]
        if staff_pic_ids:
            room.pics.remove(*staff_pic_ids)


class Migration(migrations.Migration):

    dependencies = [
        ("csluse", "0028_faq_image"),
    ]

    operations = [
        migrations.RunPython(
            remove_staff_from_room_pics,
            migrations.RunPython.noop,
        ),
    ]
