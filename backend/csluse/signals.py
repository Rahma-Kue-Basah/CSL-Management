from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import S3Upload


@receiver(post_delete, sender=S3Upload)
def delete_s3_file(sender, instance, **kwargs):
    file_name = instance.file.name
    if file_name:
        instance.file.storage.delete(file_name)
