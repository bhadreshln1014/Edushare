"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Check, X, MessageSquare, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function ConnectionsPage({ defaultTab = "incoming" }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [searchQuery, setSearchQuery] = useState("")
  const [incomingRequests, setIncomingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Effect to set tab from URL parameter
  useEffect(() => {
    const tabFromParams = searchParams.get('tab') || defaultTab
    const validTabs = ['incoming', 'sent', 'connected']
    
    if (validTabs.includes(tabFromParams)) {
      setActiveTab(tabFromParams)
    }
  }, [searchParams, defaultTab])

  useEffect(() => {
    const fetchConnections = async () => {
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
        // Fetch all friendships
        const friendshipsRes = await fetch('http://localhost:8000/api/friendships/', { 
          headers 
        })

        if (!friendshipsRes.ok) {
          throw new Error("Failed to fetch friendships")
        }

        const friendshipsData = await friendshipsRes.json()
        
        // Filter friendships into categories
        const incoming = friendshipsData.filter(
          fr => fr.addressee === userId && fr.status === 'pending'
        )
        const sent = friendshipsData.filter(
          fr => fr.requester === userId && fr.status === 'pending'
        )
        const connected = friendshipsData.filter(
          fr => fr.status === 'accepted' && (fr.requester === userId || fr.addressee === userId)
        )

        // Get user details for each connection type
        const processRequests = async (requests, isSent = false) => {
          return Promise.all(
            requests.map(async (request) => {
              const targetId = isSent ? request.addressee : request.requester
              const response = await fetch(`http://localhost:8000/api/users/${targetId}/`, { headers })
              
              if (!response.ok) {
                throw new Error(`Failed to fetch user ${targetId}`)
              }
              
              const userData = await response.json()
              
              return {
                id: request.id,
                userId: userData.id,
                name: userData.username,
                subject: userData.institution || "Subject",
                school: "School",
                status: isSent ? "Pending" : undefined,
                requestId: request.id
              }
            })
          )
        }

        // Process connected users
        const processConnections = async (connections) => {
          return Promise.all(
            connections.map(async (connection) => {
              // Get the ID of the connected user (not the current user)
              const friendId = connection.requester === userId ? connection.addressee : connection.requester
              const response = await fetch(`http://localhost:8000/api/users/${friendId}/`, { headers })
              
              if (!response.ok) {
                throw new Error(`Failed to fetch user ${friendId}`)
              }
              
              const userData = await response.json()
              
              return {
                id: connection.id,
                userId: userData.id,
                name: userData.username,
                subject: userData.institution || "Subject",
                school: "School",
                connectionId: connection.id
              }
            })
          )
        }

        // Fetch details for all connections
        const [incomingWithDetails, sentWithDetails, connectionsWithDetails] = await Promise.all([
          processRequests(incoming, false),
          processRequests(sent, true),
          processConnections(connected)
        ])

        setIncomingRequests(incomingWithDetails)
        setSentRequests(sentWithDetails)
        setConnections(connectionsWithDetails)
      } catch (err) {
        console.error("Error fetching connection data:", err)
        setError("Failed to load connection data.")
      } finally {
        setLoading(false)
      }
    }

    fetchConnections()
  }, [])

  const handleProfileClick = (userId) => {
    router.push(`/profile/${userId}`)
  }

  const handleAcceptRequest = async (requestId) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${requestId}/accept/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to accept request')
      
      // Update local state
      setIncomingRequests(prev => prev.filter(req => req.requestId !== requestId))
      
      // Refetch all connections to get the updated list
      const userString = localStorage.getItem("user")
      if (userString) {
        const user = JSON.parse(userString)
        const headers = { Authorization: `Token ${token}` }
        
        const friendshipsRes = await fetch('http://localhost:8000/api/friendships/', { headers })
        const friendshipsData = await friendshipsRes.json()
        
        const connected = friendshipsData.filter(
          fr => fr.status === 'accepted' && 
          (fr.requester === user.id || fr.addressee === user.id)
        )
        
        // Update the connections with user details
        const connectionsWithDetails = await Promise.all(
          connected.map(async (connection) => {
            const friendId = connection.requester === user.id ? connection.addressee : connection.requester
            const response = await fetch(`http://localhost:8000/api/users/${friendId}/`, { headers })
            const userData = await response.json()
            
            return {
              id: connection.id,
              userId: userData.id,
              name: userData.username,
              subject: userData.institution || "Subject",
              school: "School",
              connectionId: connection.id
            }
          })
        )
        
        setConnections(connectionsWithDetails)
      }
    } catch (error) {
      console.error("Error accepting request:", error)
    }
  }

  const handleRejectRequest = async (requestId) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${requestId}/reject/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to reject request')
      
      // Update local state
      setIncomingRequests(prev => prev.filter(req => req.requestId !== requestId))
    } catch (error) {
      console.error("Error rejecting request:", error)
    }
  }

  const handleCancelRequest = async (requestId) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${requestId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to cancel request')
      
      // Update local state
      setSentRequests(prev => prev.filter(req => req.requestId !== requestId))
    } catch (error) {
      console.error("Error cancelling request:", error)
    }
  }

  const handleRemoveConnection = async (connectionId) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${connectionId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to remove connection')
      
      // Update local state
      setConnections(prev => prev.filter(conn => conn.connectionId !== connectionId))
    } catch (error) {
      console.error("Error removing connection:", error)
    }
  }

  // Filter connections based on search query
  const filteredIncomingRequests = incomingRequests.filter(request =>
    request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.school.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.school.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Loading connections...</p>
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
      <h1 className="text-3xl font-bold mb-6">Friend Requests</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="incoming">Incoming Requests</TabsTrigger>
          <TabsTrigger value="sent">Sent Requests</TabsTrigger>
          <TabsTrigger value="connected">Connected Educators</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search requests"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {filteredIncomingRequests.length > 0 ? (
                filteredIncomingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <div 
                          className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-4 cursor-pointer hover:bg-indigo-200 transition-colors"
                          onClick={() => handleProfileClick(request.userId)}
                        >
                          {request.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>

                        <div 
                          className="flex-1 cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => handleProfileClick(request.userId)}
                        >
                          <h3 className="font-medium">{request.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request.subject} • {request.school}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="icon" 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => handleAcceptRequest(request.requestId)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => handleRejectRequest(request.requestId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={<UserPlus className="h-8 w-8 text-indigo-600" />}
                  title="No Incoming Requests"
                  description="When other educators send you connection requests, they will appear here."
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Sent Requests</h2>

            <div className="space-y-4">
              {sentRequests.length > 0 ? (
                sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <div 
                          className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-4 cursor-pointer hover:bg-indigo-200 transition-colors"
                          onClick={() => handleProfileClick(request.userId)}
                        >
                          {request.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>

                        <div 
                          className="flex-1 cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => handleProfileClick(request.userId)}
                        >
                          <h3 className="font-medium">{request.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request.subject} • {request.school}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{request.status}</p>
                        </div>

                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleCancelRequest(request.requestId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-indigo-600"
                    >
                      <path d="m18 16 4-4-4-4" />
                      <path d="m6 8-4 4 4 4" />
                      <path d="m14.5 4-5 16" />
                    </svg>
                  }
                  title="No Sent Requests"
                  description="You haven't sent any connection requests yet. Find educators to connect with."
                  actionButton={
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Link href="/find-educators">Find Educators</Link>
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="connected">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Connected Educators</h2>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, subject or institution"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {filteredConnections.length > 0 ? (
                filteredConnections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <div 
                          className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-4 cursor-pointer hover:bg-indigo-200 transition-colors"
                          onClick={() => handleProfileClick(connection.userId)}
                        >
                          {connection.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>

                        <div 
                          className="flex-1 cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => handleProfileClick(connection.userId)}
                        >
                          <h3 className="font-medium">{connection.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {connection.subject} • {connection.school}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button size="icon" variant="outline">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => handleRemoveConnection(connection.connectionId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-indigo-600"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                  title="No Connections Yet"
                  description="Connect with other educators to share resources and collaborate."
                  actionButton={
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Link href="/find-educators">Find Educators</Link>
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ icon, title, description, actionButton }) {
  return (
    <div className="bg-slate-50 rounded-lg p-8 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {actionButton}
    </div>
  )
}