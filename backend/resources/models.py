from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg

class User(AbstractUser):
    """Extended user model for the platform"""
    institution = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.username
    
    def get_total_uploads(self):
        return self.resources.count()
    
    def get_average_rating(self):
        return self.resources.aggregate(Avg('ratings__rating'))['ratings__rating__avg'] or 0
    
    def is_friend_with(self, user):
        return Friendship.objects.filter(
            (models.Q(requester=self) & models.Q(addressee=user)) | 
            (models.Q(requester=user) & models.Q(addressee=self)),
            status='accepted'
        ).exists()

class Resource(models.Model):
    """Educational resources uploaded by users"""
    RESOURCE_TYPES = [
        ('lesson_plan', 'Lesson Plan'),
        ('worksheet', 'Worksheet'),
        ('video', 'Video'),
        ('presentation', 'Presentation'),
        ('assessment', 'Assessment'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    description = models.TextField()
    file = models.FileField(upload_to='resources/')
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    subject = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=50)
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def get_average_rating(self):
        ratings = self.ratings.all()
        if not ratings:
            return 0
        return sum(r.rating for r in ratings) / ratings.count()

class Rating(models.Model):
    """Ratings and reviews for resources"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='ratings')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Ensure a user can rate a resource only once
        unique_together = ('user', 'resource')
    
    def __str__(self):
        return f"{self.user.username}'s {self.rating}-star rating for {self.resource.title}"

class Download(models.Model):
    """Tracking resource downloads by users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='downloads')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='downloads')
    downloaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'resource', 'downloaded_at')
    
    def __str__(self):
        return f"{self.user.username} downloaded {self.resource.title}"

class Friendship(models.Model):
    """User friendships for privacy controls"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_requests_sent')
    addressee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_requests_received')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('requester', 'addressee')
    
    def __str__(self):
        return f"{self.requester.username} → {self.addressee.username}: {self.status}"
    
class SavedResource(models.Model):
    """Track resources saved/bookmarked by users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_resources')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'resource')  # Prevent duplicate saves
    
    def __str__(self):
        return f"{self.user.username} saved {self.resource.title}"