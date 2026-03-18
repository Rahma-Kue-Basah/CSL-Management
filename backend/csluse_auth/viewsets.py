import uuid

from django.contrib.auth import get_user_model
from django.contrib.admin.models import CHANGE, DELETION
from django.contrib.admin.models import LogEntry
from django.db import models
from django.db.models import Exists, OuterRef
from allauth.account.models import EmailAddress
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import Profile
from .audit import log_admin_action
from .serializers import (
    ProfileSerializer,
    UserWithProfileSerializer,
    PicUserSerializer,
    PicUserDropdownSerializer,
    AdminActionSerializer,
    AdminDashboardKpisSerializer,
)
from .permissions import SUPER_ADMINISTRATOR, has_role, IsStaffOrAbove
from csluse.viewsets import DefaultPagination
from csluse.models import Room, Equipment, Booking, Borrow
from .permissions import IsAdministratorOrAbove

User = get_user_model()

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch']

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            instance,
            CHANGE,
            "Updated own profile via CSL Admin (my profile).",
        )


class UserWithProfileViewSet(viewsets.ModelViewSet):

    serializer_class = UserWithProfileSerializer
    permission_classes = [IsAuthenticated, IsAdministratorOrAbove]
    queryset = User.objects.select_related("profile").all()
    pagination_class = DefaultPagination
    http_method_names = ["get", "delete"]

    def _append_aggregates(self, response, aggregates):
        response.data["aggregates"] = aggregates
        return response

    def _build_role_aggregates(self, queryset):
        return {
            "total": queryset.count(),
            "student": queryset.filter(profile__role__iexact="Student").count(),
            "lecturer": queryset.filter(profile__role__iexact="Lecturer").count(),
            "admin": queryset.filter(profile__role__iexact="Admin").count(),
            "staff": queryset.filter(profile__role__iexact="Staff").count(),
            "guest": queryset.filter(profile__role__iexact="Guest").count(),
        }

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)

        if lookup_value is None:
            return super().get_object()

        try:
            uuid.UUID(str(lookup_value))
            return get_object_or_404(queryset, profile__id=lookup_value)
        except ValueError:
            return get_object_or_404(queryset, pk=lookup_value)

    def get_queryset(self):
        """Enable lightweight filtering and search over user profiles."""
        request = self.request

        qs = (
            User.objects.select_related("profile")
            .annotate(
                is_verified=Exists(
                    EmailAddress.objects.filter(user=OuterRef("pk"), verified=True)
                )
            )
        )

        # Exact-match filters
        filters = {
            "profile__department__iexact": request.query_params.get("department"),
            "profile__role__iexact": request.query_params.get("role"),
            "profile__batch": request.query_params.get("batch"),
            "profile__user_type__iexact": request.query_params.get("user_type"),
        }

        filters = {key: value for key, value in filters.items() if value}
        if filters:
            qs = qs.filter(**filters)

        search_term = request.query_params.get("search") or request.query_params.get("q")
        if search_term:
            qs = qs.filter(
                models.Q(profile__full_name__icontains=search_term)
                | models.Q(email__icontains=search_term)
                | models.Q(profile__id_number__icontains=search_term)
            )

        return qs

    def list(self, request, *args, **kwargs):
        aggregate_qs = (
            User.objects.select_related("profile")
            .annotate(
                is_verified=Exists(
                    EmailAddress.objects.filter(user=OuterRef("pk"), verified=True)
                )
            )
        )

        department = request.query_params.get("department")
        batch = request.query_params.get("batch")
        search_term = request.query_params.get("search") or request.query_params.get("q")

        base_filters = {
            "profile__department__iexact": department,
            "profile__batch": batch,
        }
        base_filters = {key: value for key, value in base_filters.items() if value}
        if base_filters:
            aggregate_qs = aggregate_qs.filter(**base_filters)

        if search_term:
            aggregate_qs = aggregate_qs.filter(
                models.Q(profile__full_name__icontains=search_term)
                | models.Q(email__icontains=search_term)
                | models.Q(profile__id_number__icontains=search_term)
            )

        aggregates = self._build_role_aggregates(aggregate_qs)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page if page is not None else queryset, many=True)
        if page is not None:
            return self._append_aggregates(self.get_paginated_response(serializer.data), aggregates)
        return Response({"results": serializer.data, "aggregates": aggregates})

    def destroy(self, request, *args, **kwargs):
        target = self.get_object()

        is_target_super_admin = has_role(target, SUPER_ADMINISTRATOR) or getattr(
            target, "is_superuser", False
        )
        if is_target_super_admin:
            raise PermissionDenied("Tidak bisa menghapus SuperAdministrator.")

        log_admin_action(
            request.user,
            target,
            DELETION,
            "Deleted user via CSL Admin (user management).",
        )
        return super().destroy(request, *args, **kwargs)


class PicUserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PicUserSerializer
    permission_classes = [IsAuthenticated, IsStaffOrAbove]
    http_method_names = ["get"]

    def get_queryset(self):
        return (
            User.objects
            .select_related("profile")
            .filter(
                models.Q(profile__role__iregex=r"^(staff|lecturer|admin)$")
                | models.Q(
                    groups__name__in=[
                        "Staff",
                        "Lecturer",
                        "Administrator",
                    ]
                )
            )
            .exclude(groups__name="SuperAdministrator")
            .distinct()
        )

    @action(detail=False, methods=["get"], url_path="dropdown")
    def dropdown(self, request):
        queryset = self.get_queryset().order_by("profile__full_name", "email")
        serializer = PicUserDropdownSerializer(queryset, many=True)
        return Response(serializer.data)


class AdminProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsAdministratorOrAbove]
    queryset = Profile.objects.select_related("user").all()
    http_method_names = ["get", "patch"]

    def perform_update(self, serializer):
        instance = serializer.save()
        log_admin_action(
            self.request.user,
            instance,
            CHANGE,
            "Updated profile via CSL Admin (profile management).",
        )


class AdminActionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminActionSerializer
    permission_classes = [IsAuthenticated, IsAdministratorOrAbove]
    http_method_names = ["get"]

    def get_queryset(self):
        return (
            LogEntry.objects
            .select_related("user", "content_type")
            .order_by("-action_time")
        )

    @action(detail=False, methods=["get"], url_path="recent")
    def recent(self, request):
        queryset = self.get_queryset()[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my")
    def my(self, request):
        queryset = self.get_queryset().filter(user=request.user)[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AdminDashboardViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsAdministratorOrAbove]
    http_method_names = ["get"]
    queryset = Profile.objects.none()

    @extend_schema(responses=AdminDashboardKpisSerializer)
    @action(detail=False, methods=["get"], url_path="kpis")
    def kpis(self, request):
        data = {
            "total_users": User.objects.count(),
            "total_rooms": Room.objects.count(),
            "total_equipments": Equipment.objects.count(),
            "total_bookings": Booking.objects.count(),
            "total_borrows": Borrow.objects.count(),
        }
        return Response(data)
