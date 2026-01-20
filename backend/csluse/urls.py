from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'images', views.ImageViewSet, basename='images')

urlpatterns = [
    path('', include(router.urls)),

    path('api-auth/', include('rest_framework.urls')),
]
