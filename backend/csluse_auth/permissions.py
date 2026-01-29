"""
Role definitions and permission classes for user roles.

Roles:
- STUDENT: Student role
- LECTURER: Lecturer role
- ADMINISTRATOR: Administrator role
- SUPER_ADMINISTRATOR: SuperAdministrator role

Usage Examples:

1. Using Permission Classes in Views:
   ```python
   from rest_framework.viewsets import ModelViewSet
   from csluse_auth.permissions import IsStudent, IsLecturer, IsAdministratorOrAbove
   
   class MyViewSet(ModelViewSet):
       permission_classes = [IsAuthenticated, IsStudent]  # Only students
       # or
       permission_classes = [IsAuthenticated, IsLecturerOrAbove]  # Lecturers and above
   ```

2. Using Helper Functions:
   ```python
   from csluse_auth.permissions import is_student, is_lecturer, has_role, STUDENT
   
   def my_view(request):
       if is_student(request.user):
           # Do something for students
           pass
       
       if has_role(request.user, STUDENT):
           # Alternative way to check role
           pass
   ```

3. Assigning Roles:
   ```python
   from csluse_auth.permissions import assign_role, STUDENT, LECTURER
   
   # Assign role to user
   assign_role(user, STUDENT)
   assign_role(user, LECTURER)
   ```

4. Getting User Role:
   ```python
   from csluse_auth.permissions import get_user_role
   
   role = get_user_role(request.user)
   # Returns: 'Student', 'Lecturer', 'Administrator', 'SuperAdministrator', or None
   ```
"""
from rest_framework import permissions
from django.contrib.auth.models import Group


# Role constants
STUDENT = 'Student'
LECTURER = 'Lecturer'
ADMINISTRATOR = 'Administrator'
SUPER_ADMINISTRATOR = 'SuperAdministrator'
STAFF = 'Staff'
OTHER = 'Other'

# All roles list
ALL_ROLES = [
    STUDENT,
    LECTURER,
    ADMINISTRATOR,
    SUPER_ADMINISTRATOR,
    STAFF,
    OTHER,
]


def get_user_role(user):
    """
    Get the role of a user from their groups.
    Returns the first matching role group, or None if no role group is found.
    
    Args:
        user: Django User instance
        
    Returns:
        str: Role name or None
    """
    if not user or not user.is_authenticated:
        return None
    
    user_groups = user.groups.values_list('name', flat=True)
    
    # Check in order of hierarchy (lowest to highest)
    for role in [OTHER, STUDENT, LECTURER, STAFF, ADMINISTRATOR, SUPER_ADMINISTRATOR]:
        if role in user_groups:
            return role
    
    return None


def has_role(user, role):
    """
    Check if user has a specific role.
    
    Args:
        user: Django User instance
        role: Role name (e.g., STUDENT, LECTURER)
        
    Returns:
        bool: True if user has the role, False otherwise
    """
    if not user or not user.is_authenticated:
        return False
    
    return user.groups.filter(name=role).exists()


def is_student(user):
    """Check if user is a Student."""
    return has_role(user, STUDENT)


def is_lecturer(user):
    """Check if user is a Lecturer."""
    return has_role(user, LECTURER)


def is_administrator(user):
    """Check if user is an Administrator."""
    return has_role(user, ADMINISTRATOR)


def is_super_administrator(user):
    """Check if user is a SuperAdministrator."""
    return has_role(user, SUPER_ADMINISTRATOR)


def is_staff_role(user):
    """Check if user is Staff."""
    return has_role(user, STAFF)


def is_other_role(user):
    """Check if user is Other."""
    return has_role(user, OTHER)


def assign_role(user, role):
    """
    Assign a role to a user by adding them to the appropriate group.
    
    Args:
        user: Django User instance
        role: Role name (e.g., STUDENT, LECTURER)
        
    Returns:
        bool: True if role was assigned, False otherwise
    """
    if role not in ALL_ROLES:
        return False
    
    # Remove all existing role groups first
    for existing_role in ALL_ROLES:
        user.groups.remove(*Group.objects.filter(name=existing_role))
    
    # Add the new role group
    group, created = Group.objects.get_or_create(name=role)
    user.groups.add(group)
    return True


# Permission Classes for Django REST Framework

class IsOther(permissions.BasePermission):
    """Permission class to check if user is Other."""

    def has_permission(self, request, view):
        return is_other_role(request.user)

class IsStudent(permissions.BasePermission):
    """
    Permission class to check if user is a Student.
    """
    
    def has_permission(self, request, view):
        return is_student(request.user)

class IsLecturer(permissions.BasePermission):
    """
    Permission class to check if user is a Lecturer.
    """
    
    def has_permission(self, request, view):
        return is_lecturer(request.user)

class IsStaff(permissions.BasePermission):
    """Permission class to check if user is Staff."""

    def has_permission(self, request, view):
        return is_staff_role(request.user)
    
class IsAdministrator(permissions.BasePermission):
    """
    Permission class to check if user is an Administrator.
    """
    
    def has_permission(self, request, view):
        return is_administrator(request.user)


class IsSuperAdministrator(permissions.BasePermission):
    """
    Permission class to check if user is a SuperAdministrator.
    """
    
    def has_permission(self, request, view):
        return is_super_administrator(request.user)


class IsLecturerOrAbove(permissions.BasePermission):
    """
    Permission class to check if user is Lecturer, Administrator, or SuperAdministrator.
    """
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return has_role(user, LECTURER) or has_role(user, STAFF) or has_role(user, ADMINISTRATOR) or has_role(user, SUPER_ADMINISTRATOR)
    
class IsStaffOrAbove(permissions.BasePermission):
    """
    Permission class to check if user is Staff or above (incl. Administrator, SuperAdministrator).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return has_role(user, STAFF) or has_role(user, ADMINISTRATOR) or has_role(user, SUPER_ADMINISTRATOR)


class IsAdministratorOrAbove(permissions.BasePermission):
    """
    Permission class to check if user is Administrator or SuperAdministrator.
    """
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return has_role(user, ADMINISTRATOR) or has_role(user, SUPER_ADMINISTRATOR)


class IsSuperAdministratorOnly(permissions.BasePermission):
    """
    Permission class to check if user is SuperAdministrator only.
    """
    
    def has_permission(self, request, view):
        return is_super_administrator(request.user)