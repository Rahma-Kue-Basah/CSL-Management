from allauth.account.models import EmailAddress
from django.contrib.admin.models import DELETION, LogEntry
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from csluse_auth.models import Profile
from csluse_auth.permissions import ADMINISTRATOR, SUPER_ADMINISTRATOR, assign_role

User = get_user_model()


class AuthBaseTestMixin:
    def create_user(
        self,
        *,
        email,
        full_name="Test User",
        role="Guest",
        department=None,
        batch=None,
        id_number=None,
        user_type="EXTERNAL",
        institution=None,
        verified=False,
        group_role=None,
    ):
        username = email.split("@")[0]
        user = User.objects.create_user(
            username=f"{username}_{User.objects.count() + 1}",
            email=email,
            password="testpass123",
        )
        profile = user.profile
        profile.full_name = full_name
        profile.role = role
        profile.department = department
        profile.batch = batch
        profile.id_number = id_number
        profile.user_type = user_type
        profile.institution = institution
        profile.save()

        if group_role:
            assign_role(user, group_role)

        if verified:
            EmailAddress.objects.create(
                user=user,
                email=email,
                verified=True,
                primary=True,
            )

        return user


class ProfileModelTests(AuthBaseTestMixin, TestCase):
    def test_profile_save_normalizes_initials_and_clears_invalid_institution(self):
        user = self.create_user(
            email="profile@example.com",
            full_name="Jane Doe",
            role="Guest",
            institution="External Lab",
        )

        profile = user.profile
        profile.initials = ""
        profile.save()
        self.assertEqual(profile.initials, "JDJ")
        self.assertEqual(profile.institution, "External Lab")

        profile.role = "Staff"
        profile.institution = "Should Be Cleared"
        profile.save()
        profile.refresh_from_db()

        self.assertEqual(profile.initials, "JDJ")
        self.assertIsNone(profile.institution)


class UserWithProfileViewSetTests(AuthBaseTestMixin, APITestCase):
    def setUp(self):
        self.admin = self.create_user(
            email="admin@example.com",
            full_name="Admin User",
            role="Admin",
        )
        assign_role(self.admin, ADMINISTRATOR)
        self.client.force_authenticate(user=self.admin)

    def test_list_filters_users_and_returns_role_aggregates(self):
        self.create_user(
            email="alice@example.com",
            full_name="Alice Student",
            role="Student",
            department="DIGITAL BUSINESS TECHNOLOGY",
            batch="2024",
            id_number="STD-001",
            user_type="INTERNAL",
            verified=True,
        )
        self.create_user(
            email="bob@example.com",
            full_name="Bob Lecturer",
            role="Lecturer",
            department="DIGITAL BUSINESS TECHNOLOGY",
            id_number="LEC-001",
            user_type="INTERNAL",
        )
        self.create_user(
            email="charlie@example.com",
            full_name="Charlie Student",
            role="Student",
            department="BUSINESS MATHEMATICS",
            batch="2024",
            id_number="STD-002",
            user_type="INTERNAL",
            verified=True,
        )

        response = self.client.get(
            "/api/admin/users/",
            {
                "department": "DIGITAL BUSINESS TECHNOLOGY",
                "batch": "2024",
                "search": "Alice",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["email"], "alice@example.com")
        self.assertTrue(response.data["results"][0]["is_verified"])
        self.assertEqual(response.data["aggregates"]["total"], 1)
        self.assertEqual(response.data["aggregates"]["student"], 1)
        self.assertEqual(response.data["aggregates"]["lecturer"], 0)
        self.assertEqual(response.data["aggregates"]["guest"], 0)

    def test_bulk_delete_skips_super_administrator_and_deletes_regular_users(self):
        deletable_user = self.create_user(
            email="deletable@example.com",
            full_name="Delete Me",
            role="Student",
            batch="2024",
        )
        protected_user = self.create_user(
            email="superadmin@example.com",
            full_name="Protected User",
            role="Admin",
            group_role=SUPER_ADMINISTRATOR,
        )

        response = self.client.post(
            "/api/admin/users/bulk-delete/",
            {"ids": [deletable_user.pk, protected_user.pk, 999999]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["deleted_count"], 1)
        self.assertEqual(response.data["failed_count"], 2)
        self.assertEqual(response.data["deleted_ids"], [deletable_user.pk])
        self.assertCountEqual(response.data["failed_ids"], [protected_user.pk, 999999])
        self.assertFalse(User.objects.filter(pk=deletable_user.pk).exists())
        self.assertTrue(User.objects.filter(pk=protected_user.pk).exists())
        self.assertEqual(
            LogEntry.objects.filter(
                user=self.admin,
                object_id=str(deletable_user.pk),
                action_flag=DELETION,
            ).count(),
            1,
        )
