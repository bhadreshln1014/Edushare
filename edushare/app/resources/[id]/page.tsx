"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Download, Star, Edit, Trash2, Bookmark, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { config } from '../../../config'; // Adjust path as needed

export default function ResourceDetailPage({ params }) {
  const router = useRouter()
  const [resource, setResource] = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [userReview, setUserReview] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [reviews, setReviews] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  useEffect(() => {
    const userString = localStorage.getItem("user")
    if (userString) {
      setCurrentUser(JSON.parse(userString))
    }
    
    fetchResourceDetails()
  }, [params.id])

  const fetchResourceDetails = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      // Fetch resource details
      const resourceRes = await fetch(`${config.apiUrl}/api/resources/${params.id}/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!resourceRes.ok) {
        throw new Error(`Failed to fetch resource: ${resourceRes.status}`)
      }
      
      const resourceData = await resourceRes.json()
      setResource(resourceData)
      
      // Check if current user is the owner
      const userString = localStorage.getItem("user")
      if (userString) {
        const user = JSON.parse(userString)
        setIsOwner(resourceData.author_id === user.id)
      }
      
      // Check if resource is saved by current user
      await checkIfResourceIsSaved()
      
      // Fetch reviews for this resource
      const reviewsRes = await fetch(`${config.apiUrl}/api/resources/${params.id}/ratings/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData)
      }
      
    } catch (err) {
      console.error("Error fetching resource details:", err)
      setError("Failed to load resource details")
    } finally {
      setLoading(false)
    }
  }

  const checkIfResourceIsSaved = async () => {
    const token = localStorage.getItem("token")
    const userString = localStorage.getItem("user")
    
    if (!token || !userString) {
      return
    }
    
    try {
      const user = JSON.parse(userString)
      const response = await fetch(`${config.apiUrl}/api/users/${user.id}/saved_resources/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch saved resources")
      }
      
      const savedResources = await response.json()
      const isResourceSaved = savedResources.some(r => r.id === parseInt(params.id))
      setIsSaved(isResourceSaved)
      
    } catch (error) {
      console.error("Error checking if resource is saved:", error)
    }
  }

  const handleDownload = async () => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${params.id}/download/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to download resource")
      }
      
      const data = await response.json()
      
      // Open the download URL in a new tab
      window.open(data.download_url, '_blank')
      
    } catch (error) {
      console.error("Error downloading resource:", error)
      setError("Failed to download resource")
    }
  }

  const handleSaveResource = async () => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${params.id}/save/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to save resource")
      }
      
      setIsSaved(true)
      
    } catch (error) {
      console.error("Error saving resource:", error)
      setError("Failed to save resource")
    }
  }
  
  const handleUnsaveResource = async () => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${params.id}/unsave/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to unsave resource")
      }
      
      setIsSaved(false)
      
    } catch (error) {
      console.error("Error unsaving resource:", error)
      setError("Failed to unsave resource")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
      return
    }
    
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${params.id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete resource")
      }
      
      // Redirect to resources page after deletion
      router.push("/resources")
      
    } catch (error) {
      console.error("Error deleting resource:", error)
      setError("Failed to delete resource")
    }
  }

  const handleRatingClick = (rating) => {
    setUserRating(rating)
  }

  const handleSubmitReview = async () => {
    if (!userRating) {
      setReviewError("Please select a rating")
      return
    }
    
    const token = localStorage.getItem("token")
    
    if (!token) {
      setReviewError("Authentication required")
      return
    }
    
    setSubmittingReview(true)
    setReviewError(null)
    
    try {
      // Use the correct endpoint with the proper data format
      const response = await fetch(`${config.apiUrl}/api/resources/${params.id}/rate/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: userRating,        // Make sure this is sent as a number, not a string
          comment: userReview || ""  // Ensure comment is never null
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to submit review")
      }
      
      // Reset form
      setUserRating(0)
      setUserReview("")
      
      // Refresh resource and reviews
      fetchResourceDetails()
      
    } catch (error) {
      console.error("Error submitting review:", error)
      setReviewError(error.message || "Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading resource details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center text-red-600">
        <p>{error}</p>
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Resource not found</p>
      </div>
    )
  }

  // Format date
  const uploadDate = new Date(resource.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/resources" className="hover:text-foreground">
          Resources
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href={`/resources?subject=${resource.subject}`} className="hover:text-foreground">
          {resource.subject}
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span>Resource Detail</span>
      </div>

      <h1 className="text-3xl font-bold mb-8">{resource.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 text-indigo-600"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
              Resource Metadata
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Subject:</span> {resource.subject}
              </div>
              <div>
                <span className="font-medium">Grade Level:</span> {resource.grade_level}
              </div>
              <div>
                <span className="font-medium">Resource Type:</span> {resource.resource_type}
              </div>
              <div>
                <span className="font-medium">Uploaded:</span> {uploadDate}
              </div>
              <div>
                <span className="font-medium">By:</span> {resource.user}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-amber-500" />
              Rating
            </h2>

            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 mb-1">
                {resource.average_rating ? `${resource.average_rating.toFixed(1)}/5` : "No ratings yet"}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                ({resource.num_ratings || 0} {resource.num_ratings === 1 ? "rating" : "ratings"})
              </div>
              <div className="flex justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= resource.average_rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 text-indigo-600"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Actions
            </h2>

            <div className="space-y-3">
              <Button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Download Resource
              </Button>
              
              {isSaved ? (
                <Button onClick={handleUnsaveResource} variant="outline" className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Saved Resource
                </Button>
              ) : (
                <Button onClick={handleSaveResource} variant="outline" className="w-full">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save Resource
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Resource Preview</h2>
          <Card>
            <CardContent className="p-0">
              {resource.preview_image ? (
                <Image
                  src={resource.preview_image}
                  alt="Resource preview"
                  width={1200}
                  height={600}
                  className="w-full h-auto object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-64 bg-slate-100 flex items-center justify-center rounded-md">
                  <p className="text-muted-foreground">No preview available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm leading-relaxed">{resource.description}</p>
          </CardContent>
        </Card>
      </div>

      {isOwner && (
        <div className="flex gap-4 mb-8">
          <Button asChild variant="outline" size="sm">
            <Link href={`/resources/edit/${resource.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Resource
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Resource
          </Button>
        </div>
      )}

      {!isOwner && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Rate This Resource</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <p className="mr-4">Your Rating:</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-6 w-6 cursor-pointer ${
                        star <= (hoveredRating || userRating) 
                          ? "text-amber-500 fill-amber-500" 
                          : "text-muted-foreground"
                      }`} 
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Textarea 
                  placeholder="Share your thoughts about this resource..." 
                  className="min-h-[100px]"
                  value={userReview}
                  onChange={e => setUserReview(e.target.value)}
                />
                
                {reviewError && (
                  <p className="text-red-600 text-sm">{reviewError}</p>
                )}
                
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to review this resource!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">
                      {review.user
                        ? review.user.split(" ").map((n) => n[0]).join("")
                        : "U"}
                    </div>
                    <div>
                      <h3 className="font-medium">{review.user || "Anonymous"}</h3>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {reviews.length > 5 && (
              <Button variant="outline" className="w-full">
                Load More Reviews
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}