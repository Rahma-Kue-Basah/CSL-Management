from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import Image, Booking, Borrow, Room, Pengujian, Use


def validate_start_not_in_past(start_time, label="start time"):
    if not start_time:
        return

    current_time = timezone.now()
    if start_time <= current_time:
        raise ValidationError(
            f"Cannot create or update data with a {label} in the past."
        )


def validate_booking_working_hours(start_time, end_time):
    if not start_time or not end_time:
        return

    local_start = timezone.localtime(start_time)
    local_end = timezone.localtime(end_time)

    start_minutes = (local_start.hour * 60) + local_start.minute
    end_minutes = (local_end.hour * 60) + local_end.minute
    workday_start = 8 * 60
    workday_end = 17 * 60

    if start_minutes < workday_start or start_minutes > workday_end:
        raise ValidationError(
            "Booking start time must be within working hours (08:00-17:00 WIB)."
        )

    if end_minutes < workday_start or end_minutes > workday_end:
        raise ValidationError(
            "Booking end time must be within working hours (08:00-17:00 WIB)."
        )

    if local_end <= local_start:
        raise ValidationError("Booking end time must be after start time.")


@receiver(post_delete, sender=Image)
def delete_image(sender, instance, **kwargs):
    image_name = instance.image.name
    if image_name:
        instance.image.storage.delete(image_name)


@receiver(pre_save, sender=Booking)
def validate_booking(sender, instance, **kwargs):
    """
    Ensure booking-equipment selection is valid (room match, stock, editable state).
    """
    validate_start_not_in_past(instance.start_time, "booking start time")
    validate_booking_working_hours(instance.start_time, instance.end_time)

    if not instance.equipment_id:
        return

    eq = instance.equipment
    now = timezone.now()

    # booking must still be editable
    if instance.status != 'pending' or instance.approved_by is not None:
        raise ValidationError("Cannot modify equipment for a booking that is not pending.")
    if instance.start_time and instance.start_time <= now:
        raise ValidationError("Cannot modify equipment for a booking whose start time has passed.")
    if instance.end_time and instance.end_time <= now:
        raise ValidationError("Cannot modify equipment for a booking whose end time has passed.")

    # room match
    if eq.room_id != instance.room_id:
        raise ValidationError(f"{eq.name} harus berasal dari ruangan {instance.room.name}.")

    # quantity check
    qty = instance.quantity_equipment or 0
    if qty <= 0:
        raise ValidationError("Quantity equipment must be at least 1.")
    if qty > eq.quantity:
        raise ValidationError(
            f"Quantity {qty} melebihi stok {eq.quantity} untuk {eq.name}."
        )

    # approved_by must be room PIC or Admin (when set)
    if instance.approved_by_id:
        approver_role = str(instance.approved_by.role or "").upper()
        if approver_role != "ADMIN":
            room_pic_id = instance.room.pic_id
            if not room_pic_id or instance.approved_by_id != room_pic_id:
                raise ValidationError(
                    "Approver harus PIC ruangan terkait atau Admin."
                )


@receiver(pre_save, sender=Use)
def validate_use(sender, instance, **kwargs):
    """
    Use rules:
    - Quantity > 0.
    - Start time cannot be in the past.
    """
    if instance.quantity <= 0:
        raise ValidationError("Use quantity must be at least 1.")

    validate_start_not_in_past(instance.start_time, "use start time")

@receiver(pre_save, sender=Borrow)
def validate_borrow(sender, instance, **kwargs):
    """
    Borrow rules:
    - Quantity > 0 and <= equipment stock.
    - Only editable while pending, not approved, and before start/end time.
    """
    # quantity checks (apply to create/update)
    if instance.quantity <= 0:
        raise ValidationError("Borrow quantity must be at least 1.")

    validate_start_not_in_past(instance.start_time, "borrow start time")

    if instance.equipment_id:
        equipment_qty = instance.equipment.quantity
        if instance.quantity > equipment_qty:
            raise ValidationError(
                f"Requested quantity ({instance.quantity}) exceeds equipment stock ({equipment_qty})."
            )

        if not instance.equipment.is_moveable:
            raise ValidationError("Only moveable equipment can be borrowed.")

    now = timezone.now()
    if instance.status != 'pending' or instance.approved_by is not None:
        raise ValidationError("Cannot modify equipment for a borrow that is not pending.")
    if instance.start_time and instance.start_time <= now:
        raise ValidationError("Cannot modify a borrow whose start time has passed.")
    if instance.end_time and instance.end_time <= now:
        raise ValidationError("Cannot modify a borrow whose end time has passed.")

    # approved_by must be equipment room PIC or Admin (when set)
    if instance.approved_by_id:
        approver_role = str(instance.approved_by.role or "").upper()
        if approver_role != "ADMIN":
            room_pic_id = instance.equipment.room_id and instance.equipment.room.pic_id
            if not room_pic_id or instance.approved_by_id != room_pic_id:
                raise ValidationError(
                    "Approver harus PIC ruangan dari equipment terkait atau Admin."
                )


@receiver(pre_save, sender=Room)
def validate_room(sender, instance, **kwargs):
    """
    Ensure Room.pic is a Profile with role Staff, Lecturer, or Admin.
    """
    if not instance.pic_id:
        return

    allowed_roles = {"STAFF", "LECTURER", "ADMIN"}
    pic_role = str(instance.pic.role or "").upper()
    if pic_role not in allowed_roles:
        raise ValidationError(
            "PIC harus user dengan role Staff, Lecturer, atau Admin."
        )


@receiver(pre_save, sender=Pengujian)
def validate_pengujians(sender, instance, **kwargs):
    """
    Pengujian rules:
    - Only editable while pending and not approved.
    - approved_by must be Admin (when set).
    """
    if instance.status != 'pending' or instance.approved_by is not None:
        raise ValidationError("Cannot modify a pengujian that is not pending.")

    if instance.approved_by_id:
        approver_role = str(instance.approved_by.role or "").upper()
        if approver_role not in {"ADMIN", "STAFF"}:
            raise ValidationError("Approver harus Admin atau Staff.")
