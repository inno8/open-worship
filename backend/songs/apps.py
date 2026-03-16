from django.apps import AppConfig


class SongsConfig(AppConfig):
    name = 'songs'

    def ready(self):
        import songs.signals  # noqa: F401
