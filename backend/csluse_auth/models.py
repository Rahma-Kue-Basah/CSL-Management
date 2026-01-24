from django.db import models
from django.contrib.auth import get_user_model
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

    USER_TYPE_CHOICES = [
        ('INTERNAL', 'Internal'),
        ('EXTERNAL', 'External'),
    ]

    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('LECTURER', 'Lecturer'),
        ('ADMIN', 'Admin'),
        ('STAFF', 'Staff'),
        ('OTHER', 'Other'),
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

    def __str__(self):
        return f"{self.user.email} - {self.full_name} - {self.role}"
