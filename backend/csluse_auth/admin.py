from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "full_name",
        "role",
        "user_groups",
        "user_type",
        "department",
        "batch",
    )
    search_fields = ("user__email", "full_name", "id_number")
    list_filter = ("role", "user_type", "department", "batch")
    readonly_fields = ("user_groups",)

    def user_groups(self, obj):
        """Show Django auth groups attached to the user."""
        return ", ".join(obj.user.groups.values_list("name", flat=True))

    user_groups.short_description = "Groups"
