import uuid
from django.db import models


class Song(models.Model):
    """A worship song with lyrics."""
    
    SOURCE_CHOICES = [
        ('manual', 'Manual Entry'),
        ('txt_import', 'Text File Import'),
        ('gdrive', 'Google Drive Import'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    lyrics = models.TextField(help_text="Lyrics with section markers like [Verse 1], [Chorus]")
    default_background = models.ImageField(upload_to='backgrounds/', blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['title']
    
    def __str__(self):
        return self.title
    
    def get_sections(self):
        """Parse lyrics into sections."""
        import re
        sections = []
        current_section = {'type': 'intro', 'lines': []}
        
        for line in self.lyrics.split('\n'):
            # Check for section marker like [Verse 1], [Chorus], etc.
            match = re.match(r'^\[(.+?)\]$', line.strip())
            if match:
                if current_section['lines']:
                    sections.append(current_section)
                current_section = {'type': match.group(1), 'lines': []}
            elif line.strip():
                current_section['lines'].append(line.strip())
        
        if current_section['lines']:
            sections.append(current_section)
        
        return sections


class Background(models.Model):
    """Reusable background images."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to='backgrounds/')
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
