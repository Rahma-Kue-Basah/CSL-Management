from django.db import models, transaction
import uuid
from csluse_auth.models import Profile
from django.utils import timezone

PURPOSE_CHOICES = [
    ('Skripsi/TA', 'Skripsi/TA'),
    ('Praktikum', 'Praktikum'),
    ('Penelitian', 'Penelitian'),
    ('Workshop', 'Workshop'),
]

def _next_code(model_cls, prefix, yymm):
    base = f"{prefix}{yymm}"
    last = (
        model_cls.objects.select_for_update()
        .filter(code__startswith=base)
        .order_by("-code")
        .first()
    )
    if last and last.code:
        try:
            suffix = last.code[len(base):].lstrip("-")
            last_seq = int(suffix)
        except ValueError:
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
        return f"{self.name or self.image.name} - {creator_email}"
    

class Room(BaseModel):
    name = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField()
    description = models.CharField(max_length=2000, blank=True, null=True)
    number = models.CharField(max_length=25)
    floor = models.CharField(max_length=25)
    pics = models.ManyToManyField(
        Profile,
        blank=True,
        related_name='rooms_as_pic',
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
    quantity = models.PositiveIntegerField(default=1)

    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Borrowed', 'Borrowed'),
        ('Under Maintenance', 'Under Maintenance'),
        ('Broken', 'Broken'),
        ('In Storage', 'In Storage'),
    ]
    CATEGORY_CHOICES = [
        ('Electricity', 'Electricity'),
        ('Electronics', 'Electronics'),
        ('Computer', 'Computer'),
        ('Large Equipment', 'Large Equipment'), 
        ('Furniture', 'Furniture'),
        ('Glassware', 'Glassware'),
        ('Chemicals', 'Chemicals'),
        ('Tools', 'Tools'),
        ('Safety Equipment', 'Safety Equipment'),
        ('Other', 'Other'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Other')

    image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipments',
    )

    is_moveable = models.BooleanField(default=True)

    def __str__(self):
        room_name = self.room.name if self.room else "Tanpa Ruangan"
        return f"{self.name} - {room_name} - Qty: {self.quantity}"
    
class Software(BaseModel):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=2000, blank=True, null=True)
    version = models.CharField(max_length=255, blank=True, null=True)
    license_info = models.CharField(max_length=255, blank=True, null=True)
    license_expiration = models.DateField(blank=True, null=True)

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='softwares',
    )

    def __str__(self):
        equipment_name = self.equipment.name if self.equipment else "Tanpa Peralatan"
        return f"{self.name} - {self.version} - {equipment_name}"

class Booking(BaseModel):
    code = models.CharField(max_length=12, unique=True, editable=False, null=True)
    requested_by = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    requester_phone = models.CharField(max_length=20, blank=True, null=True)
    requester_mentor = models.CharField(max_length=255, blank=True, null=True)

    # if role == guest, then fill in institution and institution_address
    institution = models.CharField(max_length=255, blank=True, null=True)
    institution_address = models.CharField(max_length=555, blank=True, null=True)

    # if purpose == workshop, then fill in workshop_title and workshop_organizer
    workshop_title = models.CharField(max_length=255, blank=True, null=True)
    workshop_pic = models.CharField(max_length=255, blank=True, null=True)
    workshop_institution = models.CharField(max_length=255, blank=True, null=True)

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    attendee_count = models.PositiveIntegerField(default=1)
    attendee_names = models.CharField(max_length=2000, blank=True, null=True)

    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES,
        default='Other',
    )
    note = models.CharField(max_length=2000, blank=True, null=True)

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Expired', 'Expired'),
        ('Completed', 'Completed'),
    ]

    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='Pending')

    approved_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_bookings',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    rejection_note = models.CharField(max_length=2000, blank=True, null=True)
    expired_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            now = timezone.localtime(timezone.now())
            yymm = now.strftime("%y%m")
            with transaction.atomic():
                self.code = _next_code(Booking, "PL", yymm)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.requested_by.user.email} - {self.room.name} - {self.status}"


class BookingEquipmentItem(BaseModel):
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='equipment_items',
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='booking_items',
    )
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.booking.code} - {self.equipment.name} x {self.quantity}"

class Use(BaseModel):
    code = models.CharField(max_length=12, unique=True, editable=False, null=True)
    requested_by = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='uses',
    )   
    requester_phone = models.CharField(max_length=20, blank=True, null=True)
    requester_mentor = models.CharField(max_length=255, blank=True, null=True)

    # if role == guest, then fill in institution and institution_address
    institution = models.CharField(max_length=255, blank=True, null=True)
    institution_address = models.CharField(max_length=555, blank=True, null=True)

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='uses',
    )

    quantity = models.PositiveIntegerField(default=1)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='Other')

    note = models.CharField(max_length=2000, blank=True, null=True)

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Expired', 'Expired'),
        ('Completed', 'Completed'),
    ]
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='Pending')

    approved_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_uses',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    rejection_note = models.CharField(max_length=2000, blank=True, null=True)
    expired_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            now = timezone.localtime(timezone.now())
            yymm = now.strftime("%y%m")
            with transaction.atomic():
                self.code = _next_code(Use, "PA", yymm)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.equipment.name} - {self.requested_by.user.email} - {self.status}"
    
