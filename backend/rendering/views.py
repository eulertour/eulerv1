import os
import pytz
import re
import shlex
import subprocess

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from django.core.files import File
from django.core.files.base import ContentFile
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
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import AccessToken
from rq import Queue

from rendering.permissions import IsOwner
from manimlab_api import settings
from .models import Module, Profile, Project, get_valid_media_path
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

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = views.exception_handler(exc, context)

    # Now add the HTTP status code to the response.
    if response is not None:
        response.data['status_code'] = response.status_code
        if response.status_code == 403:
            return Response(response.data)

    return response

class UserDetail(generics.RetrieveAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserList(generics.ListAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserDelete(generics.DestroyAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserCreate(generics.CreateAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ProfileCreate(generics.CreateAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class HelloView(views.APIView):
    authentication_classes = (SessionAuthentication,)
    permission_classes = (IsAuthenticated,)
    def get(self, request):
        content = {'message': 'Hello, World!'}
        return Response(content)

    def post(self, request):
        x = request.data
        # content = {'message': request.data['a']}
        content = {'message': '???'}
        return Response(content)

def get_auth_info(request):
    auth = request.META.get('HTTP_AUTHORIZATION', None)
    if not auth:
        return ('noauth', None)

    session_match = re.match('Session (\w+)', auth)
    if session_match:
        session_key = session_match.group(1)
        session = SessionStore(session_key=session_key)
        if 'user' not in session:
            return ('session', session_key)
        else:
            return ('user', session['user'])

    # TODO: this should raise an exception
    return (None, None)

class SignUp(generics.GenericAPIView):
    permission_classes = ()
    authentication_classes = ()

    def post(self, request):
        # assert(request has no jwt)

        # create the user
        # TODO: catch username already exists
        user_serializer = UserSerializer(data=request.data)
        user_serializer.is_valid(raise_exception=True)
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

class LogIn(views.APIView):
    permission_classes = ()
    authentication_classes = ()

    def post(self, request):
        username = request.data['username']
        password = request.data['password']
        user = authenticate(
            request,
            username=username,
            password=password,
        )
        if user is None:
            return Response(
                { 'info': 'Invalid credentials' })
        serializer = TokenObtainPairSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
        jwtResponse = Response(serializer.validated_data, status=status.HTTP_200_OK)
        jwtResponse.data['username'] = user.username
        return jwtResponse

class ProfileList(generics.ListAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class ProfileDetail(generics.RetrieveAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

def list_directory_contents(path, project):
    ret = []
    entries = os.listdir(path)
    entries.sort(key=lambda x:
        (os.path.isfile(os.path.join(path, x)), x)
    )
    ignored_entries = ['__pycache__', 'files', 'media_dir.txt']
    for entry in entries:
        if entry in ignored_entries:
            continue
        obj = {
            'name': entry,
            'directory': os.path.isdir(os.path.join(path, entry)),
            'project': project,
        }
        ret.append(obj)
    return ret

def get_file_contents(file_path):
    return { 'content': open(file_path).read() }
    
def list_user_files(username):
    modules_dir = os.path.join(settings.MEDIA_ROOT, username, 'modules')
    return list_directory_contents(modules_dir)

class Session(generics.RetrieveAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def post(self, request):
        use_defaults = False
        profile = None
        response_data = {}
        if request.user.is_anonymous:
            use_defaults = True
        else:
            response_data = {'username': request.user.username}
            profile = Profile.objects.get(user=request.user)
            if profile.last_module is None:
                use_defaults = True

        if use_defaults:
            # return the defaults
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
            # restore previous session
            # TODO: only allow path-friendly characters for everything
            project_name = profile.last_project.name
            project_source_path = os.path.join(
                settings.MEDIA_ROOT,
                settings.USER_MEDIA_DIR, 
                request.user.username,
                settings.PROJECT_DIR,
                project_name,
                settings.SOURCE_DIR,
            )
            project_file_path = os.path.join(
                project_source_path,
                os.path.basename(profile.last_module.source.name),
            )
            response_scene = profile.last_scene
        if not os.path.exists(project_file_path):
            project_file_path = os.path.join(
                project_source_path,
                settings.DEFAULT_PROJECT_FILENAME,
            )
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

class ProfileFromSession(views.APIView):
    serializer_class = SaveModuleSerializer
    queryset = Module.objects

    def post(self, request):
        session_match = re.match(
            'Session (\w+)',
            request.META['HTTP_AUTHORIZATION'],
        )
        if not session_match:
            return Response({})

        session_key = session_match.group(1)

        session = SessionStore(session_key=session_key)
        if 'user' not in session:
            # profile from session
            profile = Profile.objects.get(session_key=session_key)

            # module from profile
            last_module = profile.last_module

            # no user for anonymous sessions
            user = ''
        else:
            # user from session
            user = User.objects.get(pk=session['user'])
            # profile from user
            profile = Profile.objects.get(user=user.pk)
            # module from profile
            last_module = profile.last_module
            # username from user
            user = user.username

        return Response({
            'last_module': self.serializer_class(last_module).data,
            'last_scene': profile.last_scene,
            'user': user,
        })

class NewSave(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        if ("name" not in request.data):
            return Response(
                {'error': 'request is missing filename'},
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


        if request.data['directory']:
            os.mkdir(os.path.join(settings.MEDIA_ROOT, media_path))
            return Response(request.data)
        else:
            defaults = {
                'time': timezone.now(),
                'source': ContentFile(
                    request.data.get('code', ""),
                    name=request.data['name'],
                ),
            }
            try:
                module, created = Module.objects.update_or_create(
                    owner=request.user,
                    project=project,
                    source__endswith=os.sep + request.data['name'],
                    defaults=defaults,
                )
            except Exception:
                return Response(
                    {'error': 'invalid filename'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            profile = Profile.objects.get(user=request.user)
            profile.last_module = module
            if 'scene' in request.data:
                profile.last_scene = request.data['scene']
            profile.last_project = project
            profile.save()

            module_serializer = SaveModuleSerializer(module)
            return Response(module_serializer.data)

    ## def post(self, request):
    ##     name = request.data['name']
    ##     defaults = {
    ##         'time': timezone.now(),
    ##         'source': ContentFile(request.data['code'], name=name),
    ##     }
    ##     try:
    ##         project = Project.objects.get(
    ##             owner=request.user,
    ##             name=request.data['project']
    ##         )
    ##         module, created = Module.objects.update_or_create(
    ##             owner=request.user,
    ##             project=project,
    ##             source__endswith=os.sep + name,
    ##             defaults=defaults,
    ##         )
    ##     except Exception:
    ##         return Response(
    ##             {'error': 'invalid filename'},
    ##             status=status.HTTP_400_BAD_REQUEST,
    ##         )

    ##     profile = Profile.objects.get(user=request.user)
    ##     profile.last_module = module
    ##     profile.last_scene = request.data['scene']
    ##     profile.last_project = project
    ##     profile.save()

    ##     module_serializer = SaveModuleSerializer(module)
    ##     return Response(module_serializer.data)

class Files(generics.GenericAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = ()

    def post(self, request):
        # TODO: secure this (factor from models.Module)
        # TODO: check for user file, then shared file
        # TODO: check if the project is shared
        project = request.data['project']
        if project == "manim":
            media_dir = settings.LIBRARY_DIR
        elif request.user.is_anonymous:
            # read from shared
            media_dir = os.path.join(
                settings.SHARED_MEDIA_DIR,
                settings.PROJECT_DIR,
                project,
                settings.SOURCE_DIR,
            )
        else:
            # read from user files
            media_dir = os.path.join(
                settings.USER_MEDIA_DIR,
                request.user.username,
                settings.PROJECT_DIR,
                project,
                settings.SOURCE_DIR,
            )
        path = os.path.join(*request.data['pathList'])
        path = os.path.join(
            settings.MEDIA_ROOT,
            media_dir,
            path,
        )
        if os.path.isdir(path):
            return Response(list_directory_contents(path, project))
        else:
            return Response(get_file_contents(path))

class Render(NewSave):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        input_filename = settings.DEFAULT_PROJECT_FILENAME
        input_scene = request.data["scene"]
        if input_scene is None:
            return response

        # enqueue the job
        manim_path = os.path.join(
            os.getcwd(),
            settings.MEDIA_ROOT,
            settings.LIBRARY_DIR,
        )
        project_path = os.path.join(
            os.getcwd(),
            settings.MEDIA_ROOT,
            settings.USER_MEDIA_DIR,
            request.user.username,
            settings.PROJECT_DIR,
            request.data['project'],
        )
        q = Queue(connection=Redis())
        result = q.enqueue(
            manimjob.render_scene,
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

    def get(self, request):
        job_id = request.query_params.get('job_id', None)
        if not job_id:
            # TODO: use http bad request
            return Response({'error': 'no job id'})
        q = Queue(connection=Redis())
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
            return Response({'error': 'no job'})

# TODO: use a RUD view for this
class ModuleViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    permission_classes = ()
    serializer_class = SaveModuleSerializer

    def get_queryset(self):
        user = self.request.user
        return Module.objects.all()

    def get_permissions(self):
        # TODO: disable update, as it is handled by create
        return []
        # permission_classes = [
        #     permissions.IsAuthenticated,
        #     IsOwner,
        # ] 
        # return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # TODO: this should be an entirely different view
    def create(self, request, *args, **kwargs):
        # save the request to the database
        response = super().create(request) # overridden with update_or_create()
        return response

class ModuleDetail(generics.DestroyAPIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsOwner)
    serializer_class = SaveModuleSerializer

    def get_queryset(self):
        return Module.objects.filter(soure=self.request.user)

    def get_object(self):
        project_name = self.request.query_params['project']
        user = self.request.user
        source_path = self.request.query_params['name']
        return Module.objects.get(
            owner=user,
            project=Project.objects.get(
                owner=user,
                name=project_name
            ),
            source=get_valid_media_path(
                project_name,
                user.username,
                source_path,
            ),
        )
    
    def delete(self, request, *args, **kwargs):
        # breakpoint(context=9)
        return super(ModuleDetail, self).delete(request, *args, **kwargs)


class ProjectList(generics.ListAPIView):
    authentication_classes = ()
    permission_classes = ()
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

