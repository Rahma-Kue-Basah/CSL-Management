from rest_framework import serializers

from typing import Optional

from .models import Image, Room, Equipment, Booking, Borrow

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

    def get_url(self, obj) -> Optional[str]:
        if obj.url:
            return obj.url
        return obj.image.url if obj.image else None


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['requested_by']


class BorrowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Borrow
        fields = '__all__'
        read_only_fields = ['requested_by']
