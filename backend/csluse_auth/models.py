from django.db import models
from django.contrib.auth import get_user_model
import uuid

class BaseModel(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Profile(BaseModel):
    user = models.OneToOneField(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="profile",
    )
    full_name = models.CharField(max_length=150, blank=True)

    USER_TYPE_CHOICES = [
        ('internal', 'Internal'),
        ('external', 'External'),
    ]

    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='external')

    def __str__(self):
        return f"{self.user.email} - {self.full_name or 'profile'} - {self.user_type}"