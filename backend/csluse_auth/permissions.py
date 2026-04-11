"""Role helpers and DRF permission classes for csluse_auth."""

from django.contrib.auth.models import Group
from rest_framework import permissions


# region Role Constants


STUDENT = "Student"
LECTURER = "Lecturer"
ADMINISTRATOR = "Administrator"
SUPER_ADMINISTRATOR = "SuperAdministrator"
STAFF = "Staff"
GUEST = "Guest"

# Backward compatibility alias.
OTHER = GUEST

ALL_ROLES = [
    STUDENT,
    LECTURER,
    ADMINISTRATOR,
    SUPER_ADMINISTRATOR,
    STAFF,
    GUEST,
]


# endregion Role Constants


# region Role Helpers


def get_user_role(user):
    """Return the first matching role group for an authenticated user."""
    if not user or not user.is_authenticated:
        return None

    user_groups = user.groups.values_list("name", flat=True)
    for role in [GUEST, STUDENT, LECTURER, STAFF, ADMINISTRATOR, SUPER_ADMINISTRATOR]:
        if role in user_groups:
            return role
    return None


def has_role(user, role):
    """Check whether the user belongs to a specific role group."""
    if not user or not user.is_authenticated:
        return False
    return user.groups.filter(name=role).exists()


def is_student(user):
    return has_role(user, STUDENT)


def is_lecturer(user):
    return has_role(user, LECTURER)


def is_administrator(user):
    return has_role(user, ADMINISTRATOR)


def is_super_administrator(user):
    return has_role(user, SUPER_ADMINISTRATOR)


def is_staff_role(user):
    return has_role(user, STAFF)


def is_guest_role(user):
    return has_role(user, GUEST)


def is_other_role(user):
    """Backward compatible alias for guest checks."""
    return is_guest_role(user)


def assign_role(user, role):
    """Replace the user's current role groups with the requested role."""
    if role not in ALL_ROLES:
        return False

    for existing_role in ALL_ROLES:
        user.groups.remove(*Group.objects.filter(name=existing_role))

    group, _ = Group.objects.get_or_create(name=role)
    user.groups.add(group)
    return True


# endregion Role Helpers


# region Permission Classes


class IsGuest(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_guest_role(request.user)


class IsOther(IsGuest):
    """Backward compatible alias for guest permission."""


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_student(request.user)


class IsLecturer(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_lecturer(request.user)


class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_staff_role(request.user)


class IsAdministrator(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_administrator(request.user)


class IsSuperAdministrator(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_super_administrator(request.user)


class IsLecturerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return (
            getattr(user, "is_superuser", False)
            or has_role(user, LECTURER)
            or has_role(user, ADMINISTRATOR)
            or has_role(user, SUPER_ADMINISTRATOR)
        )


class IsStaffOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return (
            getattr(user, "is_superuser", False)
            or has_role(user, STAFF)
            or has_role(user, ADMINISTRATOR)
            or has_role(user, SUPER_ADMINISTRATOR)
        )


class IsAdministratorOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return (
            getattr(user, "is_superuser", False)
            or has_role(user, ADMINISTRATOR)
            or has_role(user, SUPER_ADMINISTRATOR)
        )


class IsSuperAdministratorOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_super_administrator(request.user)


# endregion Permission Classes
