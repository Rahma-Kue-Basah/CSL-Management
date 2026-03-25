import re
from django.contrib.auth import get_user_model
from django.db import models
import uuid

class BaseModel(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Profile(BaseModel):
    user = models.OneToOneField(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="profile",
    )
    full_name = models.CharField(max_length=150, blank=True)
    initials = models.CharField(max_length=3, blank=True)

    USER_TYPE_CHOICES = [
        ('INTERNAL', 'Internal'),
        ('EXTERNAL', 'External'),
    ]

    ROLE_CHOICES = [
        ('Student', 'Student'),
        ('Lecturer', 'Lecturer'),
        ('Admin', 'Admin'),
        ('Staff', 'Staff'),
        ('Guest', 'Guest'),
    ]

    DEPARTMENT_CHOICE = [
        ('DIGITAL BUSINESS TECHNOLOGY', 'Digital Business Technology'),
        ('ARTIFICIAL INTELIGENCE AND ROBOTIC', 'Artificial Inteligence and Robotic'),
        ('BUSINESS MATHEMATICS', 'Business Mathematics'),
        ('FOOD BUSINESS TECHNOLOGY', 'Food Business Technology'),
        ('PRODUCT DESIGN AND INNOVATION', 'Product Design and Innovation'),
        ('ENERGY BUSINESS AND TECHNOLOGY', 'Energy Business and Technology')
    ]

    BATCH_CHOICES = [
        ('2020', '2020'),
        ('2021', '2021'),
        ('2022', '2022'),
        ('2023', '2023'),
        ('2024', '2024'),
        ('2025', '2025'),
        ('2026', '2026'),
        ('2027', '2027'),
        ('2028', '2028'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, blank=True, null=True)
    department = models.CharField(max_length=40, choices=DEPARTMENT_CHOICE, blank=True, null=True)
    id_number = models.CharField(max_length=40, blank=True, null=True)
    batch = models.CharField(max_length=4, choices=BATCH_CHOICES, blank=True, null=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='EXTERNAL')
    institution = models.CharField(max_length=255, blank=True, null=True)

    @staticmethod
    def normalize_initials(value, full_name="", email=""):
        normalized = re.sub(r"[^A-Za-z0-9]+", "", str(value or "")).upper()[:3]
        if normalized:
            return normalized

        source = str(full_name or "").strip()
        if source:
            words = [re.sub(r"[^A-Za-z0-9]+", "", word) for word in source.split()]
            words = [word for word in words if word]
            candidate = "".join(word[0] for word in words[:3]).upper()
            if len(candidate) < 3:
                candidate += "".join(words).upper()
            candidate = re.sub(r"[^A-Z0-9]+", "", candidate)[:3]
            if candidate:
                return candidate

        local_part = str(email or "").split("@")[0]
        fallback = re.sub(r"[^A-Za-z0-9]+", "", local_part).upper()[:3]
        return fallback or "USR"

    def save(self, *args, **kwargs):
        self.initials = self.normalize_initials(
            self.initials,
            full_name=self.full_name,
            email=getattr(self.user, "email", ""),
        )

        if self.role != "Guest":
            self.institution = None
        elif self.institution == "":
            self.institution = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.full_name} - {self.role}"
