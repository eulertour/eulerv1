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
from django.contrib.auth import get_user_model


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
            'is_shared',
        )

    def create(self, validated_data, **kwargs):
        name = validated_data['name']
        owner = validated_data['owner']
        base_project_pk = validated_data.get('base_project_pk', None)
        is_shared = validated_data['is_shared']
        # create object
        project = Project.objects.create(
            owner=owner,
            name=name,
            is_shared=is_shared,
        )
        # create directories
        project_path = project.get_path() + os.sep
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

        # create modules if created from a base project
        if base_project_pk:
            base_project_source_path = os.path.join(
                Project.objects.get(pk=base_project_pk).get_path(),
                settings.SOURCE_DIR,
            )
            project_source_path = os.path.join(
                project.get_path(),
                settings.SOURCE_DIR,
            )
            # TODO: why not copy the directory and create Modules afterward?
            def copy_modules(source_dir):
                for module in os.listdir(source_dir):
                    if '__pycache__' in module: continue
                    module_path = os.path.join(source_dir, module)
                    if os.path.isdir(module_path):
                        relative_path = os.path.relpath(
                                module_path, base_project_source_path)
                        user_project_path = os.path.join(
                                project_source_path, relative_path)
                        os.mkdir(user_project_path)
                        copy_modules(module_path)
                    else:
                        with open(module_path, 'r') as f:
                            Module.objects.create(
                                owner=owner,
                                project=project,
                                source=ContentFile(
                                    f.read(),
                                    name=os.path.relpath(
                                        module_path,
                                        base_project_source_path,
                                    ),
                                ),
                                time=timezone.now(),
                            )
            copy_modules(base_project_source_path)
        return project

class ProjectFromDirectorySerializer(serializers.ModelSerializer):
    User = get_user_model()
    owner = serializers.CharField(max_length=150)
    name = serializers.CharField(max_length=100)
    shared = serializers.BooleanField(required=True)
    directory = serializers.FilePathField(
        settings.MEDIA_ROOT,
        recursive=True,
        allow_folders=True,
        allow_files=False,
    )

    class Meta:
        model = Project
        fields = '__all__'

    def create(self, validated_data):
        owner = User.objects.get(username=validated_data['owner'])
        project = Project.objects.create(
            owner=owner,
            name=validated_data['name'],
            is_shared=validated_data['shared'],
        )
        project_source_path = os.path.join(
            project.get_path(),
            settings.SOURCE_DIR,
        )
        os.makedirs(project_source_path, mode=0o775, exist_ok=True)

        import glob
        for filepath in glob.iglob(
            os.path.join(validated_data['directory'], '') + '**/*',
            recursive=True,
        ):
            if os.path.realpath(filepath) == os.path.realpath(
                validated_data['directory']
            ):
                continue
            if os.path.realpath(filepath).startswith(
                os.path.realpath(project_source_path)
            ):
                continue
            if '__pycache__' in filepath:
                continue
            if os.path.isdir(filepath):
                os.mkdir(os.path.join(
                    project_source_path,
                    os.path.relpath(
                        filepath,
                        validated_data['directory'],
                    ),
                ))
            else:
                with open(filepath) as module_filepath:
                    m = Module.objects.create(
                        owner=owner,
                        project=project,
                        source=ContentFile(
                            module_filepath.read(),
                            name=os.path.relpath(
                                filepath,
                                validated_data['directory'],
                            )
                        ),
                        time=timezone.now(),
                    )

        return project
