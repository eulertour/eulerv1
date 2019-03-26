from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt import views as jwt_views

from . import views

urlpatterns = [
    path('login/', views.LogIn.as_view()),
    path('signup/', views.SignUp.as_view()),
    path('session/', views.Session.as_view()),
    path('video/', views.VideoAuth.as_view()),

    path('render/', views.Render.as_view()),
    path('render/<job_id>', views.CheckRenderJob.as_view()),

    path('save/', views.Save.as_view()),
    path('files/', views.Files.as_view()),
    path('project/', views.ProjectDelete.as_view()),
    path('module/', views.ModuleDelete.as_view()),
]
