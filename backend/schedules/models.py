import uuid
from django.db import models
from songs.models import Song


class Schedule(models.Model):
    """A service schedule containing songs and other items."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        if self.date:
            return f"{self.name} ({self.date})"
        return self.name


class ScheduleItem(models.Model):
    """An item in a schedule (song, blank slide, or custom text)."""
    
    ITEM_TYPES = [
        ('song', 'Song'),
        ('blank', 'Blank Slide'),
        ('custom', 'Custom Text'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='items')
    order = models.PositiveIntegerField(default=0)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES, default='song')
    
    # For song items
    song = models.ForeignKey(Song, on_delete=models.SET_NULL, null=True, blank=True)
    
    # For custom items
    custom_title = models.CharField(max_length=255, blank=True)
    custom_text = models.TextField(blank=True)
    
    # Override background for this item
    background_override = models.ImageField(upload_to='backgrounds/', blank=True, null=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        if self.item_type == 'song' and self.song:
            return f"{self.order}. {self.song.title}"
        elif self.item_type == 'custom':
            return f"{self.order}. {self.custom_title or 'Custom'}"
        return f"{self.order}. Blank"
