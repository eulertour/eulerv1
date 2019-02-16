import uuid
from importlib import import_module
import os

from django.db import models
from django.contrib.auth import get_user_model

from rendering.storage import OverwriteStorage
from manimlab_api import settings


class Project(models.Model):
    User = get_user_model()
    owner = models.ForeignKey(
        User,
        related_name='projects',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('owner', 'name')

class Module(models.Model):
    def module_path(instance, filename):
        # TODO: handle unicode
        user_directory = os.path.normpath(os.path.join(
            settings.USER_MEDIA_DIR,
            instance.owner.username,
            settings.PROJECT_DIR,
            instance.project.name,
            settings.SOURCE_DIR,
        ))
        module_path = os.path.normpath(os.path.join(
            user_directory,
            filename,
        ))
        if (module_path == user_directory) or \
                (os.path.dirname(module_path) != user_directory):
            raise Exception('no')
        else:
            return module_path

    User = get_user_model()
    owner = models.ForeignKey(
        User,
        related_name='user_modules',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    project = models.ForeignKey(
        Project,
        related_name='project_modules',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    source = models.FileField(
        upload_to=module_path,
        storage=OverwriteStorage(),
        blank=True,
        null=True,
    )
    time = models.DateTimeField(blank=True)

    class Meta:
        unique_together = ('owner', 'project', 'source')

    def __str__(self):
        return self.source.name

class Profile(models.Model):
    User = get_user_model()
    user = models.OneToOneField(
        User,
        related_name='profile',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    date_joined = models.DateField(
        blank=True,
    )
    last_module = models.ForeignKey(
        Module,
        related_name='profile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    last_scene = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    last_project = models.ForeignKey(
        Project,
        related_name='profile',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    def __str__(self):
        if self.user is None:
            return "Profile(" + self.uuid + ")"
        else:
            return "Profile(" + self.user + ")"
