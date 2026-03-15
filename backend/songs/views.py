from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q

from .models import Song, Background
from .serializers import SongSerializer, SongListSerializer, BackgroundSerializer


class SongViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for songs.
    
    list: GET /api/songs/
    create: POST /api/songs/
    retrieve: GET /api/songs/{id}/
    update: PUT /api/songs/{id}/
    partial_update: PATCH /api/songs/{id}/
    destroy: DELETE /api/songs/{id}/
    """
    queryset = Song.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'author', 'lyrics']
    ordering_fields = ['title', 'author', 'created_at', 'updated_at']
    ordering = ['title']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SongListSerializer
        return SongSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search songs by title, author, or lyrics content."""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        songs = Song.objects.filter(
            Q(title__icontains=query) |
            Q(author__icontains=query) |
            Q(lyrics__icontains=query)
        )[:20]
        
        serializer = SongListSerializer(songs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def import_txt(self, request):
        """Import a song from a .txt file."""
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        content = file.read().decode('utf-8')
        
        # First line is title, rest is lyrics
        lines = content.strip().split('\n')
        title = lines[0].strip() if lines else 'Untitled'
        lyrics = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ''
        
        song = Song.objects.create(
            title=title,
            lyrics=lyrics,
            source='txt_import'
        )
        
        serializer = SongSerializer(song)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BackgroundViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for background images.
    """
    queryset = Background.objects.all()
    serializer_class = BackgroundSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this background as the default."""
        background = self.get_object()
        
        # Unset other defaults
        Background.objects.filter(is_default=True).update(is_default=False)
        
        # Set this one
        background.is_default = True
        background.save()
        
        serializer = self.get_serializer(background)
        return Response(serializer.data)
