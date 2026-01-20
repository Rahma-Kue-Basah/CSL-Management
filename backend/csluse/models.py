from django.db import models
from django.contrib.auth import get_user_model
import uuid

class BaseModel(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Image(BaseModel):
    image = models.ImageField(upload_to='images/')
    name = models.CharField(max_length=255, blank=True)
    url = models.URLField(blank=True)

    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='images_created_by',
    )

    def __str__(self):
        return f"{self.name or self.image.name} - {self.created_by.email if self.created_by else 'unknown'} - {self.created_at}"