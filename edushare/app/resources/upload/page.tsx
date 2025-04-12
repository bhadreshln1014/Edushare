"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Eye, File, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { config } from '../../../config'; // Adjust path as needed

export default function UploadResourcePage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [resourceType, setResourceType] = useState("")
  
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      
      // Create file preview if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        // For non-image files, just show the file name
        setFilePreview(null)
      }
    } else {
      setSelectedFile(null)
      setFilePreview(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      
      // Create file preview if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        // For non-image files, just show the file name
        setFilePreview(null)
      }
      
      // Update the file input for form submission
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
      }
    }
  }

  const uploadResource = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!title || !description || !subject || !gradeLevel || !resourceType || !selectedFile) {
      setUploadError("Please fill in all fields and select a file")
      return
    }
    
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)
    
    try {
      const userString = localStorage.getItem("user")
      const token = localStorage.getItem("token")
      
      if (!userString || !token) {
        setUploadError("User authentication required")
        setIsUploading(false)
        return
      }
      
      // Create FormData object
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('subject', subject)
      formData.append('grade_level', gradeLevel)
      formData.append('resource_type', resourceType)
      formData.append('file', selectedFile)
      
      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadSuccess(true)
          
          // Redirect to resources page after successful upload
          setTimeout(() => {
            router.push('/resources?tab=uploads')
          }, 2000)
        } else {
          let errorMessage
          try {
            const response = JSON.parse(xhr.responseText)
            errorMessage = response.detail || "Upload failed. Please try again."
          } catch (e) {
            errorMessage = "Upload failed. Please try again."
          }
          setUploadError(errorMessage)
        }
        setIsUploading(false)
      })
      
      xhr.addEventListener('error', () => {
        setUploadError("Network error. Please check your connection and try again.")
        setIsUploading(false)
      })
      
      xhr.open('POST', `${config.apiUrl}/api/resources/`)
      xhr.setRequestHeader('Authorization', `Token ${token}`)
      
      xhr.send(formData)
      
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError("Failed to upload resource. Please try again.")
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/resources" className="hover:text-foreground">
          Resources
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span>Upload Resource</span>
      </div>

      <h1 className="text-3xl font-bold mb-8">Upload New Resource</h1>

      {uploadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {uploadSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">Resource uploaded successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      <form onSubmit={uploadResource}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <Card 
              className="bg-slate-50 relative" 
              onDragOver={handleDragOver} 
              onDrop={handleDrop}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                <File className="h-8 w-8 text-indigo-600 mb-4" />
                <h2 className="text-xl font-semibold mb-2">File Upload</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedFile ? `Selected: ${selectedFile.name}` : "Drag and drop your file here, or click to browse"}
                </p>
                <div className="relative">
                  <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Browse Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6">Resource Information</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter resource title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your resource" 
                  className="min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="physical education">Physical Education</SelectItem>
                    <SelectItem value="computer science">Computer Science</SelectItem>
                    <SelectItem value="languages">Languages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="K-2">K-2</SelectItem>
                    <SelectItem value="3-5">3-5</SelectItem>
                    <SelectItem value="6-8">6-8</SelectItem>
                    <SelectItem value="9-12">9-12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Resource Type</Label>
                <Select value={resourceType} onValueChange={setResourceType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-6">File Preview</h2>

            <Card className="bg-slate-50 mb-6 overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="max-w-full max-h-[180px] object-contain" />
                ) : selectedFile ? (
                  <div className="text-center">
                    <File className="h-8 w-8 text-indigo-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">{selectedFile.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <Eye className="h-8 w-8 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-1">No preview available</h3>
                    <p className="text-sm text-muted-foreground text-center">Preview will be shown here after file upload</p>
                  </>
                )}
              </CardContent>
            </Card>

            <h2 className="text-xl font-semibold mb-4">Upload Progress</h2>

            <Card className="bg-slate-50">
              <CardContent className="p-6">
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-medium">{uploadProgress}%</span>
                  <span className="text-sm text-muted-foreground">
                    {isUploading ? "Uploading..." : uploadProgress === 100 ? "Complete" : "Ready to upload"}
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" asChild>
            <Link href="/resources">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white" 
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Resource"}
          </Button>
        </div>
      </form>
    </div>
  )
}