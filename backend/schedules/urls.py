from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScheduleViewSet, ScheduleItemViewSet

router = DefaultRouter()
router.register(r'schedules', ScheduleViewSet)
router.register(r'schedule-items', ScheduleItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
