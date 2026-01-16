from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'upload-test', views.S3UploadViewSet, basename='upload-test')

urlpatterns = [
    path('', include(router.urls)),

    path('api-auth/', include('rest_framework.urls')),
]
