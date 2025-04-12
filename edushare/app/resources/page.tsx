"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Filter, Eye, Bookmark, Edit, Download, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { config } from '../../config'; // Adjust path as needed

export default function ResourcesPage( { defaultTab = "browse"}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [resources, setResources] = useState([])
  const [myUploads, setMyUploads] = useState([])
  const [savedResources, setSavedResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  // Filters
  const [subject, setSubject] = useState("all")
  const [gradeLevel, setGradeLevel] = useState("all")
  const [resourceType, setResourceType] = useState("all")
  
  // For pagination
  const [visibleCount, setVisibleCount] = useState(9)
  const [hasMore, setHasMore] = useState(true)
  
  // Saved resources tracking
  const [savedResourceIds, setSavedResourceIds] = useState(new Set())

  useEffect(() => {
    // Load resources based on the active tab
    if (activeTab === "browse") {
      fetchResources()
    } else if (activeTab === "uploads") {
      fetchMyUploads()
    } else if (activeTab === "saved") {
      fetchSavedResources()
    }
  }, [activeTab])

  const fetchResources = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      // Build query parameters for filtering
      let queryParams = new URLSearchParams()
      
      if (searchQuery) {
        queryParams.append("search", searchQuery)
      }
      
      if (subject && subject !== "all") {
        queryParams.append("subject", subject)
      }
      
      if (gradeLevel && gradeLevel !== "all") {
        queryParams.append("grade_level", gradeLevel)
      }
      
      if (resourceType && resourceType !== "all") {
        queryParams.append("resource_type", resourceType)
      }
      
      const queryString = queryParams.toString()
      const endpoint = `${config.apiUrl}/api/resources/${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch resources")
      }
      
      const data = await response.json()
      setResources(data)
      setHasMore(data.length >= visibleCount)
      
      // Also fetch the user's saved resources to mark which ones are saved
      await fetchSavedResourceIds()
      
    } catch (error) {
      console.error("Error fetching resources:", error)
      setError("Failed to load resources")
    } finally {
      setLoading(false)
    }
  }

  const fetchMyUploads = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    const userString = localStorage.getItem("user")
    
    if (!token || !userString) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      const user = JSON.parse(userString)
      const userId = user.id
      
      const response = await fetch(`${config.apiUrl}/api/users/${userId}/resources/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch your uploads")
      }
      
      const data = await response.json()
      setMyUploads(data)
      
    } catch (error) {
      console.error("Error fetching uploads:", error)
      setError("Failed to load your uploads")
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedResources = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    const userString = localStorage.getItem("user")
    
    if (!token || !userString) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      const user = JSON.parse(userString)
      const userId = user.id
      
      const response = await fetch(`${config.apiUrl}/api/users/${userId}/saved_resources/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch saved resources")
      }
      
      const data = await response.json()
      setSavedResources(data)
      
      // Update the set of saved resource IDs
      const idSet = new Set(data.map(resource => resource.id))
      setSavedResourceIds(idSet)
      
    } catch (error) {
      console.error("Error fetching saved resources:", error)
      setError("Failed to load saved resources")
    } finally {
      setLoading(false)
    }
  }
  
  const fetchSavedResourceIds = async () => {
    const token = localStorage.getItem("token")
    const userString = localStorage.getItem("user")
    
    if (!token || !userString) {
      return
    }
    
    try {
      const user = JSON.parse(userString)
      const userId = user.id
      
      const response = await fetch(`${config.apiUrl}/api/users/${userId}/saved_resources/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch saved resources")
      }
      
      const data = await response.json()
      
      // Update the set of saved resource IDs
      const idSet = new Set(data.map(resource => resource.id))
      setSavedResourceIds(idSet)
      
    } catch (error) {
      console.error("Error fetching saved resource IDs:", error)
    }
  }

  const handleApplyFilters = () => {
    fetchResources()
  }

  const handleClearFilters = () => {
    setSubject("all")
    setGradeLevel("all")
    setResourceType("all")
    setSearchQuery("")
    
    // Fetch resources without filters
    fetchResources()
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6)
  }

  const handleDownload = async (resourceId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${resourceId}/download/`, {
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

  const handleDeleteResource = async (resourceId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${resourceId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete resource")
      }
      
      // Remove the deleted resource from the UI
      setMyUploads(prev => prev.filter(resource => resource.id !== resourceId))
      
    } catch (error) {
      console.error("Error deleting resource:", error)
      setError("Failed to delete resource")
    }
  }
  
  const handleSaveResource = async (resourceId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${resourceId}/save/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to save resource")
      }
      
      // Update the UI to show this resource is saved
      setSavedResourceIds(prev => new Set([...prev, resourceId]))
      
      // If we're on the saved resources tab, refresh the list
      if (activeTab === "saved") {
        fetchSavedResources()
      }
      
    } catch (error) {
      console.error("Error saving resource:", error)
      setError("Failed to save resource")
    }
  }
  
  const handleUnsaveResource = async (resourceId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${resourceId}/unsave/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to unsave resource")
      }
      
      // Update the UI to show this resource is no longer saved
      setSavedResourceIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(resourceId)
        return newSet
      })
      
      // If we're on the saved resources tab, remove it from the list
      if (activeTab === "saved") {
        setSavedResources(prev => prev.filter(resource => resource.id !== resourceId))
      }
      
    } catch (error) {
      console.error("Error unsaving resource:", error)
      setError("Failed to unsave resource")
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse Resources</TabsTrigger>
          <TabsTrigger value="uploads">My Uploads</TabsTrigger>
          <TabsTrigger value="saved">Saved Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <h1 className="text-3xl font-bold mb-6">Find Teaching Resources</h1>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="computer science">Computer Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Grade Level</label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="K-2">K-2</SelectItem>
                    <SelectItem value="3-5">3-5</SelectItem>
                    <SelectItem value="6-8">6-8</SelectItem>
                    <SelectItem value="9-12">9-12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Resource Type</label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleApplyFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-6">Resources</h2>

              {resources.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <p className="text-muted-foreground">No resources found matching your criteria.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {resources.slice(0, visibleCount).map((resource) => (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource} 
                        onDownload={() => handleDownload(resource.id)}
                        onSave={() => handleSaveResource(resource.id)}
                        onUnsave={() => handleUnsaveResource(resource.id)}
                        isSaved={savedResourceIds.has(resource.id)}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={handleLoadMore}>Load More Resources</Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="uploads">
          <h1 className="text-3xl font-bold mb-6">My Uploaded Resources</h1>

          <div className="flex justify-end mb-6">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/resources/upload">Upload New Resource</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading your uploads...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {myUploads.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <p className="text-muted-foreground">You haven't uploaded any resources yet.</p>
                  <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/resources/upload">Upload Your First Resource</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {myUploads.map((resource) => (
                    <ResourceCard 
                      key={resource.id} 
                      resource={resource} 
                      showEditButtons={true}
                      onDelete={() => handleDeleteResource(resource.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="saved">
          <h1 className="text-3xl font-bold mb-6">Saved Resources</h1>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading saved resources...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {savedResources.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <p className="text-muted-foreground">You haven't saved any resources yet.</p>
                  <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/resources">Browse Resources</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {savedResources.map((resource) => (
                    <ResourceCard 
                      key={resource.id} 
                      resource={resource}
                      onDownload={() => handleDownload(resource.id)}
                      onUnsave={() => handleUnsaveResource(resource.id)}
                      isSaved={true}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ResourceCard({ resource, showEditButtons = false, onDownload, onDelete, onSave, onUnsave, isSaved = false }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            {resource.subject} • Grade {resource.grade_level}
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-1">{resource.title}</h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{resource.description}</p>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/resources/${resource.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>

            {showEditButtons ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/resources/edit/${resource.id}`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                {isSaved ? (
                  <Button variant="outline" size="sm" onClick={onUnsave}>
                    <Check className="h-4 w-4 mr-1" />
                    Saved
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={onSave}>
                    <Bookmark className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}