from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from csluse.models import Booking, BookingEquipmentItem, Equipment, Room, Use
from csluse_auth.models import Profile

User = get_user_model()


class CsluseWorkflowRegressionTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student_user, self.student_profile = self.create_user_with_profile(
            "student@example.com",
            "Student",
            "Student User",
        )
        self.staff_user, self.staff_profile = self.create_user_with_profile(
            "staff@example.com",
            "Staff",
            "Staff User",
        )
        self.admin_user, self.admin_profile = self.create_user_with_profile(
            "admin@example.com",
            "Admin",
            "Admin User",
        )

        self.room = Room.objects.create(
            name="Lab A",
            capacity=20,
            number="101",
            floor=1,
        )
        self.equipment = Equipment.objects.create(
            name="Oscilloscope",
            quantity=5,
            room=self.room,
            is_moveable=True,
        )

    def create_user_with_profile(self, email, role, full_name):
        user = User.objects.create_user(
            username=email.split("@")[0],
            email=email,
            password="password123",
        )
        profile, _ = Profile.objects.update_or_create(
            user=user,
            defaults={
                "role": role,
                "full_name": full_name,
                "user_type": "INTERNAL",
            },
        )
        profile.refresh_from_db()
        return user, profile

    def future_window(self, *, days=1, start_hour=9, duration_hours=2):
        local_now = timezone.localtime(timezone.now()) + timedelta(days=days)
        start = local_now.replace(
            hour=start_hour,
            minute=0,
            second=0,
            microsecond=0,
        )
        end = start + timedelta(hours=duration_hours)
        return start, end

    def create_booking(self, requested_by):
        start, end = self.future_window()
        return Booking.objects.create(
            requested_by=requested_by,
            room=self.room,
            start_time=start,
            end_time=end,
            attendee_count=1,
            purpose="Research",
        )

    def create_use(self, requested_by, *, status="Pending", approved_by=None):
        start, end = self.future_window(days=2, start_hour=10)
        return Use.objects.create(
            requested_by=requested_by,
            equipment=self.equipment,
            quantity=1,
            start_time=start,
            end_time=end,
            purpose="Research",
            status=status,
            approved_by=approved_by,
        )

    def test_pengujian_can_be_created_and_approved(self):
        self.client.force_authenticate(self.student_user)
        create_response = self.client.post(
            "/api/pengujians/",
            {
                "name": "Pemohon Uji",
                "email": "pemohon@example.com",
                "sample_type": "Food Sample",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        pengujian_id = create_response.data["id"]

        self.client.force_authenticate(self.staff_user)
        approve_response = self.client.post(
            f"/api/pengujians/{pengujian_id}/approve/",
            {},
            format="json",
        )

        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_response.data["status"], "Approved")

    def test_student_cannot_self_approve_booking(self):
        booking = self.create_booking(self.student_profile)

        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            f"/api/bookings/{booking.id}/approve/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_self_approve_booking(self):
        booking = self.create_booking(self.admin_profile)

        self.client.force_authenticate(self.admin_user)
        response = self.client.post(
            f"/api/bookings/{booking.id}/approve/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Approved")

    def test_staff_cannot_self_approve_use(self):
        use_item = self.create_use(self.staff_profile)

        self.client.force_authenticate(self.staff_user)
        response = self.client.post(
            f"/api/uses/{use_item.id}/approve/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_requester_cannot_self_complete_use(self):
        use_item = self.create_use(
            self.student_profile,
            status="Approved",
            approved_by=self.staff_profile,
        )

        self.client.force_authenticate(self.student_user)
        response = self.client.post(
            f"/api/uses/{use_item.id}/complete/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_room_update_requires_admin_or_above(self):
        self.client.force_authenticate(self.student_user)
        response = self.client.patch(
            f"/api/rooms/{self.room.id}/",
            {"name": "Updated by Student"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_booking_equipment_filters_and_availability_use_equipment_items_relation(self):
        booking = self.create_booking(self.student_profile)
        BookingEquipmentItem.objects.create(
            booking=booking,
            equipment=self.equipment,
            quantity=1,
        )

        self.client.force_authenticate(self.student_user)
        list_response = self.client.get(f"/api/bookings/?equipment={self.equipment.id}")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)

        availability_response = self.client.get(
            f"/api/equipments/{self.equipment.id}/availability/",
            {
                "start": booking.start_time.isoformat(),
                "end": booking.end_time.isoformat(),
            },
        )

        self.assertEqual(availability_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(availability_response.data["occupied"]), 1)
        self.assertEqual(availability_response.data["occupied"][0]["type"], "booking")
