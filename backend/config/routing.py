"""
WebSocket URL routing.
"""

from django.urls import path
from config.consumers import SyncConsumer

websocket_urlpatterns = [
    path('ws/sync/', SyncConsumer.as_asgi()),
]
