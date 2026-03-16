import os
from datetime import datetime

from django.contrib.admin.models import ADDITION, CHANGE, DELETION
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import (
    Image,
    Room,
    Equipment,
    Booking,
    Borrow,
    Facility,
    Announcement,
    Schedule,
    FAQ,
    StructureOrganization,
    Pengujian,
    Use,
)
from .serializers import (
    ImageSerializer,
    RoomSerializer,
    RoomListSerializer,
    RoomDropdownSerializer,
    EquipmentSerializer,
    EquipmentListSerializer,
    EquipmentDropdownSerializer,
    BookingSerializer,
    BookingListSerializer,
    BookingUserListSerializer,
    BorrowSerializer,
    BorrowListSerializer,
    FacilitySerializer,
    AnnouncementListSerializer,
    AnnouncementSerializer,
    ScheduleSerializer,
    FAQSerializer,
    CalendarEventSerializer,
    StructureOrganizationSerializer,
    PengujianSerializer,
    PengujianListSerializer,
    UseSerializer,
    UseListSerializer,
    DashboardOverviewSerializer,
)
from csluse_auth.audit import log_admin_action
from csluse_auth.permissions import (
    IsStaffOrAbove,
    has_role,
    STAFF,
    ADMINISTRATOR,
    SUPER_ADMINISTRATOR,
)

STATUS_VALUE_MAP = {
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "borrowed": "Borrowed",
    "returned": "Returned",
    "overdue": "Overdue",
    "lost_damaged": "Lost/Damaged",
    "lost/damaged": "Lost/Damaged",
    "in_use": "In Use",
    "in use": "In Use",
}


def normalize_status_value(value):
    if value is None:
        return value
    raw = str(value).strip()
    if not raw:
        return raw
    return STATUS_VALUE_MAP.get(raw.lower(), raw)


class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def _profile_display_name(profile):
    if not profile:
        return None
    return (
        getattr(profile, 'full_name', None)
        or getattr(getattr(profile, 'user', None), 'email', None)
        or str(profile)
    )


def _profile_role(profile):
    if not profile:
        return None
    return getattr(profile, "role", None)


def _overview_title(value, fallback):
    if value is None:
        return fallback
    raw = str(value).strip()
    return raw or fallback


