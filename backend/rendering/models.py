import uuid
from importlib import import_module
import os
import shutil
import sys

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

    def get_path(self):
        return os.path.join(
            settings.MEDIA_ROOT,
            settings.USER_MEDIA_DIR,
            self.owner.username,
            settings.PROJECT_DIR,
            self.name,
        )

    def get_source_path(self):
        return os.path.join(self.get_path(), settings.SOURCE_DIR)

    def delete(self):
        shutil.rmtree(self.get_path())
        super(Project, self).delete()

    class Meta:
        unique_together = ('owner', 'name')

def in_directory(path, directory, allow_symlink=False):
    # make both absolute
    directory = os.path.abspath(directory)
    path = os.path.abspath(path)

    #check whether path is a symbolic link, if yes, return false if they are not allowed
    if not allow_symlink and os.path.islink(path):
        return False

    #return true, if the common prefix of both is equal to directory
    #e.g. /a/b/c/d.rst and directory is /a/b, the common prefix is /a/b
    return os.path.commonprefix([path, directory]) == directory

def is_shared_media_path(path):
    return in_directory(path, os.sep + settings.SHARED_MEDIA_DIR)

def is_user_path(path, username):
    return in_directory(
        path,
        os.path.join(os.sep + settings.USER_MEDIA_DIR, username)
    )

def get_valid_media_path(project_name, username, filename):
    user_directory = os.path.normpath(os.path.join(
        settings.USER_MEDIA_DIR,
        username,
        settings.PROJECT_DIR,
        project_name,
        settings.SOURCE_DIR,
    ))
    media_path = os.path.normpath(os.path.join(
        user_directory,
        filename,
    ))

    valid = True
    # can't overwrite user directory
    if (media_path == user_directory):
        valid = False
    # must be underneath user directory
    if not os.path.realpath(media_path).startswith(
        os.path.realpath(user_directory)):
        valid = False
    # must be within an existing directory
    parent_dir = os.path.join(
        settings.MEDIA_ROOT,
        os.path.dirname(media_path),
    )
    if not os.path.exists(parent_dir) and os.path.isdir(parent_dir):
        valid = False

    if not valid:
        raise Exception('invalid media path')
    else:
        return media_path


class Module(models.Model):
    def module_path(instance, filename):
        return get_valid_media_path(
            instance.project.name,
            instance.owner.username,
            filename,
        )

    def short_path(self):
        return os.path.relpath(
            os.path.join(settings.MEDIA_ROOT, self.source.name),
            self.project.get_source_path(),
        )

    def delete(self):
        backend_directory = os.path.dirname(os.path.realpath(sys.argv[0]))
        if os.path.basename(backend_directory) != "backend":
            raise Exception("path error: not deleting for safety")
        module_file_path = os.path.join(
            backend_directory,
            settings.MEDIA_ROOT,
            self.source.name,
        )
        os.remove(module_file_path)
        super(Module, self).delete()

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

    def delete(self):
        user_dir = os.path.join(
            settings.MEDIA_ROOT,
            settings.USER_MEDIA_DIR,
            self.user.username,
        )
        shutil.rmtree(user_dir)
        super(Profile, self).delete()

    def __str__(self):
        if self.user is None:
            return "Profile(" + self.uuid + ")"
        else:
            return "Profile(" + self.user.username + ")"
