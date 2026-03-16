"""
Django signals to broadcast Schedule CRUD over WebSocket.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Schedule


def schedule_to_payload(instance):
    return {
        "id": str(instance.id),
        "name": instance.name,
        "date": instance.date.isoformat() if instance.date else None,
        "notes": instance.notes or "",
    }


@receiver(post_save, sender=Schedule)
def schedule_saved(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    event_type = "schedule_added" if created else "schedule_updated"
    async_to_sync(channel_layer.group_send)(
        "sync",
        {
            "type": "sync.event",
            "data": {
                "event": event_type,
                "schedule": schedule_to_payload(instance),
            },
        },
    )


@receiver(post_delete, sender=Schedule)
def schedule_deleted(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "sync",
        {
            "type": "sync.event",
            "data": {
                "event": "schedule_deleted",
                "schedule_id": str(instance.id),
            },
        },
    )
