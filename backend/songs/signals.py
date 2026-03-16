"""
Django signals to broadcast Song CRUD over WebSocket.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Song


@receiver(post_save, sender=Song)
def song_saved(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    event_type = "song_added" if created else "song_updated"
    async_to_sync(channel_layer.group_send)(
        "sync",
        {
            "type": "sync.event",
            "data": {
                "event": event_type,
                "song": {
                    "id": str(instance.id),
                    "title": instance.title,
                    "author": instance.author or "",
                    "lyrics": instance.lyrics or "",
                },
            },
        },
    )


@receiver(post_delete, sender=Song)
def song_deleted(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "sync",
        {
            "type": "sync.event",
            "data": {
                "event": "song_deleted",
                "song_id": str(instance.id),
            },
        },
    )
