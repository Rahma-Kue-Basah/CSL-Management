from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    AdminActionViewSet,
    AdminDashboardViewSet,
    AdminProfileViewSet,
    PicUserViewSet,
    UserWithProfileViewSet,
)

router = DefaultRouter()
router.register(r"profile", AdminProfileViewSet, basename="admin-profile")
router.register(r"users", UserWithProfileViewSet, basename="users")
router.register(r"pic-users", PicUserViewSet, basename="pic-users")
router.register(r"actions", AdminActionViewSet, basename="admin-actions")
router.register(r"dashboard", AdminDashboardViewSet, basename="admin-dashboard")

urlpatterns = [
    path("", include(router.urls)),
]
