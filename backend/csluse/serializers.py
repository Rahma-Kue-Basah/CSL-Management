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
    Schedule,
    FAQ,
    StructureOrganization,
    Pengujian,
    Use,
)
from csluse_auth.serializers import ProfileSerializer, RoomPicDetailSerializer


class RoomPicListSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPicDetailSerializer.Meta.model
        fields = [
            "id",
            "full_name",
        ]

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


class RoomListSerializer(serializers.ModelSerializer):
    pic_detail = RoomPicListSerializer(source="pic", read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "capacity",
            "description",
            "number",
            "floor",
            "pic_detail",
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


class EquipmentRoomListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
        ]


class EquipmentListSerializer(serializers.ModelSerializer):
    room_detail = EquipmentRoomListSerializer(source="room", read_only=True)

    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
            "quantity",
            "status",
            "category",
            "room_detail",
            "is_moveable",
        ]


class EquipmentDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
        ]


class RecordProfileListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileSerializer.Meta.model
        fields = [
            "id",
            "full_name",
        ]


class RecordRoomListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
        ]


class RecordEquipmentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
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


class BookingListSerializer(serializers.ModelSerializer):
    requested_by_detail = RecordProfileListSerializer(source="requested_by", read_only=True)
    approved_by_detail = RecordProfileListSerializer(source="approved_by", read_only=True)
    room_detail = RecordRoomListSerializer(source="room", read_only=True)
    equipment_detail = RecordEquipmentListSerializer(source="equipment", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "code",
            "quantity_equipment",
            "start_time",
            "end_time",
            "purpose",
            "note",
            "status",
            "requested_by_detail",
            "approved_by_detail",
            "room_detail",
            "equipment_detail",
            "created_at",
            "updated_at",
        ]


class BookingUserListSerializer(serializers.ModelSerializer):
    requested_by_detail = RecordProfileListSerializer(source="requested_by", read_only=True)
    room_detail = RecordRoomListSerializer(source="room", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "code",
            "start_time",
            "end_time",
            "purpose",
            "status",
            "requested_by_detail",
            "room_detail",
            "created_at",
        ]


class BorrowSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    class Meta:
        model = Borrow
        fields = '__all__'
        read_only_fields = ['requested_by', 'code']


class BorrowListSerializer(serializers.ModelSerializer):
    requested_by_detail = RecordProfileListSerializer(source="requested_by", read_only=True)
    approved_by_detail = RecordProfileListSerializer(source="approved_by", read_only=True)
    equipment_detail = RecordEquipmentListSerializer(source="equipment", read_only=True)

    class Meta:
        model = Borrow
        fields = [
            "id",
            "code",
            "quantity",
            "start_time",
            "end_time",
            "end_time_actual",
            "purpose",
            "note",
            "status",
            "requested_by_detail",
            "approved_by_detail",
            "equipment_detail",
            "created_at",
            "updated_at",
        ]


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


class ScheduleSerializer(serializers.ModelSerializer):
    room_detail = RoomListSerializer(source="room", read_only=True)
    created_by_detail = ProfileSerializer(source="created_by", read_only=True)

    class Meta:
        model = Schedule
        fields = [
            "id",
            "title",
            "description",
            "start_time",
            "end_time",
            "category",
            "room",
            "room_detail",
            "created_by",
            "created_by_detail",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by"]


class FAQSerializer(serializers.ModelSerializer):
    created_by_detail = ProfileSerializer(source="created_by", read_only=True)

    class Meta:
        model = FAQ
        fields = [
            "id",
            "question",
            "answer",
            "created_by",
            "created_by_detail",
            "created_at",
            "updated_at",
        ]


class CalendarEventSerializer(serializers.Serializer):
    id = serializers.CharField()
    source = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField(allow_null=True)
    category = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    status = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    room_id = serializers.UUIDField(allow_null=True, required=False)
    room_name = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    requested_by_name = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    requested_by_role = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )


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


class PengujianListSerializer(serializers.ModelSerializer):
    requested_by_detail = RecordProfileListSerializer(source="requested_by", read_only=True)
    approved_by_detail = RecordProfileListSerializer(source="approved_by", read_only=True)

    class Meta:
        model = Pengujian
        fields = [
            "id",
            "code",
            "name",
            "institution",
            "institution_address",
            "email",
            "phone_number",
            "sample_name",
            "sample_type",
            "sample_brand",
            "sample_packaging",
            "sample_weight",
            "sample_quantity",
            "sample_testing_serving",
            "sample_testing_method",
            "sample_testing_type",
            "status",
            "requested_by_detail",
            "approved_by_detail",
            "created_at",
            "updated_at",
        ]


class UseSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    class Meta:
        model = Use
        fields = '__all__'
        read_only_fields = ['requested_by', 'code']


class UseListSerializer(serializers.ModelSerializer):
    requested_by_detail = RecordProfileListSerializer(source="requested_by", read_only=True)
    approved_by_detail = RecordProfileListSerializer(source="approved_by", read_only=True)
    equipment_detail = RecordEquipmentListSerializer(source="equipment", read_only=True)

    class Meta:
        model = Use
        fields = [
            "id",
            "code",
            "quantity",
            "start_time",
            "end_time",
            "purpose",
            "note",
            "status",
            "requested_by_detail",
            "approved_by_detail",
            "equipment_detail",
            "created_at",
            "updated_at",
        ]


class DashboardOverviewTotalsSerializer(serializers.Serializer):
    total_requests = serializers.IntegerField()
    pending = serializers.IntegerField()
    approved = serializers.IntegerField()
    completed = serializers.IntegerField()
    rejected = serializers.IntegerField()


class DashboardOverviewUpcomingSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    type = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField(allow_null=True)
    href = serializers.CharField()


class DashboardOverviewActivitySerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    code = serializers.CharField(allow_blank=True)
    type = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    href = serializers.CharField()


class DashboardOverviewSerializer(serializers.Serializer):
    totals = DashboardOverviewTotalsSerializer()
    upcoming_approved = DashboardOverviewUpcomingSerializer(allow_null=True)
    recent_activities = DashboardOverviewActivitySerializer(many=True)
