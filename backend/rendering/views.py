import collections
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

        # create the profile
        profile_data = {'user': new_user.pk}
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
        if not request.user.is_anonymous:
            profile = Profile.objects.get(user=request.user)
        request_project_name = request.data.get("project", "")
        request_project_owner = request.data.get("owner", "")
        request_project_is_shared = request.data.get("shared", "")
        if (request_project_name == "") or \
            (request_project_owner == "") or \
            (request_project_is_shared == ""):
            if request.user.is_anonymous or \
                (not profile) or \
                (not profile.last_project):
                return Response(
                    {'info': 'no project specified or session to restore'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            project_name = profile.last_project.name
            project_owner = profile.last_project.owner.username
            project_is_shared = profile.last_project.is_shared
        else:
            # TODO: actually check this
            project_name = request_project_name
            project_owner = request_project_owner
            project_is_shared = request_project_is_shared
        if not project_is_shared and project_owner != request.user.username:
            return Response(
                {'info': 'you can\'t access that project'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            project = Project.objects.get(
                name=project_name,
                owner__username=project_owner,
                is_shared=project_is_shared,
            )
        except Exception:
            return Response({'info': 'project doesn\'t exist'})
        project_source_path = os.path.join(
            project.get_path(),
            settings.SOURCE_DIR,
        )
        project_files = os.listdir(project_source_path)
        project_files.sort(key=lambda x: (os.path.isdir(
            os.path.join(project_source_path, x)), x))
        default_file = project_files[0]

        default_project_file_path = os.path.join(
            project_source_path,
            default_file,
        )
        if profile and profile.last_module:
            project_file_path = os.path.join(
                project_source_path,
                os.path.relpath(
                    profile.last_module.source.name,
                    start=project_source_path,
                ),
            )
            if not os.path.exists(project_file_path):
                project_file_path = default_project_file_path
        else:
            project_file_path = default_project_file_path


        if profile and profile.last_scene:
            response_scene = profile.last_scene
        else:
            response_scene = ""

        with open(project_file_path) as response_file:
            response_data = {
                'username': '' if request.user.is_anonymous
                                else request.user.username,
                'filename': os.path.basename(project_file_path),
                'code': response_file.read(),
                'scene': response_scene,
                'files': [LIBRARY_DIR_ENTRY] + \
                         list_directory_contents(
                             project_source_path,
                         ),
                'project_name': project_name,
                'project_owner': project_owner,
                'project_is_shared': project_is_shared,
            }
        return Response(response_data)

class GetUsername(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def post(self, request):
        return Response({'username': request.user.username})

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
    permission_classes = ()

    def post(self, request):
        request_filepath = request.data['filepath']
        request_project_name = request.data['project']
        request_project_owner = request.data['owner']
        request_project_shared = request.data['shared']
        request_scene = request.data['scene']
        request_resolution = request.data['resolution']

        if not request_project_shared and request.user.is_anonymous:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        if not request_project_shared and request_project_owner != request.user.username:
            return Response(
                {'info': 'you can\'t access that project'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            project = Project.objects.get(
                name=request_project_name,
                owner__username=request_project_owner,
                is_shared=request_project_shared,
            )
        except Exception:
            return Response({'info': 'project doesn\'t exist'})
        ## TODO: add a way for Module to detect if a path matches its file,
        ## then get a Module instead
        container_filepath = os.path.join(
            settings.MEDIA_ROOT,
            get_valid_media_path(
                project.name,
                project.owner.username, 
                request_filepath,
                is_shared=request_project_shared,
            )
        )
        server_filepath = os.path.join(
            os.environ['DJANGO_MEDIA_ROOT'],
            os.path.relpath(
                container_filepath,
                start=settings.MEDIA_ROOT,
            )
        )
        server_source_path = os.path.join(
            os.environ['DJANGO_MEDIA_ROOT'],
            os.path.relpath(
                project.get_source_path(),
                start=settings.MEDIA_ROOT,
            )
        ) + os.sep
        server_video_path = os.path.join(
            server_source_path[:-len(settings.SOURCE_DIR)],
            settings.VIDEO_DIR,
        )
        container_video_path = os.path.join(
            settings.MEDIA_ROOT,
            os.path.relpath(
                server_video_path,
                start=os.environ['DJANGO_MEDIA_ROOT']
            ),
        )
        os.makedirs(container_video_path, exist_ok=True)

        resolution_dict = collections.defaultdict(
            lambda: "480p15", {
                "1440p": "1440p60",
                "1080p": "1080p60",
                "720p": "720p30",
                "480p": "480p15",
            }
        )

        server_video_output_path = os.path.join(
            server_video_path,
            os.path.relpath(
                os.path.splitext(container_filepath)[0],
                project.get_source_path(),
            ),
            resolution_dict[request_resolution],
            request_scene,
        )
        if request_project_shared:
            container_video_output_path = os.path.join(
                settings.MEDIA_ROOT,
                os.path.relpath(
                    server_video_output_path,
                    os.environ['DJANGO_MEDIA_ROOT'],
                )
            )
            if os.path.exists(os.path.join(
                container_video_output_path,
                request_scene + '.mp4',
            )):
                return Response({
                    'info': 'cached',
                    'location': os.path.join(
                        os.path.relpath(
                            server_video_output_path,
                            os.environ['DJANGO_MEDIA_ROOT'],
                        ),
                        request_scene + '.mp4',
                    ),
                })

        # enqueue the job
        q = Queue(connection=Redis(host=settings.REDIS_HOST))
        result = q.enqueue(
            'manimjob.render_scene',
            server_source_path,
            os.path.relpath(server_filepath, start=server_source_path),
            request_scene,
            server_video_output_path,
            server_source_path[:-len(settings.SOURCE_DIR)] + "tex/",
            request_resolution,
            job_timeout=210,
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
                if job.result['stdout'] and \
                    len(job.result['stdout'].split()) >= 4 and \
                    job.result['stdout'].split()[-4]:
                    manim_container_video_path = job.result['stdout'].split()[-4]
                    worker_container_video_path = job.args[3]
                    media_video_path = os.path.join(
                        os.path.relpath(
                            worker_container_video_path,
                            start=os.environ['DJANGO_MEDIA_ROOT'],
                        ),
                        os.path.relpath(
                            manim_container_video_path,
                            start="/root/video/",
                        ),
                    )
                    response_data['media_path'] = media_video_path
                if 'Traceback' in job.result['stderr']:
                    response_data['result']['returncode'] = 1
                response_data['filename'] = job.args[1]
                response_data['scene'] = job.args[2]
                response_data['resolution'] = job.args[5]
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
                name=request.data['project'],
                is_shared=False,
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
                is_directory=request.data['directory'],
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
        request_path_list = request.data['pathList']
        if request_path_list[0] == 'manimlib':
            source_dir = settings.MANIM_PATH
        else:
            request_project = request.data['project']
            request_owner = request.data['owner']
            request_shared = request.data['shared']
            if not request_shared and request_owner != request.user.username:
                return Response(
                    {'info': 'you can\'t access that project'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            project = Project.objects.get(
                name=request_project,
                owner__username=request_owner,
                is_shared=request_shared,
            )
            source_dir = os.path.join(project.get_path(), settings.SOURCE_DIR)
        path_from_source = os.path.join(*request_path_list)
        path = os.path.join(source_dir, path_from_source)

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
            return Response(list_directory_contents(path))
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
                list_directory_contents(project_source_path),
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
        project_owner = self.request.query_params['owner']
        project_shared = (self.request.query_params['shared'] == '1')
        if project_owner != self.request.user.username:
            return Response(
                {'info': 'you can\'t access that project'},
                status=status.HTTP_403_FORBIDDEN,
            )
        project = Project.objects.get(
            name=project_name,
            owner=self.request.user,
            is_shared=project_shared,
        )
        file_path = self.request.query_params['name']
        file_path = get_valid_media_path(
            project_name,
            self.request.user.username,
            file_path,
            is_shared=project_shared,
        )
        return Module.objects.get(
            owner=self.request.user,
            project=project,
            source=file_path,
        )

    def delete(self, request, *args, **kwargs):
        if request.query_params['directory'] == '1':
            directory_path = get_valid_media_path(
                request.query_params['project'],
                request.user.username,
                request.query_params['name'],
                is_shared=request.query_params['shared'] == 1,
                is_directory=True,
            )
            media_path = os.path.join(settings.MEDIA_ROOT, directory_path)
            shutil.rmtree(media_path)
            Module.objects.filter(source__startswith=directory_path).delete()
            return Response({'deleted': media_path})
        else:
            return super(ModuleDelete, self).delete(request, *args, **kwargs)


# TODO: only fetch the top layer of files
def list_directory_contents(path):
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
            }
            if os.path.isdir(os.path.join(path, entry)):
                obj['children'] = list_directory_contents(
                    os.path.join(path, entry),
                )
        ret.append(obj)
    return ret


def get_file_contents(file_path):
    return {'content': open(file_path).read()}


class Projects(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def get(self, request):
        if request.query_params['shared'] == '1':
            query = Project.objects.filter(is_shared=True)
        elif not request.user.is_anonymous:
            query = Project.objects.filter(
                owner__username=request.user.username,
                is_shared=False,
            )
        else:
            query = Project.objects.none()
        return Response({
            'projects': map(
                lambda project: project.name, query,
            ),
            'owners': map(
                lambda project: project.owner.username, query,
            ),
            'username': '' if request.user.is_anonymous else request.user.username,
        })

    def post(self, request):
        if request.user.is_anonymous:
            return Response({'info': 'no'})
        request_source_project_name = request.data['projectName']
        request_source_owner_username = request.data['projectOwner']
        request_source_project_shared = request.data['projectShared']
        request_dest_project_name = request.data['shareName']

        project_serializer = ProjectSerializer(data={
            'name': request_dest_project_name,
            'owner': request.user.pk,
            'is_shared': False if request_source_project_shared else True,
        })
        project_serializer.is_valid(raise_exception=True)
        new_project = project_serializer.save(
            base_project_pk=Project.objects.get(
                owner__username=request_source_owner_username,
                name=request_source_project_name,
                is_shared=request_source_project_shared,
            ).pk,
        )
        return Response({'info': 'finished'})

    def delete(self, request):
        request_project_name = request.query_params['projectName']
        request_project_shared = request.query_params['projectShared']
        Project.objects.get(
            name=request_project_name,
            is_shared=True if request_project_shared == 'true' else False,
            owner=request.user.pk,
        ).delete()
        return Response({'info': 'finished'})
