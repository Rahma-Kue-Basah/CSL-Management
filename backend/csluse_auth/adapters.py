"""
Custom adapters for django-allauth to handle email confirmation for API
"""
from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from urllib.parse import quote


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter to redirect email confirmation to frontend
    """
    
    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Override to return frontend URL instead of backend URL
        """
        # Frontend URL with the confirmation key
        frontend_url = settings.FRONTEND_URL
        key = emailconfirmation.key
        email = emailconfirmation.email_address.email
        encoded_email = quote(email)
        return f"{frontend_url}/signup-guest/verify/{key}/?email={encoded_email}"
    
    def send_confirmation_mail(self, request, emailconfirmation, signup):
        """
        Override to use frontend URL in confirmation email
        """
        activate_url = self.get_email_confirmation_url(request, emailconfirmation)
        ctx = {
            "user": emailconfirmation.email_address.user,
            "activate_url": activate_url,
            "current_site": request.get_host(),
            "key": emailconfirmation.key,
        }
        
        if signup:
            email_template = 'account/email/email_confirmation_signup'
        else:
            email_template = 'account/email/email_confirmation'
            
        self.send_mail(email_template, emailconfirmation.email_address.email, ctx)
