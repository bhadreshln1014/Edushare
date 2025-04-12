"use client"

import { useState, useEffect } from "react"
import { Search, Star, Edit, FileText, Calendar, BarChart2, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

function BarChart({ height, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 bg-amber-500 rounded-t-md" style={{ height }}></div>
      <span className="text-xs mt-2 text-muted-foreground">{label}</span>
    </div>
  )
}

export default function RatingsHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [ratings, setRatings] = useState([])
  const [filteredRatings, setFilteredRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: 0,
    mostRatedSubject: "Loading...",
    recentActivity: "Loading..."
  })
  
  // Filter states
  const [activeTab, setActiveTab] = useState("all")
  const [starFilter, setStarFilter] = useState("all")
  const [subject, setSubject] = useState("all")
  
  // For pagination
  const [visibleCount, setVisibleCount] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Subject rating counts for chart
  const [subjectCounts, setSubjectCounts] = useState({})

  useEffect(() => {
    fetchRatings()
  }, [])

  useEffect(() => {
    // Apply filters whenever filter states change
    applyFilters()
  }, [ratings, searchQuery, activeTab, starFilter, subject])

  const fetchRatings = async () => {
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
      // Fetch all ratings for the user
      const response = await fetch(`http://localhost:8000/api/users/${userId}/ratings/`, { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch ratings")
      }

      const ratingsData = await response.json()
      
      // Sort by created_at date (newest first)
      ratingsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      // Process rating data to include additional information
      const processedRatings = ratingsData.map(rating => {
        // Format the date for display
        const ratingDate = new Date(rating.created_at)
        const now = new Date()
        
        let formattedDate
        const diffDays = Math.floor((now - ratingDate) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) {
          formattedDate = `Today, ${ratingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else if (diffDays === 1) {
          formattedDate = `Yesterday, ${ratingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else if (diffDays < 7) {
          formattedDate = `${diffDays} days ago`
        } else if (diffDays < 30) {
          formattedDate = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
        } else {
          formattedDate = ratingDate.toLocaleDateString()
        }
        
        return {
          id: rating.id,
          resourceId: rating.resource,
          title: rating.resource_title || "Untitled Resource",
          author: rating.author || "Unknown",
          subject: rating.subject || "General",
          rating: rating.rating,
          comment: rating.comment || "",
          date: formattedDate,
          created_at: rating.created_at
        }
      })
      
      setRatings(processedRatings)
      setTotalCount(processedRatings.length)
      
      // Calculate stats from the ratings
      calculateStats(processedRatings)
      
    } catch (err) {
      console.error("Error fetching ratings:", err)
      setError("Failed to load ratings history.")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (ratingsData) => {
    // Total ratings count
    const totalRatings = ratingsData.length
    
    // Calculate average rating
    const sum = ratingsData.reduce((acc, rating) => acc + rating.rating, 0)
    const averageRating = totalRatings > 0 ? (sum / totalRatings).toFixed(1) : 0
    
    // Count by subject
    const subjects = {}
    ratingsData.forEach(rating => {
      const subject = rating.subject || "Other"
      if (!subjects[subject]) {
        subjects[subject] = {
          count: 0,
          sum: 0
        }
      }
      subjects[subject].count++
      subjects[subject].sum += rating.rating
    })
    
    // Find most rated subject
    let mostRatedSubject = "None"
    let maxCount = 0
    for (const [subject, data] of Object.entries(subjects)) {
      if (data.count > maxCount) {
        maxCount = data.count
        mostRatedSubject = subject
      }
    }
    
    // Recent activity - count ratings in last week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const recentRatings = ratingsData.filter(
      rating => new Date(rating.created_at) >= oneWeekAgo
    ).length
    
    // Calculate subject counts for chart
    setSubjectCounts(subjects)
    
    setStats({
      totalRatings,
      averageRating,
      mostRatedSubject: `${mostRatedSubject} resources`,
      recentActivity: `${recentRatings} ratings this week`
    })
  }

  const applyFilters = () => {
    let filtered = [...ratings]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(rating => 
        rating.title.toLowerCase().includes(query) ||
        rating.subject.toLowerCase().includes(query) ||
        rating.author.toLowerCase().includes(query) ||
        rating.comment.toLowerCase().includes(query)
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
      
      filtered = filtered.filter(rating => 
        new Date(rating.created_at) >= cutoffDate
      )
    }
    
    // Apply star rating filter
    if (starFilter !== "all") {
      const stars = parseInt(starFilter, 10)
      filtered = filtered.filter(rating => rating.rating === stars)
    }
    
    // Apply subject filter
    if (subject !== "all") {
      filtered = filtered.filter(rating => 
        rating.subject.toLowerCase() === subject
      )
    }
    
    setFilteredRatings(filtered)
  }
  
  const handleDeleteRating = async (ratingId) => {
    const token = localStorage.getItem("token")
    if (!token) return
    
    try {
      const response = await fetch(`http://localhost:8000/api/ratings/${ratingId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete rating')
      }
      
      // Update UI by removing the deleted rating
      setRatings(prev => prev.filter(rating => rating.id !== ratingId))
      setFilteredRatings(prev => prev.filter(rating => rating.id !== ratingId))
      
      // Recalculate stats
      calculateStats(ratings.filter(rating => rating.id !== ratingId))
      
    } catch (error) {
      console.error("Error deleting rating:", error)
      // Show error message to user
    }
  }
  
  const handleEditRating = async (ratingId, resourceId) => {
    // Navigate to resource detail page with a query parameter to focus on the rating section
    window.location.href = `/resources/${resourceId}?editRating=true`
  }
  
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading ratings history...</p>
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Ratings History</h1>
      <p className="text-muted-foreground mb-8">View and manage all the ratings you've given to educational resources</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Star className="h-6 w-6 text-amber-500" />}
          title="Total Ratings"
          value={stats.totalRatings.toString()}
          color="bg-amber-50"
        />
        <StatCard
          icon={<Star className="h-6 w-6 text-amber-500 fill-amber-500" />}
          title="Average Rating"
          value={`${stats.averageRating} / 5`}
          color="bg-amber-50"
        />
        <StatCard
          icon={<BarChart2 className="h-6 w-6 text-indigo-600" />}
          title="Most Rated"
          value={stats.mostRatedSubject}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6 text-blue-600" />}
          title="Recent Activity"
          value={stats.recentActivity}
          color="bg-blue-50"
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search ratings by resource, subject, or comment..."
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
            <label className="block text-sm font-medium mb-2">Star Rating</label>
            <Select value={starFilter} onValueChange={setStarFilter}>
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
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="languages">Languages</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <Button variant="outline" className="w-full justify-between">
              Select dates
              <Calendar className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Ratings</h2>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Ratings</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="quarter">Last 3 Months</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {filteredRatings.length > 0 ? (
                filteredRatings.slice(0, visibleCount).map((rating) => (
                  <RatingItem 
                    key={rating.id} 
                    rating={rating} 
                    onEdit={() => handleEditRating(rating.id, rating.resourceId)}
                    onDelete={() => handleDeleteRating(rating.id)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No ratings found matching your criteria.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {filteredRatings.length > 0 && (
          <>
            <div className="text-center text-sm text-muted-foreground mt-4">
              Showing {Math.min(visibleCount, filteredRatings.length)} of {filteredRatings.length} ratings
            </div>

            {visibleCount < filteredRatings.length && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={handleLoadMore}>Load More</Button>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-6">Rating Distribution by Subject</h2>

        <Card>
          <CardContent className="p-6">
            <div className="h-[300px] flex items-end justify-between gap-2">
              {/* Dynamic bar chart visualization based on actual data */}
              <div className="h-full w-full flex items-end justify-between gap-2">
                {Object.keys(subjectCounts).length > 0 ? (
                  Object.entries(subjectCounts).map(([subject, data], index) => {
                    // Calculate relative height based on the maximum count
                    const maxCount = Math.max(...Object.values(subjectCounts).map(d => d.count))
                    const heightPercentage = (data.count / maxCount) * 100
                    return (
                      <BarChart 
                        key={index} 
                        height={`${heightPercentage}%`} 
                        label={subject.length > 8 ? subject.substring(0, 8) + '...' : subject} 
                      />
                    )
                  })
                ) : (
                  <>
                    <BarChart height="0%" label="No data" />
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  return (
    <Card className={`${color} border-none`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-sm font-medium">{value}</p>
          </div>
          <div className="rounded-full p-2 bg-white">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function RatingItem({ rating, onEdit, onDelete }) {
  const getIcon = (subject) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></svg>;
      case 'science':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/></svg>;
      case 'history':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
      case 'english':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M4 19.5v-15A2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-15"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h2"/></svg>;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="mr-4">
            {getIcon(rating.subject)}
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium">
              <Link href={`/resources/${rating.resourceId}`} className="hover:text-indigo-600">
                {rating.title}
              </Link>
            </h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>By {rating.author}</span>
              <span className="mx-2">•</span>
              <span>{rating.subject}</span>
              <span className="mx-2">•</span>
              <span>Rated: {rating.date}</span>
            </div>
            {rating.comment && (
              <p className="text-sm mt-2 text-gray-600">"{rating.comment}"</p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= rating.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button 
                size="icon" 
                variant="outline"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}