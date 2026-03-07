from rest_framework import serializers

from typing import Optional

from .models import (
    Image,
    Room,
    Equipment,
    Booking,
    Borrow,
    LabProfile,
    Facility,
    Announcement,
    StructureOrganization,
    Pengujian,
    Use,
)
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
    image_detail = ImageSerializer(source="image", read_only=True)

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
            "image_detail",
        ]


class RoomDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
        ]


class EquipmentSerializer(serializers.ModelSerializer):
    image_detail = ImageSerializer(source="image", read_only=True)
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
            "image_detail",
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


class LabProfileSerializer(serializers.ModelSerializer):
    images_detail = ImageSerializer(source="images", many=True, read_only=True)

    class Meta:
        model = LabProfile
        fields = [
            "id",
            "title",
            "description",
            "images",
            "images_detail",
        ]


class FacilitySerializer(serializers.ModelSerializer):
    image_detail = ImageSerializer(source="image", read_only=True)

    class Meta:
        model = Facility
        fields = [
            "id",
            "name",
            "description",
            "image",
            "image_detail",
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    image_detail = ImageSerializer(source="image", read_only=True)
    created_by_detail = ProfileSerializer(source="created_by", read_only=True)

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "content",
            "image",
            "image_detail",
            "created_by",
            "created_by_detail",
            "created_at",
            "updated_at",
        ]


class StructureOrganizationSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StructureOrganization
        fields = [
            "id",
            "title",
            "name",
        ]


class StructureOrganizationSerializer(serializers.ModelSerializer):
    parent_detail = StructureOrganizationSimpleSerializer(source="parent", read_only=True)

    class Meta:
        model = StructureOrganization
        fields = [
            "id",
            "title",
            "name",
            "parent",
            "parent_detail",
        ]


class PengujianSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)

    class Meta:
        model = Pengujian
        fields = '__all__'
        read_only_fields = ['requested_by', 'code']


class UseSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    class Meta:
        model = Use
        fields = '__all__'
        read_only_fields = ['requested_by', 'code']
