from django.urls import path, include
from . import viewsets as views
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'images', views.ImageViewSet, basename='images')
router.register(r'rooms', views.RoomViewSet, basename='rooms')
router.register(r'equipments', views.EquipmentViewSet, basename='equipments')
router.register(r'bookings', views.BookingViewSet, basename='bookings')
router.register(r'borrows', views.BorrowViewSet, basename='borrows')

urlpatterns = [
    path('', include(router.urls)),

    path('api-auth/', include('rest_framework.urls')),
]
