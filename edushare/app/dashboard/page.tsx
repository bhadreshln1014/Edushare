"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Download,
  Edit,
  FileText,
  MoreVertical,
  Star,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { config } from '../../config'; // Adjust path as needed

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

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [ratingsGiven, setRatingsGiven] = useState([]);
  const [ratingsReceived, setRatingsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingReceivedFriends, setPendingReceivedFriends] = useState([]);
  const [pendingSentFriends, setPendingSentFriends] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      const userString = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userString || !token) {
        setError("User or token not found");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      const userId = user.id;

      const headers = { Authorization: `Token ${token}` };

      try {
        // Fetch user data and resources
        const [userRes, uploadsRes, downloadsRes, ratingsGivenRes, friendsRes] = await Promise.all([
          fetch(`${config.apiUrl}/api/users/${userId}/`, { headers }),
          fetch(`${config.apiUrl}/api/users/${userId}/resources/`, { headers }),
          fetch(`${config.apiUrl}/api/users/${userId}/downloads/`, { headers }),
          fetch(`${config.apiUrl}/api/users/${userId}/ratings/`, { headers }),
          fetch(`${config.apiUrl}/api/friendships/`, { headers }),
        ]);

        if (
          !userRes.ok ||
          !uploadsRes.ok ||
          !downloadsRes.ok ||
          !ratingsGivenRes.ok ||
          !friendsRes.ok
        ) {
          throw new Error("One or more API calls failed");
        }

        const userDataResponse = await userRes.json();
        const uploadsData = await uploadsRes.json();
        const downloadsData = await downloadsRes.json();
        const ratingsGivenData = await ratingsGivenRes.json();
        const friendsData = await friendsRes.json();
        
        // Set user data from backend
        setUserData(userDataResponse);
        setUploads(uploadsData);
        setDownloads(downloadsData);
        setRatingsGiven(ratingsGivenData);
        
        // Get ratings received on user's resources
        // We need to fetch ratings for each resource the user has uploaded
        const allRatingsReceived = [];
        
        // Process each resource to get its ratings
        for (const resource of uploadsData) {
          try {
            const ratingsRes = await fetch(`${config.apiUrl}/api/resources/${resource.id}/ratings/`, { headers });
            
            if (ratingsRes.ok) {
              const resourceRatings = await ratingsRes.json();
              
              // Add resource title to each rating and add to the collection
              resourceRatings.forEach(rating => {
                allRatingsReceived.push({
                  ...rating,
                  resource_title: resource.title
                });
              });
            }
          } catch (error) {
            console.error(`Error fetching ratings for resource ${resource.id}:`, error);
          }
        }
        
        // Sort ratings by date (newest first)
        allRatingsReceived.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRatingsReceived(allRatingsReceived);
        
        // Separate pending requests
        const receivedPendingRequests = friendsData.filter(friendship => 
          friendship.status === 'pending' && friendship.addressee_username === user.username
        );
        
        const sentPendingRequests = friendsData.filter(friendship => 
          friendship.status === 'pending' && friendship.requester_username === user.username
        );
        
        // Get accepted friends
        const acceptedFriends = friendsData.filter(friendship => 
          friendship.status === 'accepted'
        );

        setPendingReceivedFriends(receivedPendingRequests);
        setPendingSentFriends(sentPendingRequests);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Upload className="h-6 w-6 text-indigo-600" />}
          title="Resources Uploaded"
          value={uploads.length}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Star className="h-6 w-6 text-amber-500" />}
          title="Average Rating"
          value={userData?.average_rating?.toFixed(2) || "0.0"}
          color="bg-amber-50"
          isRating={true}
        />
        <StatCard
          icon={<Download className="h-6 w-6 text-blue-600" />}
          title="Resources Downloaded"
          value={downloads.length}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-purple-600" />}
          title="Educator Connections"
          value={userData?.friend_count || 0}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-medium">Friend Requests</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Received Requests: {pendingReceivedFriends.length}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push('/connections?tab=received')}
                >
                  View Received
                </Button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Sent Requests: {pendingSentFriends.length}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push('/connections?tab=sent')}
                >
                  View Sent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent Uploads</h2>
              <Link
                href="/resources/my-uploads"
                className="text-sm text-indigo-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {uploads.length ? (
                uploads.slice(0, 3).map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{upload.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(upload.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <StarRating 
                          rating={upload.average_rating || 0} 
                          size="sm" 
                        />
                        <span className="text-sm text-muted-foreground">
                          ({parseFloat(upload.average_rating || 0).toFixed(1)})
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/resources/edit/${upload.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No uploads yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent Downloads</h2>
              <Link
                href="/downloads/history"
                className="text-sm text-indigo-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {downloads.length ? (
                downloads.slice(0, 3).map((download) => (
                  <div
                    key={download.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{download.resource_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Downloaded {new Date(download.downloaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      By {download.user}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No downloads yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent Feedback Received</h2>
              <Button variant="ghost" size="sm">
                <Star className="h-4 w-4 text-amber-500 mr-1" />
                <Link
                  href="/feedback/history"
                  className="text-sm text-indigo-600 hover:underline"
                >
                View all
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {ratingsReceived.length ? (
                ratingsReceived.slice(0, 3).map((rating) => (
                  <div key={rating.id} className="border-l-2 border-indigo-600 pl-4">
                    <h3 className="font-medium">{rating.resource_title}</h3>
                    <div className="flex items-center my-1 gap-1">
                      <StarRating rating={rating.rating} size="sm" />
                      <p className="text-sm">"{rating.comment || 'No comment'}"</p>
                    </div>
                    <p className="text-sm text-muted-foreground">From {rating.user || 'Anonymous'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No feedback received yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href="/resources/upload">Upload New Resource</Link>
        </Button>
      </div>
    </div>
  );
}