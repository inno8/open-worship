from django.apps import AppConfig


class SchedulesConfig(AppConfig):
    name = 'schedules'

    def ready(self):
        import schedules.signals  # noqa: F401
