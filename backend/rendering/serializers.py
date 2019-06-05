import datetime
import grp
import os
import pwd
import pytz
import shutil
import stat

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework import serializers
from .models import Module, Profile, Project
from manimlab_api import settings


class UserSerializer(serializers.ModelSerializer):
    user_modules = serializers.ReadOnlyField(
        source='user.user_modules',
    )
    profile = serializers.ReadOnlyField(
        source='user.profile',
    )

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'password',
            'user_modules',
            'profile',
        )
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # TODO: add models based on session
        user = User(
            username = validated_data['username'],
            email = validated_data['email'],
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class SaveModuleSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField(read_only=True)

    def get_filename(self, module):
        return os.path.basename(module.source.name)

    class Meta:
        model = Module
        fields = (
            'id',
            'owner',
            'time',
            'filename',
        )

    # def createDateString(self):
    #     return datetime.datetime.now().isoformat().split('T')[0]

    # def create(self, validated_data, **kwargs):
    #     defaults = {
    #         'date': self.createDateString(),
    #         'code': validated_data['code'],
    #         'name': validated_data['name'],
    #     }
    #     scene, created = Module.objects.update_or_create(
    #         owner=validated_data['owner'],
    #         name=validated_data['oldName'],
    #         defaults=defaults,
    #     )
    #     return scene

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            'id',
            'user',
            'date_joined',
            'last_module',
            'last_scene',
        )

    def create(self, validated_data, **kwargs):
        if 'user' in validated_data:
            user = validated_data['user']
        else:
            user = None
        profile = Profile.objects.create(
            user=user,
            last_module=validated_data.get('last_module', None),
            last_scene=validated_data.get('last_scene', None),
            date_joined = datetime.datetime.now().isoformat().split('T')[0],
        )
        return profile

class RegistrationSerializer(UserSerializer, ProfileSerializer):
    def create(self, validated_data, **kwargs):
        user = UserSerializer.create(self, validated_data, **kwargs)
        profile = ProfileSerializer.create(self, validated_data, user=user)
        return profile

class ProjectSerializer(serializers.ModelSerializer):
    project_modules = serializers.ReadOnlyField(
        source='project.project_modules'
    )
    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'owner',
            'project_modules',
        )

    def create(self, validated_data, **kwargs):
        name = validated_data['name']
        owner = validated_data['owner']
        # create object
        project = Project.objects.create(
            owner=owner,
            name=name,
        )
        # create directories
        project_path = os.path.join(
            settings.MEDIA_ROOT,
            settings.USER_MEDIA_DIR,
            owner.username,
            settings.PROJECT_DIR,
            name,
        ) + os.sep
        source_path = os.path.join(project_path, settings.SOURCE_DIR)
        video_path = os.path.join(project_path, settings.VIDEO_DIR)
        try:
            os.makedirs(source_path)
            os.makedirs(video_path)
        except:
            pass
        else:
            # shutil.chown(project_path, user=None, group=settings.RENDER_GROUP)
            # shutil.chown(video_path, user=None, group=settings.RENDER_GROUP)
            # shutil.chown(files_path, user=None, group=settings.RENDER_GROUP)
            # shutil.chown(designs_path, user=None, group=settings.RENDER_GROUP)
            # source should remain read-only to the renderer

            # g+w
            for path in [project_path, video_path]:
                st = os.stat(path)
                os.chmod(path, st.st_mode | stat.S_IWGRP)

        # create modules
        if 'base_project' in validated_data:
            base_project_dir = os.path.join(
                settings.MEDIA_ROOT,
                settings.SHARED_MEDIA_DIR,
                settings.PROJECT_DIR,
                validated_data['base_project'],
                settings.SOURCE_DIR,
            )
            for module in os.listdir(base_project_dir):
                module_path = os.path.join(base_project_dir, module)
                if not os.path.isfile(module_path):
                    continue
                with open(module_path, 'r') as f:
                    Module.objects.create(
                        owner=owner,
                        project=project,
                        source=ContentFile(f.read(), name=module),
                        time=timezone.now(),
                    )
        return project
