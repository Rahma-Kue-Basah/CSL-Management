from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Exists, OuterRef
from allauth.account.models import EmailAddress
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Profile
from .serializers import ProfileSerializer, UserWithProfileSerializer
from csluse.viewsets import DefaultPagination

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


class UserWithProfileViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = UserWithProfileSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.select_related("profile").all()
    pagination_class = DefaultPagination

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
