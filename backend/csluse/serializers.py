from rest_framework import serializers

from .models import Image

class ImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Image
        fields = [
            'image',
            'name',
            'url',
        ]
        read_only_fields = [
            'name',
            'url',
        ]

    def get_url(self, obj):
        if obj.url:
            return obj.url
        return obj.image.url if obj.image else None