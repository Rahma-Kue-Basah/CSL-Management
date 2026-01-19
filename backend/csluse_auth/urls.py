from django.conf import settings
from django.http import HttpResponseRedirect
from django.urls import include, path


def password_reset_confirm_redirect(request, uidb64, token):
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    return HttpResponseRedirect(
        f"{frontend_url}/reset-password/{uidb64}/{token}/"
    )


urlpatterns = [
    path(
        'password/reset/confirm/<uidb64>/<token>/',
        password_reset_confirm_redirect,
        name='password_reset_confirm',
    ),
    path('', include('dj_rest_auth.urls')),
    path('oauth/', include('allauth.urls')),
    path('registration/', include('dj_rest_auth.registration.urls')),
]
