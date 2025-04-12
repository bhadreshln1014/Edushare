"use client"

import { useState, useEffect } from "react"
import { Search, Download, FileText, Calendar, BarChart2, Database, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { config } from '../../../config'; // Adjust path as needed

function ClockIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function BarChart({ height, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 bg-indigo-600 rounded-t-md" style={{ height }}></div>
      <span className="text-xs mt-2 text-muted-foreground">{label}</span>
    </div>
  )
}

export default function DownloadsHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [downloads, setDownloads] = useState([])
  const [filteredDownloads, setFilteredDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalDownloads: 0,
    mostDownloaded: "Loading...",
    recentActivity: "Loading...",
    storageUsed: "Loading..."
  })
  
  // Filter states
  const [activeTab, setActiveTab] = useState("all")
  const [resourceType, setResourceType] = useState("all")
  const [subject, setSubject] = useState("all")
  const [gradeLevel, setGradeLevel] = useState("all")
  
  // For pagination
  const [visibleCount, setVisibleCount] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Subject download counts for chart
  const [subjectCounts, setSubjectCounts] = useState({})

  useEffect(() => {
    fetchDownloads()
  }, [])

  useEffect(() => {
    // Apply filters whenever filter states change
    applyFilters()
  }, [downloads, searchQuery, activeTab, resourceType, subject, gradeLevel])

  const fetchDownloads = async () => {
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
      // Fetch all downloads for the user
      const response = await fetch(`${config.apiUrl}/api/users/${userId}/downloads/`, { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch downloads")
      }

      const downloadsData = await response.json()
      
      // Sort by downloaded_at date (newest first)
      downloadsData.sort((a, b) => new Date(b.downloaded_at) - new Date(a.downloaded_at))
      
      // Process download data to include additional information
      const processedDownloads = downloadsData.map(download => {
        // Format the date for display
        const downloadDate = new Date(download.downloaded_at)
        const now = new Date()
        
        let formattedDate
        const diffDays = Math.floor((now - downloadDate) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) {
          formattedDate = `Today, ${downloadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else if (diffDays === 1) {
          formattedDate = `Yesterday, ${downloadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        } else if (diffDays < 7) {
          formattedDate = `${diffDays} days ago`
        } else if (diffDays < 30) {
          formattedDate = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
        } else {
          formattedDate = downloadDate.toLocaleDateString()
        }
        
        // Get resource details
        return {
          id: download.id,
          resourceId: download.resource,
          title: download.resource_title || "Untitled Resource",
          subject: download.subject || "General",
          grade: download.grade_level || "All grades",
          date: formattedDate,
          downloaded_at: download.downloaded_at,
          resource_type: download.resource_type || "worksheet",
          // Add additional fields as needed
        }
      })
      
      setDownloads(processedDownloads)
      setTotalCount(processedDownloads.length)
      
      // Calculate stats from the downloads
      calculateStats(processedDownloads)
      
    } catch (err) {
      console.error("Error fetching downloads:", err)
      setError("Failed to load download history.")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (downloadsData) => {
    // Total downloads count
    const totalDownloads = downloadsData.length
    
    // Count by subject
    const subjects = {}
    downloadsData.forEach(download => {
      const subject = download.subject || "Other"
      subjects[subject] = (subjects[subject] || 0) + 1
    })
    
    // Find most downloaded subject
    let mostDownloaded = "None"
    let maxCount = 0
    for (const [subject, count] of Object.entries(subjects)) {
      if (count > maxCount) {
        maxCount = count
        mostDownloaded = subject
      }
    }
    
    // Recent activity - count downloads in last week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const recentDownloads = downloadsData.filter(
      download => new Date(download.downloaded_at) >= oneWeekAgo
    ).length
    
    // Calculate subject counts for chart
    setSubjectCounts(subjects)
    
    setStats({
      totalDownloads,
      mostDownloaded: `${mostDownloaded} resources`,
      recentActivity: `${recentDownloads} downloads this week`,
      storageUsed: "Calculating..." // Would need separate API call for storage details
    })
  }

  const applyFilters = () => {
    let filtered = [...downloads]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(download => 
        download.title.toLowerCase().includes(query) ||
        download.subject.toLowerCase().includes(query)
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
      
      filtered = filtered.filter(download => 
        new Date(download.downloaded_at) >= cutoffDate
      )
    }
    
    // Apply resource type filter
    if (resourceType !== "all") {
      filtered = filtered.filter(download => 
        download.resource_type === resourceType
      )
    }
    
    // Apply subject filter
    if (subject !== "all") {
      filtered = filtered.filter(download => 
        download.subject.toLowerCase() === subject
      )
    }
    
    // Apply grade level filter
    if (gradeLevel !== "all") {
      filtered = filtered.filter(download => 
        download.grade.includes(gradeLevel)
      )
    }
    
    setFilteredDownloads(filtered)
  }
  
  const handleDeleteDownload = async (downloadId) => {
    const token = localStorage.getItem("token")
    if (!token) return
    
    try {
      const response = await fetch(`${config.apiUrl}/api/downloads/${downloadId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete download record')
      }
      
      // Update UI by removing the deleted download
      setDownloads(prev => prev.filter(download => download.id !== downloadId))
      setFilteredDownloads(prev => prev.filter(download => download.id !== downloadId))
      
    } catch (error) {
      console.error("Error deleting download:", error)
      // Show error message to user
    }
  }
  
  const handleClearHistory = async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    
    const userString = localStorage.getItem("user")
    if (!userString) return
    
    const user = JSON.parse(userString)
    const userId = user.id
    
    try {
      // This would need a custom endpoint in your API
      const response = await fetch(`${config.apiUrl}/api/downloads/clear/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear download history')
      }
      
      // Reset downloads in UI
      setDownloads([])
      setFilteredDownloads([])
      
    } catch (error) {
      console.error("Error clearing download history:", error)
      // Show error message to user
    }
  }
  
  const handleRedownload = async (downloadId, resourceId) => {
    const token = localStorage.getItem("token")
    if (!token) return
    
    try {
      // Call the resource download endpoint
      const response = await fetch(`${config.apiUrl}/api/resources/${resourceId}/download/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download resource')
      }
      
      const data = await response.json()
      
      // Open the download URL
      window.open(data.download_url, '_blank')
      
      // Refresh downloads to update download count
      fetchDownloads()
      
    } catch (error) {
      console.error("Error downloading resource:", error)
      // Show error message to user
    }
  }
  
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading download history...</p>
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
      <h1 className="text-3xl font-bold mb-2">Downloads History</h1>
      <p className="text-muted-foreground mb-8">View and manage all educational resources you've downloaded</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FileText className="h-6 w-6 text-indigo-600" />}
          title="Total Downloads"
          value={stats.totalDownloads.toString()}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<BarChart2 className="h-6 w-6 text-amber-500" />}
          title="Most Downloaded"
          value={stats.mostDownloaded}
          color="bg-amber-50"
        />
        <StatCard
          icon={<ClockIcon className="h-6 w-6 text-blue-600" />}
          title="Recent Activity"
          value={stats.recentActivity}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Database className="h-6 w-6 text-purple-600" />}
          title="Storage Used"
          value={stats.storageUsed}
          color="bg-purple-50"
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search downloads..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="whitespace-nowrap" onClick={handleClearHistory}>
          Clear History
        </Button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <Button variant="outline" className="w-full justify-between">
              Select dates
              <Calendar className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resource Type</label>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="worksheet">Worksheets</SelectItem>
                <SelectItem value="presentation">Presentations</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="assessment">Assessments</SelectItem>
                <SelectItem value="lesson_plan">Lesson Plans</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
            <label className="block text-sm font-medium mb-2">Grade Level</label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                <SelectItem value="K-2">K-2</SelectItem>
                <SelectItem value="3-5">3-5</SelectItem>
                <SelectItem value="6-8">6-8</SelectItem>
                <SelectItem value="9-10">9-10</SelectItem>
                <SelectItem value="11-12">11-12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Downloaded Resources</h2>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Downloads</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="quarter">Last 3 Months</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {filteredDownloads.length > 0 ? (
                filteredDownloads.slice(0, visibleCount).map((download) => (
                  <DownloadItem 
                    key={download.id} 
                    download={download} 
                    onRedownload={() => handleRedownload(download.id, download.resourceId)}
                    onDelete={() => handleDeleteDownload(download.id)}
                    onView={() => window.location.href = `/resources/${download.resourceId}`}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No downloads found matching your criteria.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {filteredDownloads.length > 0 && (
          <>
            <div className="text-center text-sm text-muted-foreground mt-4">
              Showing {Math.min(visibleCount, filteredDownloads.length)} of {filteredDownloads.length} downloads
            </div>

            {visibleCount < filteredDownloads.length && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={handleLoadMore}>Load More</Button>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-6">Download Trends</h2>

        <Card>
          <CardContent className="p-6">
            <div className="h-[300px] flex items-end justify-between gap-2">
              {/* Dynamic bar chart visualization based on actual data */}
              <div className="h-full w-full flex items-end justify-between gap-2">
                {Object.keys(subjectCounts).length > 0 ? (
                  Object.entries(subjectCounts).map(([subject, count], index) => {
                    // Calculate relative height based on the maximum count
                    const maxCount = Math.max(...Object.values(subjectCounts))
                    const heightPercentage = (count / maxCount) * 100
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

function DownloadItem({ download, onRedownload, onDelete, onView }) {
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
      case 'chemistry':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="M9 3h6v11h4l-7 7-7-7h4z"/></svg>;
      case 'languages':
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="mr-4">
            {getIcon(download.subject)}
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium">{download.title}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>{download.subject} • Grade {download.grade}</span>
              <span className="mx-2">•</span>
              <span>Downloaded: {download.date}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="icon" 
              variant="outline"
              onClick={onRedownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button size="icon" 
              variant="outline"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}