import os
from datetime import datetime

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from .models import Image, Room, Equipment, Booking, Borrow
from .serializers import (
    ImageSerializer,
    RoomSerializer,
    EquipmentSerializer,
    BookingSerializer,
    BorrowSerializer,
)


class DefaultPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


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


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    @extend_schema(
        parameters=[
            OpenApiParameter("pic", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="PIC of the room"),
            OpenApiParameter("pic_id", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="Alias for pic"),
            OpenApiParameter("floor", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("capacity_min", OpenApiTypes.INT, OpenApiParameter.QUERY),
            OpenApiParameter("capacity_max", OpenApiTypes.INT, OpenApiParameter.QUERY),
            OpenApiParameter("created_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        pic_id = self.request.query_params.get('pic') or self.request.query_params.get('pic_id')
        floor = self.request.query_params.get('floor')
        capacity_min = self.request.query_params.get('capacity_min')
        capacity_max = self.request.query_params.get('capacity_max')
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        # Filter params: pic, floor, capacity range, created range
        if pic_id:
            qs = qs.filter(pic_id=pic_id)
        if floor:
            qs = qs.filter(floor=floor)
        if capacity_min:
            qs = qs.filter(capacity__gte=capacity_min)
        if capacity_max:
            qs = qs.filter(capacity__lte=capacity_max)
        if created_after:
            qs = qs.filter(created_at__gte=created_after)
        if created_before:
            qs = qs.filter(created_at__lte=created_before)
        return qs

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

        blocking_statuses = ['pending', 'approved']
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
    queryset = Equipment.objects.select_related('room', 'image').order_by('-created_at')
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination

    @extend_schema(
        parameters=[
            OpenApiParameter("status", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("category", OpenApiTypes.STR, OpenApiParameter.QUERY),
            OpenApiParameter("room", OpenApiTypes.UUID, OpenApiParameter.QUERY),
            OpenApiParameter("pic", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="PIC of the room"),
            OpenApiParameter("pic_id", OpenApiTypes.UUID, OpenApiParameter.QUERY, description="Alias for pic"),
            OpenApiParameter("is_moveable", OpenApiTypes.BOOL, OpenApiParameter.QUERY),
            OpenApiParameter("created_after", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
            OpenApiParameter("created_before", OpenApiTypes.DATETIME, OpenApiParameter.QUERY),
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
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        # Filter params: status, category, room, pic, is_moveable, created range
        if status_param:
            qs = qs.filter(status=status_param)
        if category:
            qs = qs.filter(category=category)
        if room_id:
            qs = qs.filter(room_id=room_id)
        if pic_id:
            qs = qs.filter(room__pic_id=pic_id)
        if is_moveable is not None:
            if str(is_moveable).lower() in ['true', '1', 'yes']:
                qs = qs.filter(is_moveable=True)
            elif str(is_moveable).lower() in ['false', '0', 'no']:
                qs = qs.filter(is_moveable=False)
        if created_after:
            qs = qs.filter(created_at__gte=created_after)
        if created_before:
            qs = qs.filter(created_at__lte=created_before)
        return qs

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

        booking_block = ['pending', 'approved']
        borrow_block = ['pending', 'approved', 'borrowed', 'overdue', 'lost_damaged']

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

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        room_id = self.request.query_params.get('room')
        equipment_id = self.request.query_params.get('equipment')
        requester_id = self.request.query_params.get('requested_by')
        pic_id = self.request.query_params.get('pic') or self.request.query_params.get('pic_id')
        start_after = self.request.query_params.get('start_after')
        end_before = self.request.query_params.get('end_before')
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')

        # Filter params: status, room, equipment, requested_by, pic, start_after, end_before, created range
        if status_param:
            qs = qs.filter(status=status_param)
        if room_id:
            qs = qs.filter(room_id=room_id)
        if equipment_id:
            qs = qs.filter(equipment_id=equipment_id)
        if requester_id:
            qs = qs.filter(requested_by_id=requester_id)
        if pic_id:
            qs = qs.filter(room__pic_id=pic_id)
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

        statuses = request.query_params.getlist('status') or ['approved']

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
            data={'status': 'approved', **request.data},
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
            data={'status': 'rejected', **request.data},
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
            data={'status': 'completed', **request.data},
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
            qs = qs.filter(status=status_param)
        if equipment_id:
            qs = qs.filter(equipment_id=equipment_id)
        if requester_id:
            qs = qs.filter(requested_by_id=requester_id)
        if pic_id:
            qs = qs.filter(equipment__room__pic_id=pic_id)
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

        statuses = request.query_params.getlist('status') or ['approved', 'borrowed']

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
            data={'status': 'returned', 'end_time_actual': end_time_actual, **request.data},
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
            data={'status': 'approved', **request.data},
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
            data={'status': 'rejected', **request.data},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(approved_by=getattr(request.user, 'profile', None))
        return Response(serializer.data)
