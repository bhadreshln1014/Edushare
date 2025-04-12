"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Folder, FolderPlus, FileText, Eye, Download, Share2, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { config } from '../../../config'; // Adjust path as needed

export default function SavedResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/resources" className="hover:text-foreground">
          Resources
        </Link>
        <span className="mx-2">›</span>
        <span>Saved Resources</span>
      </div>

      <Tabs defaultValue="saved">
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse Resources</TabsTrigger>
          <TabsTrigger value="uploads">My Uploads</TabsTrigger>
          <TabsTrigger value="saved">Saved Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="saved">
          <h1 className="text-3xl font-bold mb-6">My Saved Resources</h1>

          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by title, subject, or uploader"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Filters & Sorting</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Grade Level</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="k-2">K-2</SelectItem>
                    <SelectItem value="3-5">3-5</SelectItem>
                    <SelectItem value="6-8">6-8</SelectItem>
                    <SelectItem value="9-12">9-12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Resource Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="worksheet">Worksheets</SelectItem>
                    <SelectItem value="presentation">Presentations</SelectItem>
                    <SelectItem value="activity">Activities</SelectItem>
                    <SelectItem value="assessment">Assessments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Saved: Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-newest">Date Saved: Newest</SelectItem>
                    <SelectItem value="date-oldest">Date Saved: Oldest</SelectItem>
                    <SelectItem value="title-az">Title: A-Z</SelectItem>
                    <SelectItem value="title-za">Title: Z-A</SelectItem>
                    <SelectItem value="rating-high">Rating: Highest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Collections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="bg-slate-50">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Folder className="h-12 w-12 text-indigo-600 mb-4" />
                      <h3 className="font-semibold mb-1">{collection.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{collection.count} items</p>
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Saved Resources (42)</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Resource</th>
                    <th className="text-left py-3 px-4 font-medium">Subject</th>
                    <th className="text-left py-3 px-4 font-medium">Grades</th>
                    <th className="text-center py-3 px-4 font-medium">Rating</th>
                    <th className="text-left py-3 px-4 font-medium">Saved</th>
                    <th className="text-center py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedResources.map((resource) => (
                    <tr key={resource.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-indigo-600 mr-3" />
                          <span className="font-medium">{resource.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{resource.subject}</td>
                      <td className="py-3 px-4">Grades {resource.grades}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="#f59e0b"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {resource.rating}
                        </div>
                      </td>
                      <td className="py-3 px-4">{resource.saved}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Share">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Add to Collection</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-8">
              <Button variant="outline">Load More</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const collections = [
  { id: 1, name: "All Resources", count: 42 },
  { id: 2, name: "Math Resources", count: 15 },
  { id: 3, name: "Science Projects", count: 8 },
  { id: 4, name: "Reading Materials", count: 12 },
]

const savedResources = [
  {
    id: 1,
    title: "Algebra Fundamentals Worksheet",
    subject: "Math",
    grades: "9-10",
    rating: "4.8",
    saved: "2 days ago",
  },
  {
    id: 2,
    title: "Cell Biology Presentation",
    subject: "Science",
    grades: "11-12",
    rating: "4.6",
    saved: "3 days ago",
  },
  {
    id: 3,
    title: "American Revolution Timeline",
    subject: "History",
    grades: "7-8",
    rating: "4.9",
    saved: "1 week ago",
  },
  {
    id: 4,
    title: "Grammar Quiz Bundle",
    subject: "English",
    grades: "5-6",
    rating: "4.7",
    saved: "2 weeks ago",
  },
  {
    id: 5,
    title: "Photosynthesis Video Series",
    subject: "Science",
    grades: "6-8",
    rating: "4.5",
    saved: "3 weeks ago",
  },
  {
    id: 6,
    title: "Creative Writing Prompts",
    subject: "English",
    grades: "9-12",
    rating: "4.8",
    saved: "1 month ago",
  },
  {
    id: 7,
    title: "Chemistry Lab Activities",
    subject: "Science",
    grades: "10-12",
    rating: "4.9",
    saved: "1 month ago",
  },
  {
    id: 8,
    title: "Geometry Problem Set",
    subject: "Math",
    grades: "8-9",
    rating: "4.7",
    saved: "2 months ago",
  },
]
