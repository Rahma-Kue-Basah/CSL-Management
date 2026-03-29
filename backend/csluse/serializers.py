from rest_framework import serializers
from django.utils import timezone
import re

from typing import Optional

from csluse_auth.models import Profile
from .models import (
    Image,
    Room,
    Equipment,
    Booking,
    BookingEquipmentItem,
    Borrow,
    Facility,
    Announcement,
    Schedule,
    FAQ,
    StructureOrganization,
    Pengujian,
    Use,
    Notification,
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
    pics = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Profile.objects.all(),
        required=False,
    )
    pics_detail = RoomPicDetailSerializer(source="pics", many=True, read_only=True)
    image_detail = ImageSerializer(source="image", read_only=True)

    def validate_pics(self, value):
        allowed_roles = {"STAFF", "LECTURER", "ADMIN"}
        invalid_profiles = [
            profile.full_name or getattr(profile.user, "email", str(profile))
            for profile in value
            if str(profile.role or "").upper() not in allowed_roles
        ]
        if invalid_profiles:
            raise serializers.ValidationError(
                "PIC harus user dengan role Staff, Lecturer, atau Admin."
            )
        return value

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "capacity",
            "description",
            "number",
            "floor",
            "pics",
            "image",
            "pics_detail",
            "image_detail",
        ]


class RoomListSerializer(serializers.ModelSerializer):
    pics_detail = RoomPicListSerializer(source="pics", many=True, read_only=True)
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
            "pics",
            "pics_detail",
            "image",
            "image_detail",
        ]


class RoomDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "capacity",
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
    image_detail = ImageSerializer(source="image", read_only=True)

    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
            "description",
            "quantity",
            "status",
            "category",
            "room",
            "room_detail",
            "is_moveable",
            "image",
            "image_detail",
        ]


class EquipmentDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
            "quantity",
        ]


class RecordProfileListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ProfileSerializer.Meta.model
        fields = [
            "id",
            "full_name",
            "email",
            "department",
        ]


class RecordRoomListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "number",
            "capacity",
        ]


class RecordEquipmentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            "id",
            "name",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    target_path = serializers.SerializerMethodField()

    def _extract_identifier(self, value: str) -> Optional[str]:
        match = re.search(r"\b(?:PR|PA|US|PS)\d{4}-\d{3}\b", value or "")
        if match:
            return match.group(0)
        return None

    def get_target_path(self, obj):
        title = str(getattr(obj, "title", "") or "")
        message = str(getattr(obj, "message", "") or "")
        combined = f"{title} {message}"
        identifier = self._extract_identifier(combined)
        lower_text = combined.lower()

        if "pengujian" in lower_text:
            return "/sample-testing"

        if not identifier:
            return None

        booking = Booking.objects.filter(code=identifier).values_list("id", flat=True).first()
        if booking is not None:
            return f"/booking-rooms/{booking}"

        borrow = Borrow.objects.filter(code=identifier).values_list("id", flat=True).first()
        if borrow is not None:
            return f"/borrow-equipment/{borrow}"

        use = Use.objects.filter(code=identifier).values_list("id", flat=True).first()
        if use is not None:
            return f"/use-equipment/{use}"

        pengujian = Pengujian.objects.filter(code=identifier).values_list("id", flat=True).first()
        if pengujian is not None:
            return "/sample-testing"

        return None

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "category",
            "message",
            "target_path",
            "created_at",
            "updated_at",
        ]


