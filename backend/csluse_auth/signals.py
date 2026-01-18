from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile

User = get_user_model()


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    if not created:
        return

    # Buat full_name dari first_name dan last_name jika ada (untuk OAuth)
    full_name = f"{instance.first_name} {instance.last_name}".strip()
    
    profile, profile_created = Profile.objects.get_or_create(
        user=instance,
        defaults={'full_name': full_name} if full_name else {}
    )
    
    # Update full_name hanya jika profile sudah ada, full_name kosong, 
    # dan ada first_name/last_name dari OAuth
    if not profile_created and not profile.full_name and full_name:
        profile.full_name = full_name
        profile.save()
