from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Schedule, ScheduleItem
from .serializers import ScheduleSerializer, ScheduleListSerializer, ScheduleItemSerializer


class ScheduleViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for schedules.
    
    list: GET /api/schedules/
    create: POST /api/schedules/
    retrieve: GET /api/schedules/{id}/
    update: PUT /api/schedules/{id}/
    partial_update: PATCH /api/schedules/{id}/
    destroy: DELETE /api/schedules/{id}/
    """
    queryset = Schedule.objects.prefetch_related('items', 'items__song')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ScheduleListSerializer
        return ScheduleSerializer
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add an item to the schedule."""
        schedule = self.get_object()
        
        # Get the next order number
        last_order = schedule.items.order_by('-order').first()
        next_order = (last_order.order + 1) if last_order else 0
        
        data = request.data.copy()
        data['order'] = data.get('order', next_order)
        
        serializer = ScheduleItemSerializer(data=data)
        if serializer.is_valid():
            serializer.save(schedule=schedule)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Reorder items in the schedule."""
        schedule = self.get_object()
        item_ids = request.data.get('item_ids', [])
        
        if not item_ids:
            return Response(
                {'error': 'item_ids required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        for order, item_id in enumerate(item_ids):
            ScheduleItem.objects.filter(
                schedule=schedule,
                id=item_id
            ).update(order=order)
        
        serializer = ScheduleSerializer(schedule)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'], url_path='items/(?P<item_id>[^/.]+)')
    def remove_item(self, request, pk=None, item_id=None):
        """Remove an item from the schedule."""
        schedule = self.get_object()
        
        try:
            item = schedule.items.get(id=item_id)
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ScheduleItem.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ScheduleItemViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for schedule items.
    """
    queryset = ScheduleItem.objects.select_related('song', 'schedule')
    serializer_class = ScheduleItemSerializer
