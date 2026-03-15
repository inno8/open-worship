"""
WebSocket consumers for real-time sync.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class SyncConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time sync between desktop app and web app.
    
    Events:
    - song_added: A new song was added
    - song_updated: A song was modified
    - song_deleted: A song was deleted
    - schedule_added: A new schedule was created
    - schedule_updated: A schedule was modified
    - schedule_deleted: A schedule was deleted
    - presentation_state: Current slide/song being presented (for remote control)
    """
    
    SYNC_GROUP = 'sync_all'
    
    async def connect(self):
        """Handle new WebSocket connection."""
        # Join the sync group
        await self.channel_layer.group_add(
            self.SYNC_GROUP,
            self.channel_name
        )
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': 'Connected to Open Worship sync'
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard(
            self.SYNC_GROUP,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            event_type = data.get('type')
            
            if event_type == 'ping':
                # Respond to ping
                await self.send(text_data=json.dumps({'type': 'pong'}))
            
            elif event_type in ('song_added', 'song_updated', 'song_deleted',
                               'schedule_added', 'schedule_updated', 'schedule_deleted',
                               'presentation_state'):
                # Broadcast to all connected clients
                await self.channel_layer.group_send(
                    self.SYNC_GROUP,
                    {
                        'type': 'sync_event',
                        'event': event_type,
                        'data': data.get('data', {})
                    }
                )
            
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown event type: {event_type}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def sync_event(self, event):
        """Handle sync events from the group."""
        await self.send(text_data=json.dumps({
            'type': event['event'],
            'data': event['data']
        }))
