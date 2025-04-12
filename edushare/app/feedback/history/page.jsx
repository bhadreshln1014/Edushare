"use client"

import { useState, useEffect } from "react"
import { Search, Star, FileText, Calendar, BarChart2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

function BarChart({ height, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 bg-amber-500 rounded-t-md" style={{ height }}></div>
      <span className="text-xs mt-2 text-muted-foreground">{label}</span>
    </div>
  )
}

export default function FeedbackHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [feedback, setFeedback] = useState([])
  const [filteredFeedback, setFilteredFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: "0.0",
    highestRatedResource: "Loading...",
    lowestRatedResource: "Loading..."
  })
  
  // Filter states
  const [activeTab, setActiveTab] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [resourceFilter, setResourceFilter] = useState("all")
  
  // For pagination
  const [visibleCount, setVisibleCount] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Rating distribution for chart
  const [ratingDistribution, setRatingDistribution] = useState({
    "5": 0, "4": 0, "3": 0, "2": 0, "1": 0
  })

  useEffect(() => {
    fetchFeedback()
  }, [])

  useEffect(() => {
    // Apply filters whenever filter states change
    applyFilters()
  }, [feedback, searchQuery, activeTab, ratingFilter, resourceFilter])

  const fetchFeedback = async () => {
    const userString = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!userString || !token) {
      setError("User or token not found")
      setLoading(false)
      return
    }

    const user = JSON.parse(userString)
    const userId = user.id
    const headers = { Authorization: `Token ${token}` }

    try {
      // First, get all resources created by this user
      const resourcesResponse = await fetch(`http://localhost:8000/api/users/${userId}/resources/`, { headers })
      
      if (!resourcesResponse.ok) {
        throw new Error("Failed to fetch resources")
      }
      
      const resources = await resourcesResponse.json()
      
      // For each resource, get its ratings
      let allFeedback = []
      
      // This approach might be inefficient for users with many resources
      // A better backend would provide an endpoint that returns all ratings for all of a user's resources
      for (const resource of resources) {
        const ratingsResponse = await fetch(`http://localhost:8000/api/resources/${resource.id}/ratings/`, { headers })
        
        if (ratingsResponse.ok) {
          const ratings = await ratingsResponse.json()
          // Add resource title to each rating
          ratings.forEach(rating => {
            rating.resource_title = resource.title
          })
          allFeedback = [...allFeedback, ...ratings]
        }
      }
      
      // Sort by created_at date (newest first)
      allFeedback.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      // Process feedback data to include additional information
      const processedFeedback = allFeedback.map(item => {
        // Format the date for display
        const feedbackDate = new Date(item.created_at)
        const now = new Date()
        
        let formattedDate
        const diffDays = Math.floor((now - feedbackDate) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) {
          formattedDate = `Today, ${feedbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else if (diffDays === 1) {
          formattedDate = `Yesterday, ${feedbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else if (diffDays < 7) {
          formattedDate = `${diffDays} days ago`
        } else if (diffDays < 30) {
          formattedDate = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
        } else {
          formattedDate = feedbackDate.toLocaleDateString()
        }
        
        return {
          id: item.id,
          resourceId: item.resource,
          resourceTitle: item.resource_title || "Untitled Resource",
          rating: item.rating,
          comment: item.comment || "No comment provided",
          // The user field is the username of the person who left the rating
          author: item.user || "Anonymous",
          date: formattedDate,
          created_at: item.created_at
        }
      })
      
      setFeedback(processedFeedback)
      setTotalCount(processedFeedback.length)
      
      // Calculate stats from the feedback
      calculateStats(processedFeedback)
      
    } catch (err) {
      console.error("Error fetching feedback:", err)
      setError("Failed to load feedback history.")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (feedbackData) => {
    // Total ratings count
    const totalRatings = feedbackData.length
    
    // Calculate average rating
    const sum = feedbackData.reduce((acc, item) => acc + item.rating, 0)
    const average = totalRatings > 0 ? (sum / totalRatings).toFixed(1) : "0.0"
    
    // Find highest and lowest rated resources
    const resourceRatings = {}
    
    feedbackData.forEach(item => {
      if (!resourceRatings[item.resourceTitle]) {
        resourceRatings[item.resourceTitle] = {
          sum: item.rating,
          count: 1
        }
      } else {
        resourceRatings[item.resourceTitle].sum += item.rating
        resourceRatings[item.resourceTitle].count += 1
      }
    })
    
    let highestRated = { title: "None", average: 0 }
    let lowestRated = { title: "None", average: 5 }
    
    for (const [title, data] of Object.entries(resourceRatings)) {
      const avg = data.sum / data.count
      
      if (avg > highestRated.average) {
        highestRated = { title, average: avg }
      }
      
      if (avg < lowestRated.average && data.count > 1) {
        lowestRated = { title, average: avg }
      }
    }
    
    // Calculate rating distribution
    const distribution = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }
    
    feedbackData.forEach(item => {
      distribution[Math.floor(item.rating)] += 1
    })
    
    setRatingDistribution(distribution)
    
    setStats({
      totalRatings,
      averageRating: average,
      highestRatedResource: highestRated.title !== "None" ? 
        `${highestRated.title} (${highestRated.average.toFixed(1)})` : 
        "No ratings yet",
      lowestRatedResource: lowestRated.title !== "None" ? 
        `${lowestRated.title} (${lowestRated.average.toFixed(1)})` : 
        "No ratings yet"
    })
  }

  const applyFilters = () => {
    let filtered = [...feedback]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.resourceTitle.toLowerCase().includes(query) ||
        item.comment.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query)
      )
    }
    
    // Apply time period filter
    if (activeTab !== "all") {
      const now = new Date()
      let cutoffDate = new Date()
      
      switch (activeTab) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7)
          break
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3)
          break
      }
      
      filtered = filtered.filter(item => 
        new Date(item.created_at) >= cutoffDate
      )
    }
    
    // Apply rating filter
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter)
      filtered = filtered.filter(item => 
        item.rating === rating
      )
    }
    
    // Apply resource filter (if implemented)
    if (resourceFilter !== "all") {
      filtered = filtered.filter(item => 
        item.resourceId === parseInt(resourceFilter)
      )
    }
    
    setFilteredFeedback(filtered)
  }
  
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading feedback history...</p>
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

  // Get unique resources for filter dropdown
  const resources = [...new Set(feedback.map(item => item.resourceTitle))].map(title => ({
    id: feedback.find(f => f.resourceTitle === title).resourceId,
    title
  }))

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Feedback History</h1>
      <p className="text-muted-foreground mb-8">View and manage all feedback received on your resources</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<MessageSquare className="h-6 w-6 text-indigo-600" />}
          title="Total Ratings"
          value={stats.totalRatings.toString()}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Star className="h-6 w-6 text-amber-500" />}
          title="Average Rating"
          value={stats.averageRating}
          color="bg-amber-50"
          isRating={true}
        />
        <StatCard
          icon={<FileText className="h-6 w-6 text-green-600" />}
          title="Highest Rated"
          value={stats.highestRatedResource}
          color="bg-green-50"
        />
        <StatCard
          icon={<BarChart2 className="h-6 w-6 text-blue-600" />}
          title="Lowest Rated"
          value={stats.lowestRatedResource}
          color="bg-blue-50"
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger>
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
                <SelectItem value="4">4 stars</SelectItem>
                <SelectItem value="3">3 stars</SelectItem>
                <SelectItem value="2">2 stars</SelectItem>
                <SelectItem value="1">1 star</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resource</label>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
                {resources.map(resource => (
                  <SelectItem key={resource.id} value={resource.id.toString()}>
                    {resource.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Feedback Received</h2>

        <div className="space-y-4">
          {filteredFeedback.length > 0 ? (
            filteredFeedback.slice(0, visibleCount).map((item) => (
              <FeedbackItem 
                key={item.id} 
                feedback={item} 
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No feedback found matching your criteria.</p>
            </div>
          )}
        </div>

        {filteredFeedback.length > 0 && (
          <>
            <div className="text-center text-sm text-muted-foreground mt-4">
              Showing {Math.min(visibleCount, filteredFeedback.length)} of {filteredFeedback.length} ratings
            </div>

            {visibleCount < filteredFeedback.length && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={handleLoadMore}>Load More</Button>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-6">Rating Distribution</h2>

        <Card>
          <CardContent className="p-6">
            <div className="h-[300px] flex items-end justify-center gap-8">
              {/* Dynamic bar chart visualization based on rating distribution */}
              <div className="h-full flex items-end justify-center gap-8">
                {Object.entries(ratingDistribution).reverse().map(([rating, count], index) => {
                  // Calculate relative height based on the maximum count
                  const maxCount = Math.max(...Object.values(ratingDistribution))
                  const heightPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <BarChart 
                        height={`${heightPercentage}%`} 
                        label={`${rating} ${rating === "1" ? "star" : "stars"}`} 
                      />
                      <div className="mt-2 text-sm font-medium">{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
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
              <p className="text-sm font-medium">{value}</p>
            )}
          </div>
          <div className="rounded-full p-2 bg-white">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackItem({ feedback }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{feedback.resourceTitle}</h3>
              <div className="text-xs text-muted-foreground">• {feedback.date}</div>
            </div>
            
            <div className="flex items-center mb-2">
              <StarRating rating={feedback.rating} size="sm" />
              <span className="ml-2 text-sm text-muted-foreground">
                {feedback.rating.toFixed(1)} out of 5
              </span>
            </div>
            
            <div className="border-l-2 border-indigo-200 pl-3 text-sm">
              <p className="italic">"{feedback.comment}"</p>
              <p className="text-muted-foreground mt-1">- {feedback.author}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}