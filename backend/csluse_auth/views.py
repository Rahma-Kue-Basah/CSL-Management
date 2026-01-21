from django.core.exceptions import PermissionDenied
from requests import RequestException

from allauth.socialaccount.helpers import (
    complete_social_login,
    render_authentication_error,
)
from allauth.socialaccount.providers.base import ProviderException
from allauth.socialaccount.providers.base.constants import AuthError
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView
from dj_rest_auth.jwt_auth import set_jwt_cookies
from dj_rest_auth.utils import jwt_encode
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView

from .models import Profile
from .serializers import ProfileSerializer


class GoogleOAuth2CallbackView(OAuth2CallbackView):
    def dispatch(self, request, *args, **kwargs):
        provider = self.adapter.get_provider()
        state, resp = self._get_state(request, provider)
        if resp:
            return resp
        if "error" in request.GET or "code" not in request.GET:
            auth_error = request.GET.get("error", None)
            if auth_error == self.adapter.login_cancelled_error:
                error = AuthError.CANCELLED
            else:
                error = AuthError.UNKNOWN
            return render_authentication_error(
                request,
                provider,
                error=error,
                extra_context={
                    "state": state,
                    "callback_view": self,
                },
            )
        app = provider.app
        client = self.adapter.get_client(self.request, app)

        try:
            access_token = self.adapter.get_access_token_data(
                request, app, client, pkce_code_verifier=state.get("pkce_code_verifier")
            )
            token = self.adapter.parse_token(access_token)
            if app.pk:
                token.app = app
            login = self.adapter.complete_login(
                request, app, token, response=access_token
            )
            login.token = token
            login.state = state
            response = complete_social_login(request, login)
        except (
            PermissionDenied,
            OAuth2Error,
            RequestException,
            ProviderException,
        ) as exc:
            return render_authentication_error(
                request, provider, exception=exc, extra_context={"state": state}
            )

        if getattr(login, "user", None):
            access_token, refresh_token = jwt_encode(login.user)
            set_jwt_cookies(response, access_token, refresh_token)

        return response


google_oauth2_callback = GoogleOAuth2CallbackView.adapter_view(GoogleOAuth2Adapter)


class ProfileView(GenericAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