class BookingEquipmentItemWriteSerializer(serializers.Serializer):
    equipment = serializers.PrimaryKeyRelatedField(queryset=Equipment.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class BookingEquipmentItemDetailSerializer(serializers.ModelSerializer):
    equipment_detail = RecordEquipmentListSerializer(source="equipment", read_only=True)

    class Meta:
        model = BookingEquipmentItem
        fields = [
            "id",
            "quantity",
            "equipment",
            "equipment_detail",
        ]


class BookingSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)
    room_detail = RoomSerializer(source="room", read_only=True)
    equipment_items = BookingEquipmentItemWriteSerializer(many=True, required=False)
    equipment_items_detail = BookingEquipmentItemDetailSerializer(
        source="equipment_items",
        many=True,
        read_only=True,
    )

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        equipment_items = attrs.get("equipment_items")
        room = attrs.get("room") or getattr(instance, "room", None)
        attendee_count = attrs.get("attendee_count", getattr(instance, "attendee_count", 1))
        start_time = attrs.get("start_time", getattr(instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(instance, "end_time", None))
        next_status = attrs.get("status", getattr(instance, "status", "Pending"))

        if instance is None:
            if attrs.get("status") not in (None, "Pending"):
                raise serializers.ValidationError(
                    {"status": "Status booking hanya boleh di-set melalui action endpoint khusus."}
                )
            if attrs.get("approved_by") is not None:
                raise serializers.ValidationError(
                    {"approved_by": "approved_by tidak boleh diisi saat create."}
                )
        else:
            if "status" in attrs:
                if not self.context.get("allow_status_transition"):
                    raise serializers.ValidationError(
                        {"status": "Gunakan action status booking yang spesifik untuk mengubah status."}
                    )
                allowed_next_status = self.context.get("allowed_next_status")
                if allowed_next_status and attrs["status"] != allowed_next_status:
                    raise serializers.ValidationError(
                        {"status": f"Transisi status hanya boleh menuju {allowed_next_status}."}
                    )

            if "approved_by" in attrs:
                raise serializers.ValidationError(
                    {"approved_by": "approved_by tidak boleh diubah langsung."}
                )

            if instance.status != "Pending" and not self.context.get("allow_status_transition"):
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            "Booking yang sudah diproses tidak dapat diubah langsung."
                        ]
                    }
                )

        if attendee_count <= 0:
            raise serializers.ValidationError({"attendee_count": "Jumlah orang harus lebih dari 0."})

        if room and attendee_count > room.capacity:
            raise serializers.ValidationError(
                {
                    "attendee_count": (
                        f"Jumlah orang tidak boleh melebihi kapasitas ruangan "
                        f"({room.capacity} orang)."
                    )
                }
            )

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "Waktu selesai harus lebih besar dari waktu mulai."}
            )

        if room and start_time and end_time and next_status in {"Pending", "Approved"}:
            if next_status == "Approved" and end_time <= timezone.now():
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            "Booking ini sudah melewati waktu yang diminta dan tidak dapat disetujui."
                        ]
                    }
                )

            overlapping_bookings = Booking.objects.filter(
                room=room,
                status="Approved",
                start_time__lt=end_time,
                end_time__gt=start_time,
            )
            if instance:
                overlapping_bookings = overlapping_bookings.exclude(pk=instance.pk)

            if overlapping_bookings.exists():
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            "Ruangan sudah memiliki booking yang disetujui pada rentang waktu tersebut."
                        ]
                    }
                )

        if equipment_items is None:
            return attrs

        if not room:
            raise serializers.ValidationError({"room": "Ruangan wajib dipilih terlebih dahulu."})

        seen_equipment_ids = set()
        for item in equipment_items:
            equipment = item["equipment"]
            quantity = item["quantity"]

            if equipment.id in seen_equipment_ids:
                raise serializers.ValidationError(
                    {"equipment_items": "Peralatan yang sama tidak boleh dipilih lebih dari sekali."}
                )
            seen_equipment_ids.add(equipment.id)

            if equipment.room_id != room.id:
                raise serializers.ValidationError(
                    {"equipment_items": f"{equipment.name} harus berasal dari ruangan {room.name}."}
                )

            if quantity > equipment.quantity:
                raise serializers.ValidationError(
                    {"equipment_items": f"Jumlah {equipment.name} melebihi stok tersedia ({equipment.quantity})."}
                )

        return attrs

    def create(self, validated_data):
        equipment_items = validated_data.pop("equipment_items", [])
        booking = Booking.objects.create(**validated_data)
        self._save_equipment_items(booking, equipment_items)
        return booking

    def update(self, instance, validated_data):
        equipment_items = validated_data.pop("equipment_items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if equipment_items is not None:
            instance.equipment_items.all().delete()
            self._save_equipment_items(instance, equipment_items)

        return instance

    def _save_equipment_items(self, booking, equipment_items):
        for item in equipment_items:
            BookingEquipmentItem.objects.create(
                booking=booking,
                equipment=item["equipment"],
                quantity=item["quantity"],
            )

    class Meta:
        model = Booking
        fields = [
            "id",
            "code",
            "requested_by",
            "requested_by_detail",
            "room",
            "room_detail",
            "start_time",
            "end_time",
            "attendee_count",
            "attendee_names",
            "purpose",
            "note",
            "status",
            "approved_by",
            "approved_by_detail",
            "equipment_items",
            "equipment_items_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ['requested_by', 'code', 'approved_by']


class BookingListSerializer(serializers.ModelSerializer):
    requested_by_detail = RecordProfileListSerializer(source="requested_by", read_only=True)
    approved_by_detail = RecordProfileListSerializer(source="approved_by", read_only=True)
    room_detail = RecordRoomListSerializer(source="room", read_only=True)
    equipment_items_detail = BookingEquipmentItemDetailSerializer(
        source="equipment_items",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "code",
            "start_time",
            "end_time",
            "attendee_count",
            "attendee_names",
            "purpose",
            "note",
            "status",
            "requested_by_detail",
            "approved_by_detail",
            "room_detail",
            "equipment_items_detail",
            "created_at",
            "updated_at",
        ]


class BookingUserListSerializer(serializers.ModelSerializer):
    requested_by_detail = RecordProfileListSerializer(source="requested_by", read_only=True)
    room_detail = RecordRoomListSerializer(source="room", read_only=True)
    equipment_items_detail = BookingEquipmentItemDetailSerializer(
        source="equipment_items",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "code",
            "start_time",
            "end_time",
            "attendee_count",
            "attendee_names",
            "purpose",
            "status",
            "requested_by_detail",
            "room_detail",
            "equipment_items_detail",
            "created_at",
        ]


class BorrowSerializer(serializers.ModelSerializer):
    requested_by_detail = ProfileSerializer(source="requested_by", read_only=True)
    approved_by_detail = ProfileSerializer(source="approved_by", read_only=True)
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        start_time = attrs.get("start_time", getattr(instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(instance, "end_time", None))

        if end_time is None:
            raise serializers.ValidationError({"end_time": "Waktu selesai peminjaman wajib diisi."})

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError(
                {"end_time": "Waktu selesai peminjaman harus setelah waktu mulai."}
            )

        if instance is None:
            if attrs.get("status") not in (None, "Pending"):
                raise serializers.ValidationError(
                    {"status": "Status borrow hanya boleh di-set melalui action endpoint khusus."}
                )
            if attrs.get("approved_by") is not None:
                raise serializers.ValidationError(
                    {"approved_by": "approved_by tidak boleh diisi saat create."}
                )
            if attrs.get("end_time_actual") is not None:
                raise serializers.ValidationError(
                    {"end_time_actual": "end_time_actual hanya boleh diisi melalui action endpoint khusus."}
                )
            if attrs.get("inspection_note") is not None:
                raise serializers.ValidationError(
                    {"inspection_note": "inspection_note hanya boleh diisi melalui action endpoint inspeksi."}
                )
            return attrs

        if "status" in attrs:
            if not self.context.get("allow_status_transition"):
                raise serializers.ValidationError(
                    {"status": "Gunakan action status borrow yang spesifik untuk mengubah status."}
                )
            allowed_next_status = self.context.get("allowed_next_status")
            if allowed_next_status and attrs["status"] != allowed_next_status:
                raise serializers.ValidationError(
                    {"status": f"Transisi status hanya boleh menuju {allowed_next_status}."}
                )

        if "end_time_actual" in attrs and not self.context.get("allow_end_time_actual"):
            raise serializers.ValidationError(
                {"end_time_actual": "Gunakan action penerimaan pengembalian untuk mengisi end_time_actual."}
            )

        if "approved_by" in attrs:
            raise serializers.ValidationError(
                {"approved_by": "approved_by tidak boleh diubah langsung."}
            )

        if "inspection_note" in attrs:
            raise serializers.ValidationError(
                {"inspection_note": "Gunakan action inspeksi borrow untuk mengisi inspection_note."}
            )

        return attrs

    class Meta:
        model = Borrow
        fields = '__all__'
        read_only_fields = ['requested_by', 'code', 'approved_by']


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
            "inspection_note",
            "status",
            "requested_by_detail",
            "approved_by_detail",
            "equipment_detail",
            "created_at",
            "updated_at",
        ]


class RecordBulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        error_messages={
            "empty": "Pilih minimal satu record untuk dihapus.",
        },
    )

    def validate_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        if len(unique_ids) != len(value):
            raise serializers.ValidationError("Terdapat ID record yang duplikat.")
        return unique_ids


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


class AnnouncementListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "content",
            "created_at",
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_detail = ProfileSerializer(source="created_by", read_only=True)

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "content",
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


class ScheduleFeedItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    source = serializers.CharField()
    source_id = serializers.CharField()
    title = serializers.CharField()
    room_name = serializers.CharField(
        allow_blank=True,
        allow_null=True,
        required=False,
    )
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField(allow_null=True)
    category_label = serializers.CharField()
    schedule_item = serializers.DictField(allow_null=True, required=False)


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

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        if instance is None:
            if attrs.get("status") not in (None, "Pending"):
                raise serializers.ValidationError(
                    {"status": "Status pengujian sampel hanya boleh di-set melalui action endpoint khusus."}
                )
            if attrs.get("approved_by") is not None:
                raise serializers.ValidationError(
                    {"approved_by": "approved_by tidak boleh diisi saat create."}
                )
            return attrs

        if "status" in attrs:
            if not self.context.get("allow_status_transition"):
                raise serializers.ValidationError(
                    {"status": "Gunakan action status pengujian yang spesifik untuk mengubah status."}
                )
            allowed_next_status = self.context.get("allowed_next_status")
            if allowed_next_status and attrs["status"] != allowed_next_status:
                raise serializers.ValidationError(
                    {"status": f"Transisi status hanya boleh menuju {allowed_next_status}."}
                )

        if "approved_by" in attrs:
            raise serializers.ValidationError(
                {"approved_by": "approved_by tidak boleh diubah langsung."}
            )

        if instance.status != "Pending" and not self.context.get("allow_status_transition"):
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "Pengujian sampel yang sudah diproses tidak dapat diubah langsung."
                    ]
                }
            )

        return attrs

    class Meta:
        model = Pengujian
        fields = '__all__'
        read_only_fields = ['requested_by', 'code', 'approved_by']


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

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        start_time = attrs.get("start_time", getattr(instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(instance, "end_time", None))
        next_status = attrs.get("status", getattr(instance, "status", "Pending"))

        if instance is None:
            if attrs.get("status") not in (None, "Pending"):
                raise serializers.ValidationError(
                    {"status": "Status penggunaan alat hanya boleh di-set melalui action endpoint khusus."}
                )
            if attrs.get("approved_by") is not None:
                raise serializers.ValidationError(
                    {"approved_by": "approved_by tidak boleh diisi saat create."}
                )
        else:
            if "status" in attrs:
                if not self.context.get("allow_status_transition"):
                    raise serializers.ValidationError(
                        {"status": "Gunakan action status penggunaan alat yang spesifik untuk mengubah status."}
                    )
                allowed_next_status = self.context.get("allowed_next_status")
                if allowed_next_status and attrs["status"] != allowed_next_status:
                    raise serializers.ValidationError(
                        {"status": f"Transisi status hanya boleh menuju {allowed_next_status}."}
                    )

            if "approved_by" in attrs:
                raise serializers.ValidationError(
                    {"approved_by": "approved_by tidak boleh diubah langsung."}
                )

            if instance.status != "Pending" and not self.context.get("allow_status_transition"):
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            "Penggunaan alat yang sudah diproses tidak dapat diubah langsung."
                        ]
                    }
                )

        if next_status == "Approved":
            effective_deadline = end_time or start_time
            if effective_deadline and effective_deadline <= timezone.now():
                raise serializers.ValidationError(
                    {
                        "non_field_errors": [
                            "Pengajuan penggunaan alat ini sudah melewati waktu yang diminta dan tidak dapat disetujui."
                        ]
                    }
                )

        return attrs

    class Meta:
        model = Use
        fields = '__all__'
        read_only_fields = ['requested_by', 'code', 'approved_by']


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
    expired = serializers.IntegerField()


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
