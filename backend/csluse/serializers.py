from rest_framework import serializers

from typing import Optional

from .models import Image, Room, Equipment, Booking, Borrow
from csluse_auth.serializers import ProfileSerializer, RoomPicDetailSerializer

class ImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Image
        fields = [
            'id',
            'image',
            'name',
            'url',
        ]
        read_only_fields = [
            'id',
            'name',
            'url',
        ]

    def get_url(self, obj) -> Optional[str]:
        if obj.url:
            return obj.url
        return obj.image.url if obj.image else None


class RoomSerializer(serializers.ModelSerializer):
    pic_detail = RoomPicDetailSerializer(source="pic", read_only=True)
    # image_detail = ImageSerializer(source="image", read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "capacity",
            "description",
            "number",
            "floor",
            "pic",
            "image",
            "pic_detail",
            # "image_detail",
        ]


class RoomDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
        ]


class EquipmentSerializer(serializers.ModelSerializer):
    # image_detail = ImageSerializer(source="image", read_only=True)
    room_detail = RoomSerializer(source="room", read_only=True)

    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
            "description",
            "quantity",
            "status",
            "category",
            "image",
            # "image_detail",
            "room",
            "room_detail",
            "is_moveable",
        ]


class BookingSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)
    room_detail = RoomSerializer(source="room", read_only=True)
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['requested_by', 'code']


class BorrowSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    class Meta:
        model = Borrow
        fields = '__all__'
        read_only_fields = ['requested_by', 'code']
