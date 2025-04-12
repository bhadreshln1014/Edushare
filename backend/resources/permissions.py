from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        return obj.user == request.user


class IsOwnerOrFriendIfPrivate(permissions.BasePermission):
    """
    Permission to only allow viewing of private profiles if the requester
    is the owner or a friend of the profile owner.
    """
    def has_object_permission(self, request, view, obj):
        # Allow if the profile is not private
        if not obj.is_private:
            return True
            
        # Allow if the requester is the owner
        if request.user == obj:
            return True
            
        # Allow if the requester is a friend of the owner
        return request.user.is_friend_with(obj)