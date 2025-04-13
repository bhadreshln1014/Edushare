"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { config } from '../../../../config'; // Adjust path as needed
import Link from "next/link"

export default function EditResourcePage({ params }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    grade_level: "",
    resource_type: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const subjectOptions = [
    "Mathematics", "Science", "English", "History", "Geography", 
    "Art", "Music", "Physical Education", "Computer Science", 
    "Foreign Languages", "Social Studies", "Other"
  ]

  const gradeLevelOptions = [
    "Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", 
    "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade",
    "9th Grade", "10th Grade", "11th Grade", "12th Grade",
    "Higher Education", "Professional Development", "All Levels"
  ]

  const resourceTypeOptions = [
    "Lesson Plan", "Worksheet", "Assessment", "Activity", 
    "Presentation", "Video", "Interactive", "Handout", "Project", "Other"
  ]

  useEffect(() => {
    fetchResourceDetails()
  }, [params.id])

  const fetchResourceDetails = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    const userString = localStorage.getItem("user")
    
    if (!token || !userString) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${params.id}/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status}`)
      }
      
      const resourceData = await response.json()
      
      // Check if current user is the owner of this resource
      const currentUser = JSON.parse(userString)
      if (resourceData.user_id !== currentUser.id) {
        setError("You don't have permission to edit this resource")
        setIsAuthorized(false)
        setLoading(false)
        return
      }
      
      // User is authorized to edit this resource
      setIsAuthorized(true)
      
      // Populate form with resource data
      setFormData({
        title: resourceData.title || "",
        description: resourceData.description || "",
        subject: resourceData.subject || "",
        grade_level: resourceData.grade_level || "",
        resource_type: resourceData.resource_type || "",
      })
      
    } catch (err) {
      console.error("Error fetching resource:", err)
      setError("Failed to load resource data")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      setSaving(false)
      return
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/resources/${params.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to update resource")
      }
      
      setSuccess(true)
      
      // Redirect to resource detail page after successful update
      setTimeout(() => {
        router.push(`/resources/${params.id}`)
      }, 1500)
      
    } catch (err) {
      console.error("Error updating resource:", err)
      setError(err.message || "Failed to update resource")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading resource data...</p>
      </div>
    )
  }

  if (error && !isAuthorized) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/resources">Back to Resources</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Resource</h1>

      <Card className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Update Resource Details</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                Resource updated successfully! Redirecting...
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Resource title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your resource..."
                value={formData.description}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(value) => handleSelectChange("subject", value)}
                  required
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade_level">Grade Level</Label>
                <Select 
                  value={formData.grade_level} 
                  onValueChange={(value) => handleSelectChange("grade_level", value)}
                  required
                >
                  <SelectTrigger id="grade_level">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resource_type">Resource Type</Label>
                <Select 
                  value={formData.resource_type} 
                  onValueChange={(value) => handleSelectChange("resource_type", value)}
                  required
                >
                  <SelectTrigger id="resource_type">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-amber-800 text-sm">Note: You cannot change the file itself. If you need to update the file, please delete this resource and upload a new one.</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/resources/${params.id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}