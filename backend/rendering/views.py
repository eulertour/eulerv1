import os
import pytz
import re
import shlex
import shutil
import subprocess

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from django.core.files import File
from django.core.files.base import ContentFile
from django.db.models import Value
from django.db.models.functions import Length, Concat, Right
from django.utils import timezone
from redis import Redis
from rest_framework import generics, viewsets, views, mixins
from rest_framework import permissions
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenVerifySerializer
from rest_framework_simplejwt.tokens import AccessToken
from rq import Queue

from rendering.permissions import IsOwner
from manimlab_api import settings
from .models import (
    Module,
    Profile,
    Project,
    get_valid_media_path,
    is_shared_media_path,
    is_user_path,
    in_directory,
)
from .serializers import (
    UserSerializer,
    SaveModuleSerializer,
    ProfileSerializer,
    RegistrationSerializer,
    ProjectSerializer,
)
from . import manimjob

LIBRARY_DIR_ENTRY = {
    'name': 'manimlib',
    'directory': True,
    'library': True,
    'project': 'manim',
}


class LogIn(views.APIView):
    permission_classes = ()
    authentication_classes = ()

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        errors = []
        if not username:
            errors.append('username cannot be empty')
        if not password:
            errors.append('password cannot be empty')
        if errors:
            return Response(
                {'info': errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request,
            username=username,
            password=password,
        )
        if user is None:
            return Response(
                {'info': ['Invalid login credentials']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TokenObtainPairSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            # TODO: why would this happen?
            raise InvalidToken(e.args[0])
        jwtResponse = Response(serializer.validated_data, status=status.HTTP_200_OK)
        jwtResponse.data['username'] = user.username
        return jwtResponse


class SignUp(generics.GenericAPIView):
    permission_classes = ()
    authentication_classes = ()

    def post(self, request):
        errors = []
        if not request.data.get('username'):
            errors.append('username cannot be empty')
        if not request.data.get('email'):
            errors.append('email cannot be empty')
        if not request.data.get('password'):
            errors.append('password cannot be empty')
        elif len(request.data['password']) < 8:
            errors.append('password must be at least 8 characters long')
        if errors:
            return Response(
                {'info': errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # create the user
        user_serializer = UserSerializer(data=request.data)
        try:
            user_serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {'info': list(e.detail.values())},
                status=status.HTTP_400_BAD_REQUEST,
            )
        new_user = user_serializer.save()

        # create the project
        project_serializer = ProjectSerializer(data={
            'name': settings.DEFAULT_PROJECT,
            'owner': new_user.pk,
        })
        project_serializer.is_valid(raise_exception=True)
        new_project = project_serializer.save(
            base_project=settings.DEFAULT_PROJECT)

        # create the profile
        profile_data = {
            'user': new_user.pk,
            'last_project': new_project.pk,
        }
        profile_serializer = ProfileSerializer(data=profile_data)
        profile_serializer.is_valid(raise_exception=True)
        new_profile = profile_serializer.save()

        # create and return the jwts
        jwt_serializer = TokenObtainPairSerializer(data=request.data)
        try:
            jwt_serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        jwtResponse = Response(jwt_serializer.validated_data, status=status.HTTP_200_OK)
        jwtResponse.data['username'] = new_user.username
        return jwtResponse


class Session(generics.RetrieveAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def post(self, request):
        profile = None
        response_data = {}
        if request.user.is_anonymous:
            # return the defaults
            # TODO: this response is fixed, so just return it
            project_name = settings.DEFAULT_PROJECT
            project_source_path = os.path.join(
                settings.MEDIA_ROOT,
                settings.SHARED_MEDIA_DIR,
                settings.PROJECT_DIR,
                project_name,
                settings.SOURCE_DIR,
            )
            project_file_path = os.path.join(
                project_source_path,
                settings.DEFAULT_PROJECT_FILENAME,
            )
            response_scene = settings.DEFAULT_PROJECT_SCENE
        else:
            response_data = {'username': request.user.username}
            profile = Profile.objects.get(user=request.user)
            use_defaults = True
            # restore previous session
            # TODO: only allow path-friendly characters for everything
            if profile.last_project:
                project_name = profile.last_project.name
            else:
                project_name = settings.DEFAULT_PROJECT
            project_source_path = os.path.join(
                settings.MEDIA_ROOT,
                settings.USER_MEDIA_DIR,
                request.user.username,
                settings.PROJECT_DIR,
                project_name,
                settings.SOURCE_DIR,
            )
            if profile.last_module:
                project_file_path = os.path.join(
                    project_source_path,
                    os.path.relpath(
                        profile.last_module.source.name,
                        start=project_source_path,
                    ),
                )
                if not os.path.exists(project_file_path):
                    project_file_path = os.path.join(
                        project_source_path,
                        settings.DEFAULT_PROJECT_FILENAME,
                    )
            else:
                project_file_path = os.path.join(
                    project_source_path,
                    settings.DEFAULT_PROJECT_FILENAME,
                )
            if profile.last_scene:
                response_scene = profile.last_scene
            else:
                response_scene = settings.DEFAULT_PROJECT_SCENE

        with open(project_file_path) as response_file:
            response_data.update({
                'filename': os.path.relpath(project_file_path, project_source_path),
                'code': response_file.read(),
                'scene': response_scene,
                'files': [LIBRARY_DIR_ENTRY] +
                list_directory_contents(project_source_path, project_name),
                'project': project_name,
            })
        return Response(response_data)


class VideoAuth(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def get(self, request):
        media_path = request.META.get('HTTP_X_ORIGINAL_URI')
        if not media_path:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if is_shared_media_path(media_path):
            return Response(status=status.HTTP_200_OK)
        if request.user.is_anonymous:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if is_user_path(media_path, request.user.username):
            return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_403_FORBIDDEN)


class Render(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        input_filename = request.data["filename"]
        input_scene = request.data["scene"]
        if input_scene is None:
            return Response({'info': 'no scene specified'})

        # enqueue the job
        manim_path = os.path.join(
            os.environ['DJANGO_MEDIA_ROOT'],
            settings.LIBRARY_DIR,
        )
        project_path = os.path.join(
            os.environ['DJANGO_MEDIA_ROOT'],
            settings.USER_MEDIA_DIR,
            request.user.username,
            settings.PROJECT_DIR,
            request.data['project'],
        )
        q = Queue(connection=Redis(host=settings.REDIS_HOST))
        result = q.enqueue(
            'manimjob.render_scene',
            input_filename,
            input_scene,
            manim_path,
            project_path,
        )

        response_data = request.data
        response_data['job_id'] = result.id
        return Response(response_data)


class CheckRenderJob(generics.GenericAPIView):
    authentication_classes = ()
    permission_classes = ()

    def get(self, request, job_id):
        q = Queue(connection=Redis(host=settings.REDIS_HOST))
        job = q.fetch_job(job_id)
        if job:
            response_data = {
                'status': job.status,
                'result': job.result,
            }
            if job.status == 'finished':
                response_data['scene'] = job.args[1]
                response_data['filename'] = job.args[0]
            return Response(response_data)
        else:
            return Response({'status': 'unknown scene'})


class Save(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        for field in ["name", "project"]:
            if (field not in request.data):
                return Response(
                    {'error': f'request is missing {field}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            project = Project.objects.get(
                owner=request.user,
                name=request.data['project']
            )
        except Exception:
            return Response(
                {'error': 'invalid project'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            media_path = get_valid_media_path(
                project.name,
                request.user.username,
                request.data['name'],
            )
        except Exception:
            return Response(
                {'error': 'invalid filename'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = newName = request.data['name']
        if 'newName' in request.data:
            try:
                new_path = get_valid_media_path(
                    project.name,
                    request.user.username,
                    request.data['newName'],
                )
            except Exception:
                return Response(
                    {'error': 'invalid new filename'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                newName = request.data['newName']

        if request.data['directory']:
            if 'newName' in request.data:
                os.rename(
                    os.path.join(settings.MEDIA_ROOT, media_path),
                    os.path.join(settings.MEDIA_ROOT, new_path),
                )
                Module.objects.filter(source__startswith=media_path).update(
                    source=Concat(
                        Value(new_path),
                        Right(
                            'source',
                            Length('source') - len(media_path)
                        )
                    )
                )
                return Response(request.data)
            else:
                os.mkdir(os.path.join(settings.MEDIA_ROOT, media_path))
                return Response(request.data)
        else:
            if 'code' in request.data:
                defaults = {
                    'time': timezone.now(),
                    'source': ContentFile(
                        request.data['code'],
                        name=newName,
                    ),
                }
                module, created = Module.objects.update_or_create(
                    owner=request.user,
                    project=project,
                    source=media_path,
                    defaults=defaults,
                )
            else:
                module = Module.objects.get(
                    owner=request.user,
                    project=project,
                    source=media_path,
                )
                module.source.name = new_path
                module.save()
                os.rename(
                    os.path.join(settings.MEDIA_ROOT, media_path),
                    os.path.join(settings.MEDIA_ROOT, new_path),
                )

            profile = Profile.objects.get(user=request.user)
            profile.last_module = module
            if 'scene' in request.data:
                profile.last_scene = request.data['scene']
            profile.last_project = project
            profile.save()

            module_serializer = SaveModuleSerializer(module)
            return Response(module_serializer.data)


class Files(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def post(self, request):
        # TODO: secure directory construction (factor from models.Module)
        # TODO: check if the project is shared, if so read from shared data
        project = request.data['project']
        if project == "manim":
            source_dir = settings.LIBRARY_DIR
        elif request.user.is_anonymous:
            # read from shared
            source_dir = os.path.join(
                settings.MEDIA_ROOT,
                settings.SHARED_MEDIA_DIR,
                settings.PROJECT_DIR,
                project,
                settings.SOURCE_DIR,
            )
        else:
            # read from user files
            # TODO: fails if a user looks for a non-manim shared project
            source_dir = os.path.join(
                settings.MEDIA_ROOT,
                settings.USER_MEDIA_DIR,
                request.user.username,
                settings.PROJECT_DIR,
                project,
                settings.SOURCE_DIR,
            )
        path = os.path.join(*request.data['pathList'])
        path = os.path.join(
            settings.MEDIA_ROOT,
            source_dir,
            path,
        )

        shared_dir = os.path.join(
            settings.MEDIA_ROOT,
            settings.SHARED_MEDIA_DIR,
        )

        valid = False
        if in_directory(path, shared_dir):
            valid = True
        elif in_directory(
            path,
            os.path.join(
                settings.MEDIA_ROOT,
                settings.USER_MEDIA_DIR,
                request.user.username,
            )
        ):
            valid = True
        if not valid:
            return Response({'info': 'no'})

        if os.path.isdir(path):
            return Response(list_directory_contents(path, project))
        else:
            return Response(get_file_contents(path))


class ProjectDelete(generics.DestroyAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsOwner)

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)

    def get_object(self):
        project_name = self.request.query_params['project']
        user = self.request.user
        return Project.objects.get(owner=user, name=project_name)

    def delete(self, request, *args, **kwargs):
        project = self.get_object()

        # delete the modules
        Module.objects.filter(project=project).delete()

        # delete the project
        project.delete()

        # create new project because users currently must have a project
        project_serializer = ProjectSerializer(data={
            'name': settings.DEFAULT_PROJECT,
            'owner': request.user.pk,
        })
        project_serializer.is_valid(raise_exception=True)
        new_project = project_serializer.save(
            base_project=settings.DEFAULT_PROJECT)

        # add files for new project to response
        response_data = {}
        project_source_path = os.path.join(
            new_project.get_path(),
            settings.SOURCE_DIR,
        )
        project_file_path = os.path.join(
            project_source_path,
            settings.DEFAULT_PROJECT_FILENAME,
        )
        with open(project_file_path) as response_file:
            response_data.update({
                'filename': os.path.relpath(project_file_path, project_source_path),
                'code': response_file.read(),
                'scene': settings.DEFAULT_PROJECT_SCENE,
                'files': [LIBRARY_DIR_ENTRY] +
                list_directory_contents(project_source_path, new_project.name),
                'project': new_project.name,
            })
        return Response(response_data)


class ModuleDelete(generics.DestroyAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsOwner)
    serializer_class = SaveModuleSerializer

    def get_queryset(self):
        return Module.objects.filter(owner=self.request.user)

    def get_object(self):
        project_name = self.request.query_params['project']
        user = self.request.user
        project = Project.objects.get(owner=user, name=project_name)
        file_path = self.request.query_params['name']
        file_path = os.path.relpath(
            os.path.join(project.get_source_path(), file_path),
            settings.MEDIA_ROOT,
        )
        return Module.objects.get(
            owner=user,
            project=project,
            source=file_path,
        )

    def delete(self, request, *args, **kwargs):
        if request.query_params['directory'] == '1':
            directory_path = get_valid_media_path(
                request.query_params['project'],
                request.user.username,
                request.query_params['name'],
            )
            media_path = os.path.join(settings.MEDIA_ROOT, directory_path)
            shutil.rmtree(media_path)
            Module.objects.filter(source__startswith=directory_path).delete()
            return Response({'deleted': media_path})
        else:
            return super(ModuleDelete, self).delete(request, *args, **kwargs)


def list_directory_contents(path, project):
    ret = []
    entries = os.listdir(path)
    entries.sort(key=lambda x:
                 (os.path.isfile(os.path.join(path, x)), x))
    ignored_entries = ['__pycache__', 'files', 'media_dir.txt']
    for entry in entries:
        if entry in ignored_entries:
            continue
        else:
            obj = {
                'name': entry,
                'directory': os.path.isdir(os.path.join(path, entry)),
                'project': project,
            }
            if os.path.isdir(os.path.join(path, entry)):
                obj['children'] = list_directory_contents(
                    os.path.join(path, entry),
                    project,
                )
        ret.append(obj)
    return ret


def get_file_contents(file_path):
    return {'content': open(file_path).read()}


class Projects(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def get(self, request):
        projects = os.listdir(settings.OLD_PROJECTS_DIR)
        projects.sort(
            key=lambda x:
                (os.path.isfile(os.path.join(settings.OLD_PROJECTS_DIR, x)), x)
        )
        return Response({'projects': projects})
