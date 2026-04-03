from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("csluse", "0026_delete_facility"),
    ]

    operations = [
        migrations.DeleteModel(
            name="StructureOrganization",
        ),
    ]
