from django.db import migrations, models
from django.utils import timezone


def _backfill_codes(apps, schema_editor):
    Booking = apps.get_model("csluse", "Booking")
    Borrow = apps.get_model("csluse", "Borrow")

    def fill(model_cls, prefix):
        counters = {}
        for obj in model_cls.objects.order_by("created_at", "id"):
            if obj.code:
                continue
            dt = obj.created_at or timezone.now()
            yymm = dt.strftime("%y%m")
            counters[yymm] = counters.get(yymm, 0) + 1
            obj.code = f"{prefix}{yymm}-{counters[yymm]:03d}"
            obj.save(update_fields=["code"])

    fill(Booking, "BR")
    fill(Borrow, "BE")


def _noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("csluse", "0004_alter_room_floor_notification"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="code",
            field=models.CharField(
                editable=False,
                max_length=12,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="borrow",
            name="code",
            field=models.CharField(
                editable=False,
                max_length=12,
                null=True,
                unique=True,
            ),
        ),
        migrations.RunPython(_backfill_codes, _noop_reverse),
        migrations.AlterField(
            model_name="booking",
            name="code",
            field=models.CharField(
                editable=False,
                max_length=12,
                unique=True,
            ),
        ),
        migrations.AlterField(
            model_name="borrow",
            name="code",
            field=models.CharField(
                editable=False,
                max_length=12,
                unique=True,
            ),
        ),
    ]
