# Task: WebSocket Sync (#9 + #14)

## Overview
Implement real-time sync between the Django backend and Electron desktop app using WebSockets.

## Part 1: Backend (#14) - WebSocket broadcast on CRUD

### Setup Django Channels
1. Add to `requirements.txt`:
   ```
   channels>=4.0
   channels-redis>=4.0  # or use InMemoryChannelLayer for dev
   ```

2. Update `config/settings.py`:
   ```python
   INSTALLED_APPS = [
       'daphne',  # Add before django.contrib.staticfiles
       'channels',
       ...
   ]
   
   ASGI_APPLICATION = 'config.asgi.application'
   
   CHANNEL_LAYERS = {
       "default": {
           "BACKEND": "channels.layers.InMemoryChannelLayer"  # Use Redis in prod
       }
   }
   ```

3. Create `config/asgi.py`:
   ```python
   from channels.routing import ProtocolTypeRouter, URLRouter
   from django.core.asgi import get_asgi_application
   from channels.auth import AuthMiddlewareStack
   from . import routing
   
   application = ProtocolTypeRouter({
       "http": get_asgi_application(),
       "websocket": AuthMiddlewareStack(
           URLRouter(routing.websocket_urlpatterns)
       ),
   })
   ```

4. Create `config/routing.py`:
   ```python
   from django.urls import path
   from songs.consumers import SyncConsumer
   
   websocket_urlpatterns = [
       path('ws/sync/', SyncConsumer.as_asgi()),
   ]
   ```

### Create WebSocket Consumer
Create `songs/consumers.py`:
```python
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class SyncConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("sync", self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("sync", self.channel_name)
    
    async def sync_event(self, event):
        await self.send_json(event["data"])
```

### Add Django Signals
Create `songs/signals.py`:
```python
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
                    "author": instance.author,
                    "lyrics": instance.lyrics,
                }
            }
        }
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
                "song_id": str(instance.id)
            }
        }
    )
```

Same for Schedule model in `schedules/signals.py`.

Register signals in `songs/apps.py`:
```python
def ready(self):
    import songs.signals
```

## Part 2: Desktop (#9) - WebSocket sync client

### Create WebSocket Manager
Create `desktop/src/services/WebSocketSync.ts`:
```typescript
type EventHandler = (data: any) => void

class WebSocketSync {
  private ws: WebSocket | null = null
  private url: string
  private handlers: Map<string, EventHandler[]> = new Map()
  private reconnectTimer: number | null = null
  private reconnectDelay = 1000
  
  constructor(url: string) {
    this.url = url
  }
  
  connect() {
    this.ws = new WebSocket(this.url)
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectDelay = 1000
    }
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.emit(data.event, data)
    }
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...')
      this.scheduleReconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
      this.connect()
    }, this.reconnectDelay)
  }
  
  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
  }
  
  private emit(event: string, data: any) {
    const handlers = this.handlers.get(event) || []
    handlers.forEach(h => h(data))
  }
  
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.ws?.close()
  }
}

export const wsSync = new WebSocketSync('ws://localhost:8000/ws/sync/')
```

### Integrate with Stores
Update `desktop/src/stores/songStore.ts`:
```typescript
// In the store initialization or a useEffect hook
wsSync.on('song_added', (data) => {
  // Add song to local store
})

wsSync.on('song_updated', (data) => {
  // Update song in local store
})

wsSync.on('song_deleted', (data) => {
  // Remove song from local store
})
```

### Settings for Backend URL
Add to Settings:
- Backend URL input (default: ws://localhost:8000/ws/sync/)
- Connection status indicator
- Reconnect button

## Acceptance Criteria
- [ ] Django Channels installed and configured
- [ ] WebSocket endpoint at /ws/sync/ works
- [ ] Backend broadcasts song_added, song_updated, song_deleted
- [ ] Backend broadcasts schedule_added, schedule_updated, schedule_deleted
- [ ] Desktop connects to WebSocket
- [ ] Desktop reconnects on disconnect
- [ ] Desktop updates local stores on sync events
- [ ] Settings shows connection status

## Files to Create/Modify

### Backend:
- `backend/requirements.txt` — add channels
- `backend/config/settings.py` — channels config
- `backend/config/asgi.py` — ASGI application
- `backend/config/routing.py` — WebSocket routes
- `backend/songs/consumers.py` — WebSocket consumer
- `backend/songs/signals.py` — Song CRUD signals
- `backend/schedules/signals.py` — Schedule CRUD signals
- `backend/songs/apps.py` — register signals
- `backend/schedules/apps.py` — register signals

### Desktop:
- `desktop/src/services/WebSocketSync.ts` — WS client
- `desktop/src/stores/songStore.ts` — handle sync events
- `desktop/src/stores/scheduleStore.ts` — handle sync events
- `desktop/src/views/Settings.tsx` — backend URL config
