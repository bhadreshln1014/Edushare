# resources/auth.py
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework import status

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # Print the incoming data
        print("Login attempt with:", request.data)
        
        # Try manual authentication first to debug
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Directly use Django's authenticate function
        user = authenticate(username=username, password=password)
        
        if user:
            print(f"User {username} authenticated successfully")
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_private': getattr(user, 'is_private', False)
                }
            })
        else:
            print(f"Authentication failed for {username}")
            # Try to get the user to check if they exist
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user_obj = User.objects.get(username=username)
                print(f"User exists but password is incorrect for {username}")
            except User.DoesNotExist:
                print(f"User {username} does not exist")
            
            return Response(
                {"error": "Invalid credentials"}, 
                status=status.HTTP_400_BAD_REQUEST
            )