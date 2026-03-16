"""
WebSocket consumer for real-time sync (Song and Schedule CRUD events).
"""

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class SyncConsumer(AsyncJsonWebsocketConsumer):
    """Broadcasts sync events to all connected clients (e.g. desktop app)."""

    async def connect(self):
        await self.channel_layer.group_add("sync", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("sync", self.channel_name)

    async def sync_event(self, event):
        await self.send_json(event["data"])
