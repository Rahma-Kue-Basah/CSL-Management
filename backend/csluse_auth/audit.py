from __future__ import annotations

import json
from typing import Any

from django.contrib.admin.models import ADDITION, CHANGE, DELETION, LogEntry
from django.contrib.contenttypes.models import ContentType


def _normalize_change_message(change_message: Any) -> str:
    if change_message is None:
        return ""
    if isinstance(change_message, str):
        return change_message
    if isinstance(change_message, (list, dict)):
        try:
            return json.dumps(change_message, ensure_ascii=False)
        except Exception:
            return str(change_message)
    return str(change_message)


def log_admin_action(
    actor: Any,
    obj: Any,
    action_flag: int,
    change_message: Any = "",
) -> None:
    if actor is None or not getattr(actor, "is_authenticated", False):
        return
    if obj is None:
        return
    if action_flag not in (ADDITION, CHANGE, DELETION):
        return

    content_type = ContentType.objects.get_for_model(obj, for_concrete_model=False)

    LogEntry.objects.create(
        user_id=actor.pk,
        content_type_id=content_type.pk,
        object_id=str(getattr(obj, "pk", "")),
        object_repr=str(obj)[:200],
        action_flag=action_flag,
        change_message=_normalize_change_message(change_message),
    )

