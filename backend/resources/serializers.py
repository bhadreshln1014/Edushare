from rest_framework import serializers
from .models import SavedResource, User, Resource, Rating, Download, Friendship
from django.db.models import Q

class UserSerializer(serializers.ModelSerializer):
    total_uploads = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    friend_count = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'institution', 'bio', 
                  'is_private', 'total_uploads', 'average_rating',
                  'date_joined', 'password', 'friend_count']
        extra_kwargs = {
            'email': {'write_only': True},
            'password': {'write_only': True, 'required': True}
        }
    
    def get_friend_count(self, obj):
        return Friendship.objects.filter(
            (Q(requester=obj) | Q(addressee=obj)),
            status='accepted'
        ).count()
    
    def get_total_uploads(self, obj):
        return obj.get_total_uploads()
    
    def get_average_rating(self, obj):
        return obj.get_average_rating()
    
    # In your serializers.py
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']  # This should handle hashing properly
        )
        
        # Add other fields if needed
        if 'institution' in validated_data:
            user.institution = validated_data['institution']
        if 'bio' in validated_data:
            user.bio = validated_data['bio']
        if 'is_private' in validated_data:
            user.is_private = validated_data['is_private']
            
        user.save()
        return user

class ResourceSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = Resource
        fields = ['id', 'user', 'title', 'description', 'file', 
                  'resource_type', 'subject', 'grade_level', 
                  'download_count', 'average_rating', 'created_at', 'user_id']
        read_only_fields = ['download_count']
    
    def get_average_rating(self, obj):
        return obj.get_average_rating()


class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    resource_title = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'resource', 'resource_title', 
                  'rating', 'comment', 'created_at', 'user_id']
        read_only_fields = ['user']
    
    def get_resource_title(self, obj):
        return obj.resource.title


class DownloadSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    resource_title = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    grade_level = serializers.SerializerMethodField()
    resource_type = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    
    class Meta:
        model = Download
        fields = ['id', 'user', 'resource', 'resource_title', 'subject', 
                'grade_level', 'resource_type', 'author', 'downloaded_at']
        read_only_fields = ['user', 'resource', 'downloaded_at']
    
    def get_resource_title(self, obj):
        return obj.resource.title
        
    def get_subject(self, obj):
        return obj.resource.subject
        
    def get_grade_level(self, obj):
        return obj.resource.grade_level
        
    def get_resource_type(self, obj):
        return obj.resource.resource_type
        
    def get_author(self, obj):
        return obj.resource.user.username


class FriendshipSerializer(serializers.ModelSerializer):
    requester_username = serializers.SerializerMethodField()
    addressee_username = serializers.SerializerMethodField()
    
    class Meta:
        model = Friendship
        fields = ['id', 'requester', 'requester_username', 
                  'addressee', 'addressee_username', 
                  'status', 'created_at']
        read_only_fields = ['requester', 'status']
    
    def get_requester_username(self, obj):
        return obj.requester.username
    
    def get_addressee_username(self, obj):
        return obj.addressee.username

class SavedResourceSerializer(serializers.ModelSerializer):
    resource_title = serializers.SerializerMethodField()
    
    class Meta:
        model = SavedResource
        fields = ['id', 'user', 'resource', 'resource_title', 'saved_at']
        read_only_fields = ['user']
    
    def get_resource_title(self, obj):
        return obj.resource.title
    
