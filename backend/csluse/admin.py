from django.contrib import admin

from .models import *

admin.site.register(Image)
admin.site.register(Room)
admin.site.register(Equipment)
admin.site.register(Booking)
admin.site.register(Borrow)
admin.site.register(Notification)