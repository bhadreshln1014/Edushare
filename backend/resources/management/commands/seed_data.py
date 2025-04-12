# resources/management/commands/seed_data.py
import os
import random
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from resources import models
from resources.models import User, Resource, Rating, Download, Friendship
import datetime
from django.db.models import Q

class Command(BaseCommand):
    help = 'Seed database with sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')
        
        # Create a media folder if it doesn't exist
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'resources'), exist_ok=True)
        
        # Create sample users
        self.create_users()
        
        # Create sample resources
        self.create_resources()
        
        # Create sample ratings
        self.create_ratings()
        
        # Create sample downloads
        self.create_downloads()
        
        # Create sample friendships
        self.create_friendships()
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
    
    def create_users(self):
        self.stdout.write('Creating users...')
        
        # Create 15 sample users with different profiles
        users_data = [
            # Teachers
            {'username': 'ms_smith', 'email': 'smith@example.com', 'password': 'password123', 
             'institution': 'Lincoln High School', 'bio': 'Math teacher with 10 years of experience', 'is_private': False},
            {'username': 'mr_johnson', 'email': 'johnson@example.com', 'password': 'password123', 
             'institution': 'Washington Elementary', 'bio': 'Science enthusiast and elementary educator', 'is_private': True},
            {'username': 'prof_williams', 'email': 'williams@example.com', 'password': 'password123', 
             'institution': 'State University', 'bio': 'Professor of History, focused on interactive learning', 'is_private': False},
            {'username': 'dr_garcia', 'email': 'garcia@example.com', 'password': 'password123', 
             'institution': 'Medical School', 'bio': 'Teaching anatomy and physiology through visual aids', 'is_private': False},
            {'username': 'coach_miller', 'email': 'miller@example.com', 'password': 'password123', 
             'institution': 'Sports Academy', 'bio': 'Physical education instructor, focus on teamwork', 'is_private': True},
            
            # Students
            {'username': 'student_alex', 'email': 'alex@example.com', 'password': 'password123', 
             'institution': 'Lincoln High School', 'bio': 'Student interested in math and science', 'is_private': False},
            {'username': 'student_jordan', 'email': 'jordan@example.com', 'password': 'password123', 
             'institution': 'State University', 'bio': 'History major looking for study resources', 'is_private': True},
            {'username': 'student_casey', 'email': 'casey@example.com', 'password': 'password123', 
             'institution': 'Washington Elementary', 'bio': 'Elementary student who loves science', 'is_private': False},
            
            # Education Professionals
            {'username': 'principal_davis', 'email': 'davis@example.com', 'password': 'password123', 
             'institution': 'Jefferson Middle School', 'bio': 'School principal focused on curriculum development', 'is_private': False},
            {'username': 'counselor_taylor', 'email': 'taylor@example.com', 'password': 'password123', 
             'institution': 'Student Services', 'bio': 'Guidance counselor with resources for college prep', 'is_private': True},
            
            # Educational Content Creators
            {'username': 'creator_pat', 'email': 'pat@example.com', 'password': 'password123', 
             'institution': 'Educational Publishing', 'bio': 'Creating engaging worksheets and activities', 'is_private': False},
            {'username': 'blogger_sam', 'email': 'sam@example.com', 'password': 'password123', 
             'institution': 'Education Blog', 'bio': 'Sharing teaching tips and classroom ideas', 'is_private': False},
            
            # Parents
            {'username': 'parent_jamie', 'email': 'jamie@example.com', 'password': 'password123', 
             'institution': 'Homeschool Network', 'bio': 'Homeschooling parent looking for curriculum resources', 'is_private': True},
            {'username': 'parent_morgan', 'email': 'morgan@example.com', 'password': 'password123', 
             'institution': 'PTA Member', 'bio': 'Parent volunteer creating after-school activities', 'is_private': False},
            
            # Test user with your credentials
            {'username': 'testuser', 'email': 'test@example.com', 'password': 'password123', 
             'institution': 'Test School', 'bio': 'Test account for demonstration', 'is_private': False},
        ]
        
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'institution': user_data['institution'],
                    'bio': user_data['bio'],
                    'is_private': user_data['is_private']
                }
            )
            
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'  Created user: {user.username}')
            else:
                self.stdout.write(f'  User already exists: {user.username}')
    
    def create_resources(self):
        self.stdout.write('Creating resources...')
        
        # Define sample resource data
        resource_types = ['lesson_plan', 'worksheet', 'video', 'presentation', 'assessment']
        subjects = ['Math', 'Science', 'Language Arts', 'Social Studies', 'Art', 'Music', 'Physical Education']
        grade_levels = ['K-2', '3-5', '6-8', '9-12', 'Higher Education']
        
        # Create sample resources for some users
        users = User.objects.all()
        
        resource_data = [
            # Math resources
            {'title': 'Algebra Fundamentals', 'description': 'Basic algebraic concepts explained with examples', 
             'resource_type': 'lesson_plan', 'subject': 'Math', 'grade_level': '6-8'},
            {'title': 'Geometry Worksheet', 'description': 'Practice problems for angles, shapes, and theorems', 
             'resource_type': 'worksheet', 'subject': 'Math', 'grade_level': '9-12'},
            {'title': 'Fractions for Beginners', 'description': 'Introduction to fractions with visual aids', 
             'resource_type': 'presentation', 'subject': 'Math', 'grade_level': '3-5'},
            {'title': 'Calculus Review', 'description': 'Comprehensive review of calculus concepts and formulas', 
             'resource_type': 'assessment', 'subject': 'Math', 'grade_level': 'Higher Education'},
            
            # Science resources
            {'title': 'Photosynthesis Explained', 'description': 'Detailed explanation of the photosynthesis process', 
             'resource_type': 'lesson_plan', 'subject': 'Science', 'grade_level': '6-8'},
            {'title': 'Chemistry Lab Safety', 'description': 'Guidelines and rules for safe lab practices', 
             'resource_type': 'presentation', 'subject': 'Science', 'grade_level': '9-12'},
            {'title': 'Animal Classification', 'description': 'Activities to teach animal classification to young students', 
             'resource_type': 'worksheet', 'subject': 'Science', 'grade_level': 'K-2'},
            
            # Language Arts resources
            {'title': 'Creative Writing Prompts', 'description': 'A collection of writing prompts to inspire creativity', 
             'resource_type': 'worksheet', 'subject': 'Language Arts', 'grade_level': '3-5'},
            {'title': 'Grammar Essentials', 'description': 'Comprehensive guide to English grammar rules', 
             'resource_type': 'lesson_plan', 'subject': 'Language Arts', 'grade_level': '6-8'},
            {'title': 'Shakespeare Study Guide', 'description': 'Analysis and activities for Shakespeare\'s major works', 
             'resource_type': 'assessment', 'subject': 'Language Arts', 'grade_level': '9-12'},
            
            # Social Studies resources
            {'title': 'Ancient Civilizations Unit', 'description': 'Complete unit on ancient Egypt, Greece, and Rome', 
             'resource_type': 'lesson_plan', 'subject': 'Social Studies', 'grade_level': '6-8'},
            {'title': 'U.S. Constitution Overview', 'description': 'Breakdown of the Constitution and its amendments', 
             'resource_type': 'presentation', 'subject': 'Social Studies', 'grade_level': '9-12'},
            {'title': 'Community Helpers', 'description': 'Introduction to different roles in the community', 
             'resource_type': 'worksheet', 'subject': 'Social Studies', 'grade_level': 'K-2'},
            
            # Art resources
            {'title': 'Color Theory Basics', 'description': 'Introduction to color wheels and color relationships', 
             'resource_type': 'lesson_plan', 'subject': 'Art', 'grade_level': '3-5'},
            {'title': 'Drawing Techniques', 'description': 'Various techniques for pencil, charcoal, and ink', 
             'resource_type': 'presentation', 'subject': 'Art', 'grade_level': '6-8'},
            
            # Music resources
            {'title': 'Music Notation Guide', 'description': 'Comprehensive guide to reading music notation', 
             'resource_type': 'lesson_plan', 'subject': 'Music', 'grade_level': '6-8'},
            {'title': 'Rhythm Exercises', 'description': 'Practice sheets for understanding rhythm and beats', 
             'resource_type': 'worksheet', 'subject': 'Music', 'grade_level': '3-5'},
            
            # Physical Education resources
            {'title': 'Team Building Activities', 'description': 'Activities to promote teamwork and cooperation', 
             'resource_type': 'lesson_plan', 'subject': 'Physical Education', 'grade_level': '3-5'},
            {'title': 'Fitness Assessment Guide', 'description': 'Methods for assessing student fitness levels', 
             'resource_type': 'assessment', 'subject': 'Physical Education', 'grade_level': '9-12'},
            
            # Additional resources for variety
            {'title': 'Project-Based Learning Ideas', 'description': 'Collection of cross-curricular project ideas', 
             'resource_type': 'lesson_plan', 'subject': 'Language Arts', 'grade_level': '3-5'},
            {'title': 'Digital Citizenship', 'description': 'Teaching responsible technology use', 
             'resource_type': 'presentation', 'subject': 'Social Studies', 'grade_level': '6-8'}
        ]
        
        for data in resource_data:
            # Assign to a random user
            user = random.choice(users)
            
            # Create a dummy file content
            file_content = f"This is a sample {data['resource_type']} about {data['title']}\n\n"
            file_content += f"Subject: {data['subject']}\n"
            file_content += f"Grade Level: {data['grade_level']}\n\n"
            file_content += f"Description: {data['description']}\n\n"
            file_content += f"Created by: {user.username}\n"
            
            # Generate a file name
            file_name = f"{data['title'].lower().replace(' ', '_')}.txt"
            
            # Create the resource
            resource, created = Resource.objects.get_or_create(
                title=data['title'],
                user=user,
                defaults={
                    'description': data['description'],
                    'resource_type': data['resource_type'],
                    'subject': data['subject'],
                    'grade_level': data['grade_level'],
                    'download_count': random.randint(5, 100)
                }
            )
            
            if created:
                # Add the file
                resource.file.save(file_name, ContentFile(file_content.encode('utf-8')))
                self.stdout.write(f"  Created resource: {resource.title}")
            else:
                self.stdout.write(f"  Resource already exists: {resource.title}")
    
    def create_ratings(self):
        self.stdout.write('Creating ratings...')
        
        users = list(User.objects.all())
        resources = list(Resource.objects.all())
        
        # Create about 50 ratings
        for _ in range(50):
            user = random.choice(users)
            resource = random.choice(resources)
            
            # Skip if user is rating their own resource
            if resource.user == user:
                continue
            
            rating_value = random.randint(1, 5)
            comments = [
                "Very helpful resource, thanks for sharing!",
                "This was exactly what I needed for my class.",
                "Great content, but could use more examples.",
                "My students really enjoyed this activity.",
                "Well organized and easy to follow.",
                "Could be more detailed, but still useful.",
                "Perfect for my grade level!",
                "I'll definitely use this again next semester.",
                "Saved me a lot of preparation time.",
                "Engaging material that kept students interested.",
                "",  # Empty comment
            ]
            
            rating, created = Rating.objects.get_or_create(
                user=user,
                resource=resource,
                defaults={
                    'rating': rating_value,
                    'comment': random.choice(comments),
                    'created_at': timezone.now() - datetime.timedelta(days=random.randint(1, 90))
                }
            )
            
            if created:
                self.stdout.write(f"  Created rating: {user.username} rated {resource.title} ({rating.rating} stars)")
            else:
                self.stdout.write(f"  Rating already exists: {user.username} → {resource.title}")
    
    def create_downloads(self):
        self.stdout.write('Creating downloads...')
        
        users = list(User.objects.all())
        resources = list(Resource.objects.all())
        
        # Create about 100 downloads
        for _ in range(100):
            user = random.choice(users)
            resource = random.choice(resources)
            
            # Create a download record with random date
            download_date = timezone.now() - datetime.timedelta(days=random.randint(1, 180))
            
            download, created = Download.objects.get_or_create(
                user=user,
                resource=resource,
                downloaded_at=download_date
            )
            
            if created:
                self.stdout.write(f"  Created download: {user.username} downloaded {resource.title}")
            else:
                self.stdout.write(f"  Download already exists: {user.username} → {resource.title}")
    
    def create_friendships(self):
        self.stdout.write('Creating friendships...')
        
        users = list(User.objects.all())
        
        # Create about 30 friendships
        for _ in range(30):
            # Select two random users
            user1 = random.choice(users)
            user2 = random.choice(users)
            
            # Skip if same user
            if user1 == user2:
                continue
            
            # Check if friendship already exists
            existing = Friendship.objects.filter(
                (Q(requester=user1) & Q(addressee=user2)) | 
                (Q(requester=user2) & Q(addressee=user1))
            ).exists()
            
            if existing:
                continue
            
            # Determine status
            status_choices = ['pending', 'accepted', 'rejected']
            status_weights = [0.2, 0.7, 0.1]  # 20% pending, 70% accepted, 10% rejected
            status = random.choices(status_choices, weights=status_weights, k=1)[0]
            
            # Create the friendship
            friendship = Friendship.objects.create(
                requester=user1,
                addressee=user2,
                status=status,
                created_at=timezone.now() - datetime.timedelta(days=random.randint(1, 90))
            )
            
            self.stdout.write(f"  Created friendship: {user1.username} → {user2.username} ({status})")