class Borrow(BaseModel):
    code = models.CharField(max_length=12, unique=True, editable=False, null=True)
    requested_by = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='borrows',
    )
    requester_phone = models.CharField(max_length=20, blank=True, null=True)
    requester_mentor = models.CharField(max_length=255, blank=True, null=True)

    # if role == guest, then fill in institution and institution_address
    institution = models.CharField(max_length=255, blank=True, null=True)
    institution_address = models.CharField(max_length=555, blank=True, null=True)

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='borrows',
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    end_time_actual = models.DateTimeField(blank=True, null=True)

    quantity = models.PositiveIntegerField(default=1)

    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='Other')
    note = models.CharField(max_length=2000, blank=True, null=True)
    inspection_note = models.CharField(max_length=2000, blank=True, null=True)

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Expired', 'Expired'),
        ('Borrowed', 'Borrowed'),
        ('Returned Pending Inspection', 'Returned Pending Inspection'),
        ('Returned', 'Returned'),
        ('Overdue', 'Overdue'),
        ('Lost/Damaged', 'Lost/Damaged'),
    ]

    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='Pending')

    approved_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_borrows',
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    rejection_note = models.CharField(max_length=2000, blank=True, null=True)
    expired_at = models.DateTimeField(blank=True, null=True)
    borrowed_at = models.DateTimeField(blank=True, null=True)
    returned_pending_inspection_at = models.DateTimeField(blank=True, null=True)
    inspected_at = models.DateTimeField(blank=True, null=True)
    returned_at = models.DateTimeField(blank=True, null=True)
    overdue_at = models.DateTimeField(blank=True, null=True)
    lost_damaged_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            now = timezone.localtime(timezone.now())
            yymm = now.strftime("%y%m")
            with transaction.atomic():
                self.code = _next_code(Borrow, "PJ", yymm)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.equipment.name} - {self.requested_by.user.email} - {self.status}"

class Pengujian(BaseModel):
    name = models.CharField(max_length=255)
    institution = models.CharField(max_length=255, blank=True, null=True)
    institution_address = models.CharField(max_length=555, blank=True, null=True)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    sample_name = models.CharField(max_length=255, blank=True, null=True)
    sample_type = models.CharField(max_length=255)
    # sample_shape = models.CharField(max_length=255, blank=True, null=True)
    # sample_condition = models.CharField(max_length=255, blank=True, null=True)
    sample_brand = models.CharField(max_length=255, blank=True, null=True) # Merk Sampel
    sample_packaging = models.CharField(max_length=255, blank=True, null=True) # Kemasan Sampel
    sample_weight = models.CharField(max_length=255, blank=True, null=True) # Berat Netto / Dimensi Sampel
    sample_quantity = models.CharField(max_length=255, blank=True, null=True)
    sample_testing_serving = models.CharField(max_length=255, blank=True, null=True) # Cara Penyajian/ Penanganan
    sample_testing_method = models.CharField(max_length=255, blank=True, null=True) # Metode Pengujian
    sample_testing_type = models.CharField(max_length=255, blank=True, null=True) # Jenis Pengujian

    requested_by = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='pengujians',
    )

    approved_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_pengujians',
    )

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Completed', 'Completed'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    code = models.CharField(max_length=12, unique=True, editable=False, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    rejected_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            now = timezone.localtime(timezone.now())
            yymm = now.strftime("%y%m")
            with transaction.atomic():
                self.code = _next_code(Pengujian, "PS", yymm)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.email}"

class Notification(BaseModel):
    recipient = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)

    CATEGORY_CHOICES = [
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Reminder', 'Reminder'),
        ('General', 'General'),
    ]

    category = models.CharField(max_length=255, choices=CATEGORY_CHOICES, default='General')
    message = models.CharField(max_length=2000)

    def __str__(self):
        return f"Notification for {self.recipient.user.email} - {self.title}"






class Announcement(BaseModel):
    title = models.CharField(max_length=255)
    content = models.CharField(max_length=10000)

    created_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements_created_by',
    )

    def __str__(self):
        creator_email = self.created_by.user.email if self.created_by else 'unknown'
        return f"{self.title} - {creator_email}"


class Schedule(BaseModel):
    CATEGORY_CHOICES = [
        ('Practicum', 'Praktikum'),
    ]

    title = models.CharField(max_length=255)
    class_name = models.CharField(max_length=255, blank=True, null=True)
    description = models.CharField(max_length=2000, blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='Practicum',
    )

    room = models.ForeignKey(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='schedules',
    )

    created_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='schedules_created_by',
    )

    class Meta:
        ordering = ['start_time', 'title']

    def __str__(self):
        return self.title


class FAQ(BaseModel):
    question = models.CharField(max_length=500)
    answer = models.CharField(max_length=5000)

    created_by = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='faqs_created_by',
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.question
    
class StructureOrganization(BaseModel):
    title = models.CharField(max_length=255)
    name = models.CharField(max_length=455)

    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='children',
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.title} - {self.name}"
    
class Facility(BaseModel):
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=2000, blank=True, null=True)

    image = models.ForeignKey(
        Image,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name
