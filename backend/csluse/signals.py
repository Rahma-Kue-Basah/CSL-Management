from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import Image, Booking, Borrow


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
