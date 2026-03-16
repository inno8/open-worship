"""
WebSocket URL routing.
"""

from django.urls import path
from songs.consumers import SyncConsumer

websocket_urlpatterns = [
    path('ws/sync/', SyncConsumer.as_asgi()),
]
