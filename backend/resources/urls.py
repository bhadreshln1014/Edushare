# resources/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ResourceViewSet, FriendshipViewSet, DownloadViewSet
from .auth import CustomAuthToken

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'resources', ResourceViewSet)
router.register(r'friendships', FriendshipViewSet)
router.register(r'downloads', DownloadViewSet, basename="downloads")

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomAuthToken.as_view(), name='auth-login'),
]

urlpatterns.append(path('downloads/clear/', DownloadViewSet.as_view({'delete': 'clear'}), name='downloads-clear'))