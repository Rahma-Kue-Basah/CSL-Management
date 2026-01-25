from django.conf import settings
from django.http import HttpResponseRedirect
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import google_oauth2_callback, EmailVerificationStatusView
from .viewsets import ProfileViewSet, UserWithProfileViewSet

def password_reset_confirm_redirect(request, uidb64, token):
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    return HttpResponseRedirect(
        f"{frontend_url}/reset-password/{uidb64}/{token}/"
    )

router = DefaultRouter()
router.register(r'user/profile', ProfileViewSet, basename='profile')
router.register(r'users', UserWithProfileViewSet, basename='users')

urlpatterns = [
    path(
        'password/reset/confirm/<uidb64>/<token>/',
        password_reset_confirm_redirect,
        name='password_reset_confirm',
    ),
    path(
        'oauth/google/login/callback/',
        google_oauth2_callback,
        name='google_callback',
    ),
    path(
        'registration/check-email/',
        EmailVerificationStatusView.as_view(),
        name='email_verification_status',
    ),
    path('', include(router.urls)),
    path('', include('dj_rest_auth.urls')),
    path('oauth/', include('allauth.urls')),
    path('registration/', include('dj_rest_auth.registration.urls')),
]
