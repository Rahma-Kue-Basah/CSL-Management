import os

from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated

from .models import Image
from .serializers import ImageSerializer


class ImageViewSet(viewsets.ModelViewSet):
    
    queryset = Image.objects.all().order_by('-created_at')
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        uploaded_image = self.request.FILES.get('image')
        name = os.path.basename(uploaded_image.name) if uploaded_image else ''
        instance = serializer.save(
            created_by=self.request.user if self.request.user.is_authenticated else None,
            name=name,
        )
        if instance.image and not instance.url:
            instance.url = instance.image.url
            instance.save(update_fields=['url'])