class ImageViewSet(viewsets.ModelViewSet):
    
    queryset = Image.objects.all().order_by('-created_at')
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()

    def perform_create(self, serializer):
        uploaded_image = self.request.FILES.get('image')
        name = os.path.basename(uploaded_image.name) if uploaded_image else ''
        instance = serializer.save(
            created_by=getattr(self.request.user, 'profile', None)
            if self.request.user.is_authenticated else None,
            name=name,
        )
        if instance.image and not instance.url:
            instance.url = instance.image.url
            instance.save(update_fields=['url'])


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.prefetch_related('pics').select_related('image').order_by('-created_at')
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.action == "dropdown":
            return RoomDropdownSerializer
        if self.action == "list":
            return RoomListSerializer
        return RoomSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()

    @extend_schema(
        parameters=[
            OpenApiParameter("pic", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="PIC of the room"),
            OpenApiParameter("pic_id", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="Alias for pic"),
            OpenApiParameter("floor", OpenApiTypes.STR, OpenApiParameter.QUERY),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        pic_id = self.request.query_params.get('pic') or self.request.query_params.get('pic_id')
        floor = self.request.query_params.get('floor')

        # Filter params: pic, floor, capacity range, created range
        if pic_id:
            qs = qs.filter(pics__id=pic_id).distinct()
        if floor:
            qs = qs.filter(floor=floor)

        return qs

    def perform_update(self, serializer):
        instance = self.get_object()
        old_image = instance.image
        new_instance = serializer.save()
        log_admin_action(
            self.request.user,
            new_instance,
            CHANGE,
            "Updated room via CSL Admin (inventory).",
        )

        if old_image and (new_instance.image is None or old_image.id != new_instance.image.id):
            try:
                if old_image.image:
                    old_image.image.delete(save=False)
            finally:
                old_image.delete()

    def perform_create(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            instance,
            ADDITION,
            "Created room via CSL Admin (inventory).",
        )

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted room via CSL Admin (inventory).",
        )
        image = instance.image
        super().perform_destroy(instance)
        if image:
            try:
                if image.image:
                    image.image.delete(save=False)
            finally:
                image.delete()

    @action(detail=False, methods=['get'], url_path='dropdown')
    def dropdown(self, request):
        queryset = self.get_queryset().order_by('name')
        serializer = RoomDropdownSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        room = self.get_object()
        start_raw = request.query_params.get('start')
        end_raw = request.query_params.get('end')

        start = parse_datetime(start_raw) if start_raw else None
        end = parse_datetime(end_raw) if end_raw else None

        if not start or not end:
            return Response(
                {'detail': 'start and end query params (ISO datetime) are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if timezone.is_naive(start):
            start = timezone.make_aware(start, timezone.get_default_timezone())
        if timezone.is_naive(end):
            end = timezone.make_aware(end, timezone.get_default_timezone())
        if start >= end:
            return Response(
                {'detail': 'start must be before end'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocking_statuses = ['Pending', 'Approved']
        bookings = (
            Booking.objects
            .filter(
                room=room,
                status__in=blocking_statuses,
                start_time__lt=end,
                end_time__gt=start,
            )
            .values('id', 'start_time', 'end_time', 'status')
        )

        return Response({'occupied': list(bookings)})


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = (
        Equipment.objects
        .select_related('room', 'room__image', 'image')
        .prefetch_related('room__pics')
        .order_by('-created_at')
    )
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.action == "dropdown":
            return EquipmentDropdownSerializer
        if self.action == "list":
            return EquipmentListSerializer
        return EquipmentSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()

    @extend_schema(
        parameters=[
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("category", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("room", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("pic", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="PIC of the room"),
            OpenApiParameter("pic_id", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="Alias for pic"),
            OpenApiParameter("is_moveable", OpenApiTypes.BOOL, OpenApiParameter.QUERY),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        room_id = self.request.query_params.get('room')
        pic_id = self.request.query_params.get('pic') or self.request.query_params.get('pic_id')
        is_moveable = self.request.query_params.get('is_moveable')


        # Filter params: status, category, room, pic, is_moveable, created range
        if status_param:
            qs = qs.filter(status=normalize_status_value(status_param))
        if category:
            qs = qs.filter(category=category)
        if room_id:
            qs = qs.filter(room_id=room_id)
        if pic_id:
            qs = qs.filter(room__pics__id=pic_id).distinct()
        if is_moveable is not None:
            if str(is_moveable).lower() in ['true', '1', 'yes']:
                qs = qs.filter(is_moveable=True)
            elif str(is_moveable).lower() in ['false', '0', 'no']:
                qs = qs.filter(is_moveable=False)
        return qs

    def perform_update(self, serializer):
        instance = self.get_object()
        old_image = instance.image
        new_instance = serializer.save()
        log_admin_action(
            self.request.user,
            new_instance,
            CHANGE,
            "Updated equipment via CSL Admin (inventory).",
        )

        if old_image and (new_instance.image is None or old_image.id != new_instance.image.id):
            try:
                if old_image.image:
                    old_image.image.delete(save=False)
            finally:
                old_image.delete()

    def perform_create(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            instance,
            ADDITION,
            "Created equipment via CSL Admin (inventory).",
        )

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted equipment via CSL Admin (inventory).",
        )
        image = instance.image
        super().perform_destroy(instance)
        if image:
            try:
                if image.image:
                    image.image.delete(save=False)
            finally:
                image.delete()

    @action(detail=False, methods=['get'], url_path='dropdown')
    def dropdown(self, request):
        queryset = self.get_queryset().order_by('name')
        serializer = EquipmentDropdownSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        equipment = self.get_object()
        start_raw = request.query_params.get('start')
        end_raw = request.query_params.get('end')

        start = parse_datetime(start_raw) if start_raw else None
        end = parse_datetime(end_raw) if end_raw else None

        if not start or not end:
            return Response(
                {'detail': 'start and end query params (ISO datetime) are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if timezone.is_naive(start):
            start = timezone.make_aware(start, timezone.get_default_timezone())
        if timezone.is_naive(end):
            end = timezone.make_aware(end, timezone.get_default_timezone())
        if start >= end:
            return Response(
                {'detail': 'start must be before end'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking_block = ['Pending', 'Approved']
        borrow_block = ['Pending', 'Approved', 'Borrowed', 'Overdue', 'Lost/Damaged']

        bookings = (
            Booking.objects
            .filter(
                equipment=equipment,
                status__in=booking_block,
                start_time__lt=end,
                end_time__gt=start,
            )
            .values('id', 'start_time', 'end_time', 'status')
        )

        borrows = (
            Borrow.objects
            .filter(
                equipment=equipment,
                status__in=borrow_block,
                start_time__lt=end,
                end_time__gt=start,
            )
            .values('id', 'start_time', 'end_time', 'status')
        )

        occupied = (
            [{'type': 'booking', **item} for item in bookings] +
            [{'type': 'borrow', **item} for item in borrows]
        )

        return Response({'occupied': occupied})


class BookingViewSet(viewsets.ModelViewSet):
    queryset = (
        Booking.objects
        .select_related('room', 'equipment', 'requested_by', 'approved_by')
        .order_by('-created_at')
    )
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def _is_staff_or_above(self):
        user = self.request.user
        return (
            user
            and user.is_authenticated
            and (
                has_role(user, STAFF)
                or has_role(user, ADMINISTRATOR)
                or has_role(user, SUPER_ADMINISTRATOR)
            )
        )

    def _auto_complete_expired_bookings(self):
        now = timezone.now()
        (
            Booking.objects
            .filter(status="Approved", end_time__lt=now)
            .update(status="Completed", updated_at=now)
        )

    def get_serializer_class(self):
        if self.action == "list":
            if self._is_staff_or_above():
                return BookingListSerializer
            return BookingUserListSerializer
        if self.action == "by_month":
            return BookingListSerializer
        return BookingSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("room", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("equipment", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("requested_by", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("pic", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="PIC of the room"),
            OpenApiParameter("pic_id", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="Alias for pic"),
            OpenApiParameter("start_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("end_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def _apply_list_filters(self, qs, allow_requester_filter: bool):
        status_param = self.request.query_params.get('status')
        room_id = self.request.query_params.get('room')
        equipment_id = self.request.query_params.get('equipment')
        requester_id = self.request.query_params.get('requested_by')
        pic_id = self.request.query_params.get('pic') or self.request.query_params.get('pic_id')
        start_after = self.request.query_params.get('start_after')
        end_before = self.request.query_params.get('end_before')
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        if status_param:
            qs = qs.filter(status=normalize_status_value(status_param))
        if room_id:
            qs = qs.filter(room_id=room_id)
        if equipment_id:
            qs = qs.filter(equipment_id=equipment_id)
        if requester_id and allow_requester_filter:
            qs = qs.filter(requested_by_id=requester_id)
        if pic_id:
            qs = qs.filter(room__pics__id=pic_id).distinct()
        if start_after:
            qs = qs.filter(start_time__gte=start_after)
        if end_before:
            qs = qs.filter(end_time__lte=end_before)
        if created_after:
            qs = qs.filter(created_at__gte=created_after)
        if created_before:
            qs = qs.filter(created_at__lte=created_before)
        return qs

    def get_queryset(self):
        self._auto_complete_expired_bookings()
        qs = super().get_queryset()
        is_staff_or_above = self._is_staff_or_above()

        # User-level access: non staff/admin can only see their own submitted bookings.
        if not is_staff_or_above:
            qs = qs.filter(requested_by=getattr(self.request.user, "profile", None))

        return self._apply_list_filters(qs, allow_requester_filter=is_staff_or_above)

    def perform_create(self, serializer):
        serializer.save(requested_by=getattr(self.request.user, 'profile', None))

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted booking record via CSL Admin.",
        )
        super().perform_destroy(instance)

    @action(detail=False, methods=['get'], url_path='my')
    def my(self, request):
        qs = super().get_queryset().filter(requested_by=getattr(request.user, "profile", None))
        qs = self._apply_list_filters(qs, allow_requester_filter=False)

        page = self.paginate_queryset(qs)
        serializer = BookingUserListSerializer(page if page is not None else qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='all')
    def all(self, request):
        if not self._is_staff_or_above():
            raise PermissionDenied("Anda tidak memiliki akses untuk melihat seluruh data booking.")

        qs = self._apply_list_filters(super().get_queryset(), allow_requester_filter=True)
        page = self.paginate_queryset(qs)
        serializer = BookingListSerializer(page if page is not None else qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-month')
    def by_month(self, request):
        month_str = request.query_params.get('month')
        if not month_str:
            return Response(
                {'detail': 'month query param required, format YYYY-MM'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            year, month = map(int, month_str.split('-'))
            start = timezone.make_aware(datetime(year, month, 1), timezone.get_default_timezone())
        except Exception:
            return Response(
                {'detail': 'month must be in format YYYY-MM'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # compute start of next month
        if month == 12:
            end = timezone.make_aware(datetime(year + 1, 1, 1), timezone.get_default_timezone())
        else:
            end = timezone.make_aware(datetime(year, month + 1, 1), timezone.get_default_timezone())

        statuses = request.query_params.getlist('status') or ['Approved']
        statuses = [normalize_status_value(item) for item in statuses]

        qs = self.get_queryset().filter(
            status__in=statuses,
            start_time__lt=end,
            end_time__gte=start,
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Approved', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Rejected', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Completed', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class BorrowViewSet(viewsets.ModelViewSet):
    queryset = (
        Borrow.objects
        .select_related('equipment', 'requested_by', 'approved_by')
        .order_by('-created_at')
    )
    serializer_class = BorrowSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.action == "list":
            return BorrowListSerializer
        return BorrowSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("equipment", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("requested_by", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("pic", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="PIC of the equipment's room"),
            OpenApiParameter("pic_id", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="Alias for pic"),
            OpenApiParameter("start_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("end_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        equipment_id = self.request.query_params.get('equipment')
        requester_id = self.request.query_params.get('requested_by')
        pic_id = self.request.query_params.get('pic') or self.request.query_params.get('pic_id')
        start_after = self.request.query_params.get('start_after')
        end_before = self.request.query_params.get('end_before')
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        # Filter params: status, equipment, requested_by, pic, start_after, end_before, created range
        if status_param:
            qs = qs.filter(status=normalize_status_value(status_param))
        if equipment_id:
            qs = qs.filter(equipment_id=equipment_id)
        if requester_id:
            qs = qs.filter(requested_by_id=requester_id)
        if pic_id:
            qs = qs.filter(equipment__room__pics__id=pic_id).distinct()
        if start_after:
            qs = qs.filter(start_time__gte=start_after)
        if end_before:
            qs = qs.filter(end_time__lte=end_before)
        if created_after:
            qs = qs.filter(created_at__gte=created_after)
        if created_before:
            qs = qs.filter(created_at__lte=created_before)
        return qs

    def perform_create(self, serializer):
        serializer.save(requested_by=getattr(self.request.user, 'profile', None))

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted borrow record via CSL Admin.",
        )
        super().perform_destroy(instance)

    @action(detail=False, methods=['get'], url_path='by-month')
    def by_month(self, request):
        month_str = request.query_params.get('month')
        if not month_str:
            return Response(
                {'detail': 'month query param required, format YYYY-MM'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            year, month = map(int, month_str.split('-'))
            start = timezone.make_aware(datetime(year, month, 1), timezone.get_default_timezone())
        except Exception:
            return Response(
                {'detail': 'month must be in format YYYY-MM'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if month == 12:
            end = timezone.make_aware(datetime(year + 1, 1, 1), timezone.get_default_timezone())
        else:
            end = timezone.make_aware(datetime(year, month + 1, 1), timezone.get_default_timezone())

        statuses = request.query_params.getlist('status') or ['Approved', 'Borrowed']
        statuses = [normalize_status_value(item) for item in statuses]

        qs = self.get_queryset().filter(
            status__in=statuses,
            start_time__lt=end,
            end_time__gte=start,
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='return')
    def return_item(self, request, pk=None):
        instance = self.get_object()
        end_time_actual = request.data.get('end_time_actual') or timezone.now()

        serializer = self.get_serializer(
            instance,
            data={'status': 'Returned', 'end_time_actual': end_time_actual, **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Approved', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Rejected', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)


class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.select_related('image').order_by('-created_at')
    serializer_class = FacilitySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.select_related('created_by').order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.action == "list":
            return AnnouncementListSerializer
        return AnnouncementSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=getattr(self.request.user, 'profile', None))
        log_admin_action(
            self.request.user,
            instance,
            ADDITION,
            "Created announcement via CSL Admin.",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            instance,
            CHANGE,
            "Updated announcement via CSL Admin.",
        )

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted announcement via CSL Admin.",
        )
        super().perform_destroy(instance)


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related('room', 'created_by').order_by('start_time')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        room_id = self.request.query_params.get('room')
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')
        start_raw = self.request.query_params.get('start')
        end_raw = self.request.query_params.get('end')

        if room_id:
            qs = qs.filter(room_id=room_id)
        if is_active is not None:
            qs = qs.filter(is_active=str(is_active).lower() in ['1', 'true', 'yes'])
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        start = parse_datetime(start_raw) if start_raw else None
        end = parse_datetime(end_raw) if end_raw else None
        if start:
            if timezone.is_naive(start):
                start = timezone.make_aware(start, timezone.get_default_timezone())
            qs = qs.filter(end_time__gte=start)
        if end:
            if timezone.is_naive(end):
                end = timezone.make_aware(end, timezone.get_default_timezone())
            qs = qs.filter(start_time__lte=end)

        return qs

    def perform_create(self, serializer):
        instance = serializer.save(created_by=getattr(self.request.user, 'profile', None))
        log_admin_action(
            self.request.user,
            instance,
            ADDITION,
            "Created schedule via CSL Admin.",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            instance,
            CHANGE,
            "Updated schedule via CSL Admin.",
        )

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted schedule via CSL Admin.",
        )
        super().perform_destroy(instance)


class CalendarViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter("start", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("end", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("room", OpenApiTypes.UUID, OpenApiParameter.QUERY),
        ],
        responses=CalendarEventSerializer(many=True),
    )
    def list(self, request):
        start_raw = request.query_params.get('start')
        end_raw = request.query_params.get('end')
        room_id = request.query_params.get('room')

        start = parse_datetime(start_raw) if start_raw else None
        end = parse_datetime(end_raw) if end_raw else None

        if not start or not end:
            return Response(
                {'detail': 'start and end query params (ISO datetime) are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.is_naive(start):
            start = timezone.make_aware(start, timezone.get_default_timezone())
        if timezone.is_naive(end):
            end = timezone.make_aware(end, timezone.get_default_timezone())
        if start >= end:
            return Response(
                {'detail': 'start must be before end'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        schedule_qs = (
            Schedule.objects
            .filter(
                is_active=True,
                start_time__lt=end,
                end_time__gt=start,
            )
            .select_related('room', 'created_by')
        )

        booking_qs = (
            Booking.objects
            .filter(
                status__in=['Approved', 'Completed'],
                start_time__lt=end,
                end_time__gt=start,
            )
            .select_related('room', 'requested_by')
        )

        if room_id:
            schedule_qs = schedule_qs.filter(room_id=room_id)
            booking_qs = booking_qs.filter(room_id=room_id)

        items = []

        for item in schedule_qs:
            items.append({
                'id': str(item.id),
                'source': 'schedule',
                'title': item.title,
                'description': item.description,
                'start_time': item.start_time,
                'end_time': item.end_time,
                'category': item.category,
                'status': 'Scheduled',
                'room_id': item.room_id,
                'room_name': item.room.name if item.room else None,
                'requested_by_name': _profile_display_name(item.created_by),
                'requested_by_role': _profile_role(item.created_by),
            })

        for item in booking_qs:
            items.append({
                'id': str(item.id),
                'source': 'booking',
                'title': item.room.name if item.room else 'Booking Ruangan',
                'description': item.note,
                'start_time': item.start_time,
                'end_time': item.end_time,
                'category': 'Booking',
                'status': item.status,
                'room_id': item.room_id,
                'room_name': item.room.name if item.room else None,
                'requested_by_name': _profile_display_name(item.requested_by),
                'requested_by_role': _profile_role(item.requested_by),
            })

        if (
            has_role(request.user, STAFF)
            or has_role(request.user, ADMINISTRATOR)
            or has_role(request.user, SUPER_ADMINISTRATOR)
        ):
            use_qs = (
                Use.objects
                .filter(
                    start_time__lt=end,
                    status__in=['Approved', 'In Use', 'Completed'],
                )
                .filter(Q(end_time__isnull=True) | Q(end_time__gt=start))
                .select_related('equipment', 'equipment__room', 'requested_by')
            )

            if room_id:
                use_qs = use_qs.filter(equipment__room_id=room_id)

            for item in use_qs:
                room = item.equipment.room if item.equipment else None
                items.append({
                    'id': str(item.id),
                    'source': 'use',
                    'title': f'Penggunaan Alat - {item.equipment.name}',
                    'description': item.note,
                    'start_time': item.start_time,
                    'end_time': item.end_time,
                    'category': 'Equipment Use',
                    'status': item.status,
                    'room_id': room.id if room else None,
                    'room_name': room.name if room else None,
                    'requested_by_name': _profile_display_name(item.requested_by),
                    'requested_by_role': _profile_role(item.requested_by),
                })

        items.sort(key=lambda item: (item['start_time'], item['title']))
        serializer = CalendarEventSerializer(items, many=True)
        return Response(serializer.data)


class DashboardOverviewViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response(
                {
                    "totals": {
                        "total_requests": 0,
                        "pending": 0,
                        "approved": 0,
                        "completed": 0,
                        "rejected": 0,
                    },
                    "upcoming_approved": None,
                    "recent_activities": [],
                }
            )

        now = timezone.now()

        bookings = list(
            Booking.objects
            .filter(requested_by=profile)
            .select_related("room")
            .order_by("-created_at")
        )
        uses = list(
            Use.objects
            .filter(requested_by=profile)
            .select_related("equipment")
            .order_by("-created_at")
        )
        borrows = list(
            Borrow.objects
            .filter(requested_by=profile)
            .select_related("equipment")
            .order_by("-created_at")
        )
        pengujians = list(
            Pengujian.objects
            .filter(requested_by=profile)
            .order_by("-created_at")
        )

        def status_count(items, *statuses):
            normalized_targets = {normalize_status_value(status) for status in statuses}
            return sum(1 for item in items if item.status in normalized_targets)

        upcoming_items = []

        for item in bookings:
            if item.status == "Approved" and item.start_time and item.start_time >= now:
                upcoming_items.append({
                    "id": f"booking-{item.id}",
                    "title": _overview_title(getattr(getattr(item, "room", None), "name", None), item.code or "Booking Ruangan"),
                    "type": "Booking Ruangan",
                    "start_time": item.start_time,
                    "end_time": item.end_time,
                    "href": f"/booking-rooms/{item.id}",
                })

        for item in uses:
            if item.status == "Approved" and item.start_time and item.start_time >= now:
                upcoming_items.append({
                    "id": f"use-{item.id}",
                    "title": _overview_title(getattr(getattr(item, "equipment", None), "name", None), item.code or "Booking Alat"),
                    "type": "Booking Alat",
                    "start_time": item.start_time,
                    "end_time": item.end_time,
                    "href": f"/use-equipment/{item.id}",
                })

        for item in borrows:
            if item.status == "Approved" and item.start_time and item.start_time >= now:
                upcoming_items.append({
                    "id": f"borrow-{item.id}",
                    "title": _overview_title(getattr(getattr(item, "equipment", None), "name", None), item.code or "Peminjaman Alat"),
                    "type": "Peminjaman Alat",
                    "start_time": item.start_time,
                    "end_time": item.end_time,
                    "href": "/borrow-equipment",
                })

        upcoming_items.sort(key=lambda item: item["start_time"])
        upcoming_approved = upcoming_items[0] if upcoming_items else None

        recent_activities = []

        for item in bookings:
            recent_activities.append({
                "id": f"booking-{item.id}",
                "title": _overview_title(getattr(getattr(item, "room", None), "name", None), item.code or "Booking Ruangan"),
                "code": item.code or "",
                "type": "Booking Ruangan",
                "status": item.status,
                "created_at": item.created_at,
                "href": f"/booking-rooms/{item.id}",
            })

        for item in uses:
            recent_activities.append({
                "id": f"use-{item.id}",
                "title": _overview_title(getattr(getattr(item, "equipment", None), "name", None), item.code or "Booking Alat"),
                "code": item.code or "",
                "type": "Booking Alat",
                "status": item.status,
                "created_at": item.created_at,
                "href": f"/use-equipment/{item.id}",
            })

        for item in borrows:
            recent_activities.append({
                "id": f"borrow-{item.id}",
                "title": _overview_title(getattr(getattr(item, "equipment", None), "name", None), item.code or "Peminjaman Alat"),
                "code": item.code or "",
                "type": "Peminjaman Alat",
                "status": item.status,
                "created_at": item.created_at,
                "href": "/borrow-equipment",
            })

        for item in pengujians:
            recent_activities.append({
                "id": f"pengujian-{item.id}",
                "title": _overview_title(item.name, item.code or "Pengujian Sampel"),
                "code": item.code or "",
                "type": "Pengujian Sampel",
                "status": item.status,
                "created_at": item.created_at,
                "href": "/sample-testing",
            })

        recent_activities.sort(key=lambda item: item["created_at"], reverse=True)

        payload = {
            "totals": {
                "total_requests": len(bookings) + len(uses) + len(borrows) + len(pengujians),
                "pending": (
                    status_count(bookings, "Pending")
                    + status_count(uses, "Pending")
                    + status_count(borrows, "Pending")
                    + status_count(pengujians, "Pending")
                ),
                "approved": (
                    status_count(bookings, "Approved")
                    + status_count(uses, "Approved")
                    + status_count(borrows, "Approved")
                    + status_count(pengujians, "Approved")
                ),
                "completed": (
                    status_count(bookings, "Completed")
                    + status_count(uses, "Completed")
                    + status_count(borrows, "Returned")
                    + status_count(pengujians, "Completed")
                ),
                "rejected": (
                    status_count(bookings, "Rejected", "Cancelled")
                    + status_count(uses, "Rejected", "Cancelled")
                    + status_count(borrows, "Rejected", "Cancelled")
                    + status_count(pengujians, "Rejected", "Cancelled")
                ),
            },
            "upcoming_approved": upcoming_approved,
            "recent_activities": recent_activities[:6],
        }

        serializer = DashboardOverviewSerializer(payload)
        return Response(serializer.data)


class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.select_related('created_by').order_by('-created_at')
    serializer_class = FAQSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=getattr(self.request.user, 'profile', None))
        log_admin_action(
            self.request.user,
            instance,
            ADDITION,
            "Created FAQ via CSL Admin.",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            instance,
            CHANGE,
            "Updated FAQ via CSL Admin.",
        )

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted FAQ via CSL Admin.",
        )
        super().perform_destroy(instance)


class StructureOrganizationViewSet(viewsets.ModelViewSet):
    queryset = StructureOrganization.objects.select_related('parent').order_by('-created_at')
    serializer_class = StructureOrganizationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsStaffOrAbove()]
        return super().get_permissions()


class PengujianViewSet(viewsets.ModelViewSet):
    queryset = Pengujian.objects.select_related('requested_by', 'approved_by').order_by('-created_at')
    serializer_class = PengujianSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.action == "list":
            return PengujianListSerializer
        return PengujianSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("requested_by", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("approved_by", OpenApiTypes.UUID, OpenApiParameter.QUERY),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        requested_by = self.request.query_params.get('requested_by')
        approved_by = self.request.query_params.get('approved_by')

        if status_param:
            qs = qs.filter(status=normalize_status_value(status_param))
        if requested_by:
            qs = qs.filter(requested_by_id=requested_by)
        if approved_by:
            qs = qs.filter(approved_by_id=approved_by)
        return qs

    def perform_create(self, serializer):
        serializer.save(requested_by=getattr(self.request.user, 'profile', None))

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted sample testing record via CSL Admin.",
        )
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Approved', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Rejected', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Completed', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UseViewSet(viewsets.ModelViewSet):
    queryset = (
        Use.objects
        .select_related(
            'equipment',
            'equipment__room',
            'equipment__room__image',
            'equipment__image',
            'requested_by',
            'approved_by',
        )
        .prefetch_related('equipment__room__pics')
        .order_by('-created_at')
    )
    serializer_class = UseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    def get_serializer_class(self):
        if self.action == "list":
            return UseListSerializer
        return UseSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("equipment", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("requested_by", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("approved_by", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("start_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("end_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        equipment_id = self.request.query_params.get('equipment')
        requester_id = self.request.query_params.get('requested_by')
        approved_by = self.request.query_params.get('approved_by')
        start_after = self.request.query_params.get('start_after')
        end_before = self.request.query_params.get('end_before')
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        if status_param:
            qs = qs.filter(status=normalize_status_value(status_param))
        if equipment_id:
            qs = qs.filter(equipment_id=equipment_id)
        if requester_id:
            qs = qs.filter(requested_by_id=requester_id)
        if approved_by:
            qs = qs.filter(approved_by_id=approved_by)
        if start_after:
            qs = qs.filter(start_time__gte=start_after)
        if end_before:
            qs = qs.filter(end_time__lte=end_before)
        if created_after:
            qs = qs.filter(created_at__gte=created_after)
        if created_before:
            qs = qs.filter(created_at__lte=created_before)
        return qs

    def perform_create(self, serializer):
        serializer.save(requested_by=getattr(self.request.user, 'profile', None))

    def perform_destroy(self, instance):
        log_admin_action(
            self.request.user,
            instance,
            DELETION,
            "Deleted equipment usage record via CSL Admin.",
        )
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Approved', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Rejected', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data={'status': 'Completed', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
