from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SongViewSet, BackgroundViewSet

router = DefaultRouter()
router.register(r'songs', SongViewSet)
router.register(r'backgrounds', BackgroundViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
