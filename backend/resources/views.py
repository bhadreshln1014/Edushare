from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import User, Resource, Rating, Download, Friendship
from .serializers import (
    UserSerializer, ResourceSerializer, RatingSerializer, 
    DownloadSerializer, FriendshipSerializer
)
from .permissions import IsOwnerOrFriendIfPrivate, IsOwnerOrReadOnly
from django.conf import settings  # To access settings.DEBUG and Cloudinary config
import cloudinary.utils
import os

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for users
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'institution']
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=True, methods=['get'])
    def resources(self, request, pk=None):
        """Get resources uploaded by a user"""
        user = self.get_object()
        
        # Check if user is private and not a friend
        if user.is_private and not request.user.is_friend_with(user) and request.user.id != user.id:
            return Response(
                {"detail": "This user's profile is private"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        resources = Resource.objects.filter(user=user)
        serializer = ResourceSerializer(resources, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def ratings(self, request, pk=None):
        """Get ratings given by a user"""
        user = self.get_object()
        
        # Check if user is private and not a friend
        if user.is_private and not request.user.is_friend_with(user) and request.user.id != user.id:
            return Response(
                {"detail": "This user's profile is private"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        ratings = Rating.objects.filter(user=user)
        serializer = RatingSerializer(ratings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def downloads(self, request, pk=None):
        """Get resources downloaded by a user"""
        user = self.get_object()
        
        # Only the user themself should see their downloads
        if request.user.id != user.id:
            return Response(
                {"detail": "You cannot view another user's downloads"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        downloads = Download.objects.filter(user=user)
        serializer = DownloadSerializer(downloads, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def friends(self, request, pk=None):
        """Get a user's friends"""
        user = self.get_object()
        
        # If viewing someone else's private profile
        if user.is_private and not request.user.is_friend_with(user) and request.user.id != user.id:
            return Response(
                {"detail": "This user's profile is private"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get all accepted friendships
        friendships = Friendship.objects.filter(
            (Q(requester=user) | Q(addressee=user)),
            status='accepted'
        )
        
        # Extract the friend user objects
        friends = []
        for friendship in friendships:
            if friendship.requester == user:
                friends.append(friendship.addressee)
            else:
                friends.append(friendship.requester)
                
        serializer = UserSerializer(friends, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def saved_resources(self, request, pk=None):
        """Get resources saved by a user"""
        user = self.get_object()
        
        # Only the user themself should see their saved resources
        if request.user.id != user.id:
            return Response(
                {"detail": "You cannot view another user's saved resources"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        saved_ids = SavedResource.objects.filter(user=user).values_list('resource_id', flat=True)
        resources = Resource.objects.filter(id__in=saved_ids)
        
        serializer = ResourceSerializer(resources, many=True)
        return Response(serializer.data)


from django_filters.rest_framework import DjangoFilterBackend
from .models import Resource, SavedResource
# Make sure to import DjangoFilterBackend and the new SavedResource model

class ResourceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for resources
    """
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title', 'description', 'subject', 'grade_level', 'resource_type']
    filterset_fields = ['subject', 'grade_level', 'resource_type']  # Add this line

    def get_queryset(self):
        """
        Filter resources to show:
        1. Resources from public users
        2. Resources from the current user
        3. Resources from the current user's friends
        """
        user = self.request.user
        
        # Get the user's friends (users with accepted friendship)
        friends = User.objects.filter(
            Q(friendship_requests_sent__addressee=user, friendship_requests_sent__status='accepted') |
            Q(friendship_requests_received__requester=user, friendship_requests_received__status='accepted')
        ).distinct()
        
        # Return filtered resources
        return Resource.objects.filter(
            Q(user__is_private=False) |  # Resources from public users
            Q(user=user) |              # User's own resources
            Q(user__in=friends)         # Resources from friends
        )
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def download(self, request, pk=None):
        """Download a resource and track it"""
        resource = self.get_object()
        
        # Record download
        Download.objects.create(user=request.user, resource=resource)
        resource.download_count += 1
        resource.save()
        
        # Get the original file URL
        original_url = resource.file.url
        print(f"Original URL: {original_url}")
        
        # Extract the relevant part of the URL
        # The SDK seems to be adding an extra period at the end
        if 'cloudinary' in original_url:
            if '/v1/' in original_url:
                parts = original_url.split('/v1/')
                base_url = parts[0]
                file_path = parts[1]
                
                # Create a direct raw URL without using the SDK
                download_url = f"{base_url}/raw/upload/{file_path}"
                print(f"Fixed URL: {download_url}")
                return Response({"download_url": download_url})
        
        # Fallback to the original URL
        return Response({"download_url": original_url})
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """Rate a resource"""
        resource = self.get_object()
        # Prevent users from rating their own resources
        if resource.user == request.user:
            return Response(
                {"detail": "You cannot rate your own resource"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate input
        rating_value = request.data.get('rating')
        if not rating_value:
            return Response(
                {"detail": "Rating value is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            rating_value = int(rating_value)
            if rating_value < 1 or rating_value > 5:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {"detail": "Rating must be an integer between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Create or update rating
        rating, created = Rating.objects.update_or_create(
            user=request.user,
            resource=resource,
            defaults={
                'rating': rating_value,
                'comment': request.data.get('comment', '')
            }
        )
        
        serializer = RatingSerializer(rating)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def ratings(self, request, pk=None):
        """Get ratings for a resource"""
        resource = self.get_object()
        ratings = Rating.objects.filter(resource=resource)
        serializer = RatingSerializer(ratings, many=True)
        return Response(serializer.data)
        
    # Add these new actions for saving/unsaving resources
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        """Save a resource for the current user"""
        resource = self.get_object()
        user = request.user
        
        # Check if already saved
        saved, created = SavedResource.objects.get_or_create(
            user=user,
            resource=resource
        )
        
        if not created:
            return Response(
                {"detail": "Resource already saved"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return Response({"detail": "Resource saved"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unsave(self, request, pk=None):
        """Remove a saved resource for the current user"""
        resource = self.get_object()
        user = request.user
        
        try:
            saved = SavedResource.objects.get(user=user, resource=resource)
            saved.delete()
            return Response({"detail": "Resource unsaved"})
        except SavedResource.DoesNotExist:
            return Response(
                {"detail": "Resource not saved"},
                status=status.HTTP_400_BAD_REQUEST
            )


class FriendshipViewSet(viewsets.ModelViewSet):
    """
    API endpoint for friendships
    """
    queryset = Friendship.objects.all()
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only show friendships relevant to the current user"""
        user = self.request.user
        return Friendship.objects.filter(Q(requester=user) | Q(addressee=user))
    
    def perform_create(self, serializer):
        """Create a new friendship request"""
        addressee_id = self.request.data.get('addressee')
        addressee = get_object_or_404(User, pk=addressee_id)
        
        # Check if a friendship already exists
        if Friendship.objects.filter(
            (Q(requester=self.request.user) & Q(addressee=addressee)) |
            (Q(requester=addressee) & Q(addressee=self.request.user))
        ).exists():
            return Response(
                {"detail": "A friendship request already exists between these users"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer.save(requester=self.request.user, status='pending')
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a friendship request"""
        friendship = self.get_object()
        
        # Only the addressee can accept
        if friendship.addressee != request.user:
            return Response(
                {"detail": "You cannot accept this friendship request"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Only pending requests can be accepted
        if friendship.status != 'pending':
            return Response(
                {"detail": f"This request is already {friendship.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        friendship.status = 'accepted'
        friendship.save()
        
        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a friendship request"""
        friendship = self.get_object()
        
        # Only the addressee can reject
        if friendship.addressee != request.user:
            return Response(
                {"detail": "You cannot reject this friendship request"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Only pending requests can be rejected
        if friendship.status != 'pending':
            return Response(
                {"detail": f"This request is already {friendship.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        friendship.status = 'rejected'
        friendship.save()
        
        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data)

class DownloadViewSet(viewsets.ModelViewSet):
    serializer_class = DownloadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Download.objects.filter(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only allow users to delete their own downloads
        if instance.user != request.user:
            return Response(
                {"detail": "You cannot delete another user's download record"},
                status=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Delete all download records for the current user"""
        Download.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)