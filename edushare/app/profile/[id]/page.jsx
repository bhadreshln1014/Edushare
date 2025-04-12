"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FileText, Star, Download, Calendar, User, Building, MessageSquare, UserPlus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useParams } from 'next/navigation';

function StarRating({ rating, size = "md" }) {
  const numericRating = parseFloat(rating) || 0;
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`${starSize} fill-amber-500 text-amber-500`} />
      ))}
      {hasHalfStar && (
        <div className={`relative ${starSize}`}>
          <Star className={`absolute ${starSize} text-amber-500`} />
          <Star className={`absolute ${starSize} fill-amber-500 text-amber-500`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={`${starSize} text-amber-500`} />
      ))}
    </div>
  );
}

function StatCard({ icon, title, value, color, isRating = false }) {
  return (
    <Card className={`${color} border-none`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isRating ? (
              <div className="mt-2">
                <StarRating rating={value} />
                <p className="text-sm text-muted-foreground mt-1">{value} out of 5</p>
              </div>
            ) : (
              <p className="text-3xl font-bold text-indigo-600">{value}</p>
            )}
          </div>
          <div className="rounded-full p-2 bg-white">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: user.username,
    institution: user.institution || '',
    bio: user.bio || '',
    is_private: user.is_private || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_private"
              checked={formData.is_private}
              onChange={handleChange}
              id="is_private"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_private" className="ml-2 block text-sm text-gray-700">
              Private Profile
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  
  const params = useParams();
  const searchParams = useSearchParams();
  const userIdFromUrl = params?.id;
  
  const [user, setUser] = useState(null);
  const [uploadedResources, setUploadedResources] = useState([]);
  const [ratingsGiven, setRatingsGiven] = useState([]);
  const [downloadedResources, setDownloadedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [friendshipId, setFriendshipId] = useState(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequester, setIsRequester] = useState(false);
  useEffect(() => {
    const fetchUserData = async () => {
      const userString = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userString || !token) {
        setError("User or token not found");
        setLoading(false);
        return;
      }

      const currentUser = JSON.parse(userString);
      setCurrentUserId(currentUser.id);
      
      const profileUserId = userIdFromUrl || currentUser.id;
      const viewingOwnProfile = profileUserId == currentUser.id;
      setIsCurrentUser(viewingOwnProfile);

      const headers = { Authorization: `Token ${token}` };

      try {
        const userRes = await fetch(`http://localhost:8000/api/users/${profileUserId}/`, { headers });
        
        if (!userRes.ok) {
          throw new Error(`Failed to fetch user: ${userRes.status}`);
        }
        
        const userData = await userRes.json();
        setUser(userData);
        
        const resourcesRes = await fetch(`http://localhost:8000/api/users/${profileUserId}/resources/`, { headers });
        if (resourcesRes.ok) {
          const resourcesData = await resourcesRes.json();
          setUploadedResources(resourcesData);
        }
        
        const ratingsRes = await fetch(`http://localhost:8000/api/users/${profileUserId}/ratings/`, { headers });
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setRatingsGiven(ratingsData);
        }
        
        if (viewingOwnProfile) {
          try {
            const downloadsRes = await fetch(`http://localhost:8000/api/users/${profileUserId}/downloads/`, { headers });
            if (downloadsRes.ok) {
              const downloadsData = await downloadsRes.json();
              setDownloadedResources(downloadsData);
            }
          } catch (downloadErr) {
            console.error("Error fetching downloads:", downloadErr);
          }
        }

        if (!viewingOwnProfile) {
          const friendshipsRes = await fetch(`http://localhost:8000/api/friendships/`, { headers });
          
          if (friendshipsRes.ok) {
            const friendshipsData = await friendshipsRes.json();
            
            const friendship = friendshipsData.find(
              f => (f.requester === parseInt(profileUserId) && f.addressee === currentUser.id) || 
                  (f.addressee === parseInt(profileUserId) && f.requester === currentUser.id)
            );
            
            if (friendship) {
              setFriendshipStatus(friendship.status);
              setFriendshipId(friendship.id);
              // Determine if the current user is the requester or addressee
              setIsRequester(friendship.requester === currentUser.id);
              setIsFriend(friendship.status === 'accepted');
            }
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to load user profile: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userIdFromUrl]);

  const sendFriendRequest = async () => {
    if (!user) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/friendships/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addressee: user.id })
      });
      
      if (!response.ok) {
        throw new Error("Failed to send friend request");
      }
      
      setFriendshipStatus('pending');
      alert("Friend request sent!");
    } catch (err) {
      console.error("Error sending friend request:", err);
      alert("Failed to send friend request");
    }
  };

  const acceptFriendRequest = async () => {
    if (!friendshipId) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${friendshipId}/accept/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }
      
      setFriendshipStatus('accepted');
      setIsFriend(true);
      alert("Friend request accepted!");
    } catch (err) {
      console.error("Error accepting friend request:", err);
      alert("Failed to accept friend request");
    }
  };

  const handleSaveProfile = async (formData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`http://localhost:8000/api/users/${currentUserId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    const updatedUser = await response.json();
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const formattedJoinDate = new Date(user.date_joined).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="relative mb-8">
        <div className="w-full h-60 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-md overflow-hidden">
          <div className="w-full h-full bg-indigo-100" />
        </div>

        <div className="absolute bottom-0 transform translate-y-1/2 left-8">
          <div className="w-48 h-48 rounded-md overflow-hidden border-4 border-white bg-white shadow-lg">
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <User className="h-20 w-20 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4">
          {!user.is_private ? (
            <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              Public Profile
            </div>
          ) : (
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Private Profile
            </div>
          )}
        </div>
      </div>

      <div className="ml-0 md:ml-60 mb-8">
        <h1 className="text-3xl font-bold">{user.username}</h1>
        <div className="flex items-center mt-2">
          <div className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm">
            {user.total_uploads} Resources
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Building className="h-5 w-5 text-indigo-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">Institution</h3>
                    <p className="text-muted-foreground">{user.institution || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-indigo-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">Member Since</h3>
                    <p className="text-muted-foreground">{formattedJoinDate}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="h-5 w-5 text-indigo-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium">Bio</h3>
                    <p className="text-muted-foreground">{user.bio || 'No bio provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl font-semibold mb-4">Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4 mb-6">
            <StatCard
              icon={<FileText className="h-5 w-5 text-indigo-600" />}
              title="Resources Uploaded"
              value={user.total_uploads || 0}
              color="bg-indigo-50"
            />
            <StatCard
              icon={<Star className="h-5 w-5 text-amber-500" />}
              title="Average Rating"
              value={user.average_rating.toFixed(2) || 0}
              color="bg-amber-50"
              isRating={true}
            />
            <StatCard
              icon={<User className="h-5 w-5 text-blue-600" />}
              title="Friends"
              value={user.friend_count || 0}
              color="bg-blue-50"
            />
          </div>

          <div className="flex gap-4">
            {isCurrentUser ? (
              <>
                <Button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                    {!friendshipStatus && (
                  <Button
                    onClick={sendFriendRequest}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Friend Request
                  </Button>
                )}

                {friendshipStatus === 'pending' && isRequester && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Request Sent
                  </Button>
                )}

                {friendshipStatus === 'pending' && !isRequester && (
                  <Button
                    onClick={acceptFriendRequest}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Accept Friend Request
                  </Button>
                )}

                {friendshipStatus === 'accepted' && (
                  <Button
                    disabled
                    className="flex-1 bg-green-500 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Friends
                  </Button>
                )}

                <Button variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="uploaded">
            <TabsList className="mb-6">
              <TabsTrigger value="uploaded">Uploaded Resources</TabsTrigger>
              <TabsTrigger value="ratings">Ratings Given</TabsTrigger>
              {isCurrentUser && <TabsTrigger value="downloads">Downloaded Resources</TabsTrigger>}
            </TabsList>

            <TabsContent value="uploaded">
              <h2 className="text-xl font-semibold mb-4">Uploaded Resources</h2>

              {!isCurrentUser && user.is_private && !isFriend ? (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                  <p className="text-amber-800">This user's profile is private. Send a friend request to see their resources.</p>
                </div>
              ) : uploadedResources.length === 0 ? (
                <p className="text-muted-foreground">No resources uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  {uploadedResources.slice(0, 4).map((resource) => (
                    <ResourceItem 
                      key={resource.id} 
                      resource={resource} 
                      isOwner={isCurrentUser}
                    />
                  ))}
                </div>
              )}

              {uploadedResources.length > 4 && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline">
                    <Link href={`/resources/my-uploads`}>
                      View All Uploads
                    </Link>
                  </Button>
                </div>
              )}

              {isCurrentUser && (
                <div className="flex justify-center mt-6">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/resources/upload">
                      Upload New Resource
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ratings">
              <h2 className="text-xl font-semibold mb-4">Ratings Given</h2>

              {!isCurrentUser && user.is_private && !isFriend ? (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                  <p className="text-amber-800">This user's profile is private. Send a friend request to see their ratings.</p>
                </div>
              ) : ratingsGiven.length === 0 ? (
                <p className="text-muted-foreground">No ratings given yet.</p>
              ) : (
                <div className="space-y-4">
                  {ratingsGiven.slice(0, 4).map((rating) => (
                    <RatingItem key={rating.id} rating={rating} />
                  ))}
                </div>
              )}

              {ratingsGiven.length > 4 && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline">
                    <Link href="/ratings/history">
                      View All Ratings
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            {isCurrentUser && (
              <TabsContent value="downloads">
                <h2 className="text-xl font-semibold mb-4">Downloaded Resources</h2>
                
                {downloadedResources.length === 0 ? (
                  <p className="text-muted-foreground">No resources downloaded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {downloadedResources.slice(0, 4).map((download) => (
                      <DownloadItem key={download.id} download={download} />
                    ))}
                  </div>
                )}
                
                {downloadedResources.length > 4 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline">
                      <Link href="/downloads/history">
                        View All Downloads
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal 
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}

function ResourceItem({ resource, isOwner = false }) {
  const resourceDate = new Date(resource.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium">{resource.title}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>{resource.subject}</span>
                <div className="flex items-center mx-2">
                  <Star className="h-4 w-4 text-amber-500 mr-1" />
                  <span>{parseFloat(resource.average_rating || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {isOwner && (
              <Button variant="ghost" size="icon" className="mr-2">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <div className="text-sm text-muted-foreground">{resourceDate}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RatingItem({ rating }) {
  const ratingDate = new Date(rating.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium">{rating.resource_title}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>By {rating.user || 'Unknown'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex mr-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= rating.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{ratingDate}</div>
          </div>
        </div>
        {rating.comment && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-600">{rating.comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DownloadItem({ download }) {
  const downloadDate = new Date(download.downloaded_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">{download.resource_title}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>{download.subject}</span>
                <span className="mx-2">•</span>
                <span>{download.resource_type}</span>
                <span className="mx-2">•</span>
                <span>By {download.author}</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">{downloadDate}</div>
        </div>
      </CardContent>
    </Card>
  );
}