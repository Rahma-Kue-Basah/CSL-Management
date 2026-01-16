from rest_framework import serializers

from .models import S3Upload


class S3UploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    file_url = serializers.SerializerMethodField()
    uploaded_by = serializers.SerializerMethodField()
    uploaded_by_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = S3Upload
        fields = [
            'id',
            'file',
            'file_name',
            'file_url',
            'uploaded_by',
            'uploaded_by_id',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'file_name',
            'file_url',
            'uploaded_by',
            'uploaded_by_id',
            'created_at',
        ]

    def get_file_url(self, obj):
        if obj.url:
            return obj.url
        return obj.file.url if obj.file else None

    def get_uploaded_by(self, obj):
        if not obj.uploaded_by:
            return None
        return obj.uploaded_by.get_username()
