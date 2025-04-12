from django.contrib import admin
from .models import User, Resource, Rating, Download, Friendship

# Register your models
admin.site.register(User)
admin.site.register(Resource)
admin.site.register(Rating)
admin.site.register(Download)
admin.site.register(Friendship)