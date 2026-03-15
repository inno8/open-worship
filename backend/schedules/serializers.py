from rest_framework import serializers
from .models import Schedule, ScheduleItem
from songs.serializers import SongSerializer


class ScheduleItemSerializer(serializers.ModelSerializer):
    song_detail = SongSerializer(source='song', read_only=True)
    
    class Meta:
        model = ScheduleItem
        fields = [
            'id', 'order', 'item_type', 'song', 'song_detail',
            'custom_title', 'custom_text', 'background_override'
        ]
        read_only_fields = ['id']


class ScheduleSerializer(serializers.ModelSerializer):
    items = ScheduleItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Schedule
        fields = [
            'id', 'name', 'date', 'notes', 'items', 'item_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_item_count(self, obj):
        return obj.items.count()


class ScheduleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Schedule
        fields = ['id', 'name', 'date', 'item_count', 'updated_at']
    
    def get_item_count(self, obj):
        return obj.items.count()
