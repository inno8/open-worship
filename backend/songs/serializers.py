from rest_framework import serializers
from .models import Song, Background


class SongSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Song
        fields = [
            'id', 'title', 'author', 'lyrics', 'default_background',
            'tags', 'source', 'sections', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sections']
    
    def get_sections(self, obj):
        return obj.get_sections()


class SongListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    
    class Meta:
        model = Song
        fields = ['id', 'title', 'author', 'tags', 'updated_at']


class BackgroundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Background
        fields = ['id', 'name', 'image', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']
