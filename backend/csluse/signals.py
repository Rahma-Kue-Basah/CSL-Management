from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Image


@receiver(post_delete, sender=Image)
def delete_image(sender, instance, **kwargs):
    image_name = instance.image.name
    if image_name:
        instance.image.storage.delete(image_name)
