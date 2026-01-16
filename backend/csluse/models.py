from django.conf import settings
from django.db import models


class S3Upload(models.Model):
    file = models.FileField(upload_to='uploads/')
    file_name = models.CharField(max_length=255, blank=True)
    url = models.URLField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='s3_uploads',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        uploader = self.uploaded_by.get_username() if self.uploaded_by else "anonymous"
        return f"{self.id} - {self.file_name or self.file.name} ({uploader})"
