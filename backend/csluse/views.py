import os

from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny

from .models import S3Upload
from .serializers import S3UploadSerializer


class S3UploadViewSet(viewsets.ModelViewSet):
    queryset = S3Upload.objects.all().order_by('-created_at')
    serializer_class = S3UploadSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        file_name = os.path.basename(uploaded_file.name) if uploaded_file else ''
        instance = serializer.save(
            uploaded_by=self.request.user if self.request.user.is_authenticated else None,
            file_name=file_name,
        )
        if instance.file and not instance.url:
            instance.url = instance.file.url
            instance.save(update_fields=['url'])
