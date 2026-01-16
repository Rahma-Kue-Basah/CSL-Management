from django.urls import path, include



urlpatterns = [
    path('', include('dj_rest_auth.urls')),
    path('oauth/', include('allauth.urls')),
    path('registration/', include('dj_rest_auth.registration.urls')),
]