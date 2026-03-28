from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from unittest.mock import patch

from csluse.models import Borrow, Booking, BookingEquipmentItem, Equipment, Notification, Pengujian, Room, Use
from csluse_auth.models import Profile

User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="https://frontend.example.com",
)
class CsluseWorkflowRegressionTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        mail.outbox = []
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
        self.room.pics.add(self.staff_profile)

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

    def create_borrow(self, requested_by, *, status="Pending", approved_by=None):
        start, end = self.future_window(days=2, start_hour=11)
        return Borrow.objects.create(
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
        notification = Notification.objects.get(recipient=self.student_profile)
        self.assertEqual(notification.category, "Approved")
        self.assertIn("pengujian sampel", notification.message.lower())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Update status request", mail.outbox[0].subject)
        self.assertIn("https://frontend.example.com/sample-testing", mail.outbox[0].body)

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

    def test_booking_approval_creates_notification_for_requester(self):
        booking = self.create_booking(self.student_profile)

        self.client.force_authenticate(self.admin_user)
        response = self.client.post(f"/api/bookings/{booking.id}/approve/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.get(recipient=self.student_profile)
        self.assertEqual(notification.category, "Approved")
        self.assertIn(booking.code, notification.message)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(f"https://frontend.example.com/booking-rooms/{booking.id}", mail.outbox[0].body)
        self.assertIn("disetujui", mail.outbox[0].body)

    def test_use_rejection_creates_notification_for_requester(self):
        use_item = self.create_use(self.student_profile)

        self.client.force_authenticate(self.staff_user)
        response = self.client.post(f"/api/uses/{use_item.id}/reject/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.get(recipient=self.student_profile)
        self.assertEqual(notification.category, "Rejected")
        self.assertIn(use_item.code, notification.message)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(f"https://frontend.example.com/use-equipment/{use_item.id}", mail.outbox[0].body)
        self.assertIn("ditolak", mail.outbox[0].body)

    def test_overdue_borrow_creates_reminder_notification(self):
        borrow = self.create_borrow(
            self.student_profile,
            status="Borrowed",
            approved_by=self.staff_profile,
        )
        Borrow.objects.filter(pk=borrow.pk).update(
            start_time=timezone.now() - timedelta(days=2),
            end_time=timezone.now() - timedelta(hours=1),
            status="Borrowed",
        )

        self.client.force_authenticate(self.student_user)
        response = self.client.get("/api/borrows/my/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.get(recipient=self.student_profile, category="Reminder")
        self.assertIn("overdue", notification.message.lower())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Pengingat pengembalian alat", mail.outbox[0].subject)
        self.assertIn(f"https://frontend.example.com/borrow-equipment/{borrow.id}", mail.outbox[0].body)

    def test_overdue_borrow_email_is_only_sent_once(self):
        borrow = self.create_borrow(
            self.student_profile,
            status="Borrowed",
            approved_by=self.staff_profile,
        )
        Borrow.objects.filter(pk=borrow.pk).update(
            start_time=timezone.now() - timedelta(days=2),
            end_time=timezone.now() - timedelta(hours=1),
            status="Borrowed",
        )

        self.client.force_authenticate(self.student_user)
        first_response = self.client.get("/api/borrows/my/")
        second_response = self.client.get("/api/borrows/my/")

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Notification.objects.filter(recipient=self.student_profile, category="Reminder").count(),
            1,
        )
        self.assertEqual(len(mail.outbox), 1)

    def test_borrow_approval_email_uses_detail_route(self):
        borrow = self.create_borrow(self.student_profile)

        self.client.force_authenticate(self.staff_user)
        response = self.client.post(f"/api/borrows/{borrow.id}/approve/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(f"https://frontend.example.com/borrow-equipment/{borrow.id}", mail.outbox[0].body)

    def test_notification_email_failure_does_not_break_booking_approval(self):
        booking = self.create_booking(self.student_profile)

        self.client.force_authenticate(self.admin_user)
        with patch("csluse.email_notifications.EmailMultiAlternatives.send", side_effect=RuntimeError("SMTP failed")):
            response = self.client.post(f"/api/bookings/{booking.id}/approve/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Notification.objects.filter(recipient=self.student_profile, category="Approved").exists())

    def test_missing_recipient_email_does_not_break_booking_approval(self):
        booking = self.create_booking(self.student_profile)
        self.student_user.email = ""
        self.student_user.save(update_fields=["email"])

        self.client.force_authenticate(self.admin_user)
        response = self.client.post(f"/api/bookings/{booking.id}/approve/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Notification.objects.filter(recipient=self.student_profile, category="Approved").exists())
        self.assertEqual(len(mail.outbox), 0)

    def test_notifications_endpoint_returns_current_user_notifications(self):
        booking = self.create_booking(self.student_profile)
        Notification.objects.create(
            recipient=self.student_profile,
            title=f"Booking Ruangan {booking.code} disetujui",
            category="Approved",
            message=f"Pengajuan booking ruangan Anda ({booking.code}) telah disetujui oleh Admin.",
        )
        Notification.objects.create(
            recipient=self.staff_profile,
            title="Other Notification",
            category="General",
            message="Pesan lain.",
        )

        self.client.force_authenticate(self.student_user)
        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], f"Booking Ruangan {booking.code} disetujui")
        self.assertEqual(response.data["results"][0]["target_path"], f"/booking-rooms/{booking.id}")

    def test_notifications_endpoint_returns_null_target_for_unmapped_notification(self):
        Notification.objects.create(
            recipient=self.student_profile,
            title="Test Notification",
            category="General",
            message="Pesan umum tanpa request.",
        )

        self.client.force_authenticate(self.student_user)
        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["target_path"], None)

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
