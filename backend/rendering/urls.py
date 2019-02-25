from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt import views as jwt_views

from . import views

urlpatterns = [
    path('render/', views.Render.as_view()),
    path('checkrender/', views.CheckRenderJob.as_view()),
    path('save/', views.NewSave.as_view()),
    path('signup/', views.SignUp.as_view()),
    path('login/', views.LogIn.as_view()),

    path('token/', jwt_views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
    path('session/', views.Session.as_view()),

    path('module/', views.ModuleDelete.as_view()),
    path('tree/', views.DirectoryTree.as_view()),

    path('profilefromsession/', views.ProfileFromSession.as_view()),
    path('users/', views.UserList.as_view()),
    path('users/<int:pk>/', views.UserDetail.as_view()),
    path('users/delete/<int:pk>/', views.UserDelete.as_view()),
    path('profiles/', views.ProfileList.as_view()),
    path('files/', views.Files.as_view()),
    path('projects/', views.ProjectList.as_view()),
    path('hello/', views.HelloView.as_view(), name='hello'),
]

router = DefaultRouter()
router.register(r'modules', views.ModuleViewSet, basename='modules')
urlpatterns += router.urls
