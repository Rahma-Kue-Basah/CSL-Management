from django.db import models
import uuid
from csluse_auth.models import Profile

class BaseModel(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Image(BaseModel):
    image = models.ImageField(upload_to='images/')
    name = models.CharField(max_length=255, blank=True)
    url = models.URLField(blank=True)

    created_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='images_created_by',
    )

    def __str__(self):
        creator_email = self.created_by.user.email if self.created_by else 'unknown'
        return f"{self.name or self.image.name} - {creator_email} - {self.created_at}"
    

class Room(BaseModel):
    name = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField()
    description = models.CharField(max_length=2000, blank=True, null=True)
    number = models.CharField(max_length=4)
    floor = models.CharField(max_length=4)
    pic = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='room_pic_by'
    )
    image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.name} - {self.number} - Floor {self.floor}"

class Equipment(BaseModel):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=2000, blank=True, null=True)
    quantity = models.PositiveIntegerField()

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('borrowed', 'Borrowed'),
        ('maintenance', 'Under Maintenance'),
        ('broken', 'Broken'),
        ('storage', 'In Storage'),
    ]
    CATEGORY_CHOICES = [
        ('electricity', 'Electricity'),
        ('electronics', 'Electronics'),
        ('large_equipment', 'Large Equipment'), 
        ('furniture', 'Furniture'),
        ('glassware', 'Glassware'),
        ('chemicals', 'Chemicals'),
        ('tools', 'Tools'),
        ('safety', 'Safety Equipment'),
        ('other', 'Other'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')

    image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='equipments',
    )

    is_moveable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.room.name} - Qty: {self.quantity}"


class Booking(BaseModel):
    requested_by = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        related_name='equipment_bookings',
        blank=True,
        null=True,
    )
    quantity_equipment = models.PositiveIntegerField(blank=True, null=True)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    purpose = models.CharField(max_length=2000, blank=True, null=True)
    note = models.CharField(max_length=2000, blank=True, null=True)

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    approved_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_bookings',
    )

    def __str__(self):
        return f"Booking by {self.requested_by.user.email} for {self.room.name} - Status: {self.status}"

class Borrow(BaseModel):
    requested_by = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='borrows',
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='borrows',
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    end_time_actual = models.DateTimeField(blank=True, null=True)

    PURPOSE_CHOICES = [
        ('class', 'Class'),
        ('lab_work', 'Lab Work'),
        ('research', 'Research'),
        ('other', 'Other'),
    ]

    quantity = models.PositiveIntegerField(default=1)

    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='other')
    note = models.CharField(max_length=2000, blank=True, null=True)

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
        ('lost_damaged', 'Lost/Damaged'),
        ('cancelled', 'Cancelled'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='borrowed')

    approved_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_borrows',
    )

    def __str__(self):
        return f"Borrow of {self.equipment.name} by {self.requested_by.user.email} - Status: {self.status}"



