from django.db import models, transaction
import uuid
from csluse_auth.models import Profile
from django.utils import timezone

PURPOSE_CHOICES = [
    ('class', 'Class'),
    ('lab_work', 'Lab Work'),
    ('research', 'Research'),
    ('other', 'Other'),
]


def _next_code(model_cls, prefix, yymm):
    base = f"{prefix}{yymm}-"
    last = (
        model_cls.objects.select_for_update()
        .filter(code__startswith=base)
        .order_by("-code")
        .first()
    )
    if last and last.code:
        try:
            last_seq = int(last.code.split("-")[-1])
        except (ValueError, IndexError):
            last_seq = 0
    else:
        last_seq = 0
    return f"{base}{last_seq + 1:03d}"

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
    floor = models.PositiveIntegerField()
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
    code = models.CharField(max_length=12, unique=True, editable=False, null=True)
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

    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        default='other',
    )
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

    def save(self, *args, **kwargs):
        if not self.code:
            now = timezone.localtime(timezone.now())
            yymm = now.strftime("%y%m")
            with transaction.atomic():
                self.code = _next_code(Booking, "BR", yymm)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.requested_by.user.email} - {self.room.name} - {self.status}"

class Borrow(BaseModel):
    code = models.CharField(max_length=12, unique=True, editable=False, null=True)
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

    def save(self, *args, **kwargs):
        if not self.code:
            now = timezone.localtime(timezone.now())
            yymm = now.strftime("%y%m")
            with transaction.atomic():
                self.code = _next_code(Borrow, "BE", yymm)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.equipment.name} - {self.requested_by.user.email} - {self.status}"


class Notification(BaseModel):
    recipient = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)

    CATEGORY_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('reminder', 'Reminder'),
        ('general', 'General'),
    ]

    category = models.CharField(max_length=255, choices=CATEGORY_CHOICES, default='general')
    message = models.CharField(max_length=2000)

    def __str__(self):
        return f"Notification for {self.recipient.user.email} - {self.title}"
