"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, MessageSquare, Trash2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function FindEducatorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [educators, setEducators] = useState([])
  const [connections, setConnections] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [pendingReceivedRequests, setPendingReceivedRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (activeTab === "all") {
      fetchEducators()
    } else if (activeTab === "connections") {
      fetchConnections()
    } else if (activeTab === "pending") {
      fetchPendingRequests()
    } else if (activeTab === "received") {
      fetchPendingReceivedRequests()
    }
  }, [activeTab])

  useEffect(() => {
    if (searchQuery.trim() !== "" && activeTab === "all") {
      fetchEducators()
    }
  }, [searchQuery])

  const fetchEducators = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      let endpoint = "http://localhost:8000/api/users/"
      
      if (searchQuery) {
        endpoint += `?search=${encodeURIComponent(searchQuery)}`
      }
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch educators")
      }
      
      const data = await response.json()
      
      // Fetch friendships to determine status
      const friendshipsResponse = await fetch(`http://localhost:8000/api/friendships/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!friendshipsResponse.ok) {
        throw new Error("Failed to fetch friendships")
      }
      
      const friendshipsData = await friendshipsResponse.json()
      
      // Get current user ID
      const userString = localStorage.getItem("user")
      const currentUser = JSON.parse(userString)
      
      // Map users to include friendship status
      const educatorsWithStatus = data.map(educator => {
        // Skip the current user
        if (educator.id === currentUser.id) {
          return { ...educator, status: "self" }
        }
        
        // Find friendship with this user
        const friendship = friendshipsData.find(
          f => (f.requester === educator.id && f.addressee === currentUser.id) || 
              (f.addressee === educator.id && f.requester === currentUser.id)
        )
        
        if (!friendship) {
          return { ...educator, status: "none" }
        }
        
        if (friendship.status === "accepted") {
          return { ...educator, status: "connected", friendshipId: friendship.id }
        }
        
        if (friendship.status === "pending") {
          if (friendship.requester === currentUser.id) {
            return { ...educator, status: "pending-sent", friendshipId: friendship.id }
          } else {
            return { ...educator, status: "pending-received", friendshipId: friendship.id }
          }
        }
        
        return { ...educator, status: "none" }
      })
      
      // Filter out current user
      const filteredEducators = educatorsWithStatus.filter(e => e.status !== "self")
      setEducators(filteredEducators)
      
    } catch (error) {
      console.error("Error fetching educators:", error)
      setError("Failed to load educators")
    } finally {
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
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
      
      const response = await fetch(`http://localhost:8000/api/users/${user.id}/friends/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch connections")
      }
      
      const data = await response.json()
      
      // Get friendship IDs for each connection
      const friendshipsResponse = await fetch(`http://localhost:8000/api/friendships/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!friendshipsResponse.ok) {
        throw new Error("Failed to fetch friendships")
      }
      
      const friendshipsData = await friendshipsResponse.json()
      
      // Add friendship ID to each connection
      const connectionsWithIds = data.map(connection => {
        const friendship = friendshipsData.find(
          f => (f.requester === connection.id && f.addressee === user.id) || 
              (f.addressee === connection.id && f.requester === user.id)
        )
        
        return { 
          ...connection, 
          status: "connected",
          friendshipId: friendship ? friendship.id : null
        }
      })
      
      setConnections(connectionsWithIds)
      
    } catch (error) {
      console.error("Error fetching connections:", error)
      setError("Failed to load connections")
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingRequests = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      const friendshipsResponse = await fetch(`http://localhost:8000/api/friendships/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!friendshipsResponse.ok) {
        throw new Error("Failed to fetch friendships")
      }
      
      const friendshipsData = await friendshipsResponse.json()
      const userString = localStorage.getItem("user")
      const currentUser = JSON.parse(userString)
      
      // Filter sent pending requests
      const pendingSent = friendshipsData.filter(
        f => f.requester === currentUser.id && f.status === "pending"
      )
      
      // Get user details for each pending request
      const pendingUsers = []
      
      for (const friendship of pendingSent) {
        const userResponse = await fetch(`http://localhost:8000/api/users/${friendship.addressee}/`, {
          headers: {
            Authorization: `Token ${token}`
          }
        })
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          pendingUsers.push({
            ...userData,
            status: "pending-sent",
            friendshipId: friendship.id
          })
        }
      }
      
      setPendingRequests(pendingUsers)
      
    } catch (error) {
      console.error("Error fetching pending requests:", error)
      setError("Failed to load pending requests")
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingReceivedRequests = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      setLoading(false)
      return
    }
    
    try {
      const friendshipsResponse = await fetch(`http://localhost:8000/api/friendships/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      
      if (!friendshipsResponse.ok) {
        throw new Error("Failed to fetch friendships")
      }
      
      const friendshipsData = await friendshipsResponse.json()
      const userString = localStorage.getItem("user")
      const currentUser = JSON.parse(userString)
      
      // Filter received pending requests
      const pendingReceived = friendshipsData.filter(
        f => f.addressee === currentUser.id && f.status === "pending"
      )
      
      // Get user details for each pending request
      const pendingUsers = []
      
      for (const friendship of pendingReceived) {
        const userResponse = await fetch(`http://localhost:8000/api/users/${friendship.requester}/`, {
          headers: {
            Authorization: `Token ${token}`
          }
        })
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          pendingUsers.push({
            ...userData,
            status: "pending-received",
            friendshipId: friendship.id
          })
        }
      }
      
      setPendingReceivedRequests(pendingUsers)
      
    } catch (error) {
      console.error("Error fetching received requests:", error)
      setError("Failed to load received requests")
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async (userId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/friendships/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addressee: userId })
      })
      
      if (!response.ok) {
        throw new Error("Failed to send friend request")
      }
      
      // Update the status in educators list
      setEducators(prev => 
        prev.map(educator => 
          educator.id === userId 
            ? { ...educator, status: "pending-sent" } 
            : educator
        )
      )
      
      // Refresh the pending requests list if we're on that tab
      if (activeTab === "pending") {
        fetchPendingRequests()
      }
      
    } catch (err) {
      console.error("Error sending friend request:", err)
      setError("Failed to send friend request")
    }
  }

  const handleAcceptFriendRequest = async (friendshipId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${friendshipId}/accept/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to accept friend request")
      }
      
      // Remove from received requests and refresh current tab
      setPendingReceivedRequests(prev => 
        prev.filter(request => request.friendshipId !== friendshipId)
      )
      
      // Refresh the current tab data
      if (activeTab === "all") {
        fetchEducators()
      } else if (activeTab === "connections") {
        fetchConnections()
      }
      
    } catch (err) {
      console.error("Error accepting friend request:", err)
      setError("Failed to accept friend request")
    }
  }

  const handleRejectFriendRequest = async (friendshipId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${friendshipId}/reject/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to reject friend request")
      }
      
      // Remove from received requests
      setPendingReceivedRequests(prev => 
        prev.filter(request => request.friendshipId !== friendshipId)
      )
      
      // Refresh educators list if on all tab
      if (activeTab === "all") {
        fetchEducators()
      }
      
    } catch (err) {
      console.error("Error rejecting friend request:", err)
      setError("Failed to reject friend request")
    }
  }

  const handleCancelFriendRequest = async (friendshipId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${friendshipId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to cancel friend request")
      }
      
      // Update lists
      setPendingRequests(prev => 
        prev.filter(request => request.friendshipId !== friendshipId)
      )
      
      setEducators(prev => 
        prev.map(educator => 
          educator.friendshipId === friendshipId 
            ? { ...educator, status: "none", friendshipId: null } 
            : educator
        )
      )
      
    } catch (err) {
      console.error("Error canceling friend request:", err)
      setError("Failed to cancel friend request")
    }
  }

  const handleRemoveFriend = async (friendshipId) => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setError("Authentication required")
      return
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/friendships/${friendshipId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to remove friend")
      }
      
      // Update connections list
      setConnections(prev => 
        prev.filter(connection => connection.friendshipId !== friendshipId)
      )
      
      // Update educators list if we're on that tab
      if (activeTab === "all") {
        fetchEducators()
      }
      
    } catch (err) {
      console.error("Error removing friend:", err)
      setError("Failed to remove friend")
    }
  }

  const handleSearch = () => {
    if (activeTab === "all") {
      fetchEducators()
    }
  }

  const getDisplayList = () => {
    switch (activeTab) {
      case "all":
        return educators
      case "connections":
        return connections
      case "pending":
        return pendingRequests
      case "received":
        return pendingReceivedRequests
      default:
        return []
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Find Educators</h1>
      <p className="text-muted-foreground mb-6">Connect with other educators to share resources and ideas</p>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, institution, or username"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white absolute right-1 top-1 bottom-1" 
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Educators</TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="pending">Sent Requests</TabsTrigger>
          <TabsTrigger value="received">Received Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <h2 className="text-xl font-semibold mb-6">Educators</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading educators...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : educators.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-muted-foreground">No educators found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educators.map((educator) => (
                <EducatorCard
                  key={educator.id}
                  educator={educator}
                  actionButton={
                    educator.status === "connected" ? (
                      <Button variant="secondary" disabled>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Connected
                      </Button>
                    ) : educator.status === "pending-sent" ? (
                      <Button 
                        variant="outline" 
                        onClick={() => handleCancelFriendRequest(educator.friendshipId)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Cancel Request
                      </Button>
                    ) : educator.status === "pending-received" ? (
                      <div className="flex gap-2">
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handleAcceptFriendRequest(educator.friendshipId)}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleRejectFriendRequest(educator.friendshipId)}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white" 
                        onClick={() => handleSendFriendRequest(educator.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections">
          <h2 className="text-xl font-semibold mb-6">My Connections</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading connections...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-muted-foreground">You don't have any connections yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((educator) => (
                <EducatorCard
                  key={educator.id}
                  educator={educator}
                  actionButton={
                    <div className="flex gap-2">
                      <Button asChild variant="outline">
                        <Link href={`/profile/${educator.id}`}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-red-600"
                        onClick={() => handleRemoveFriend(educator.friendshipId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          <h2 className="text-xl font-semibold mb-6">Sent Friend Requests</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading sent requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-muted-foreground">You don't have any pending sent requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.map((educator) => (
                <EducatorCard
                  key={educator.id}
                  educator={educator}
                  actionButton={
                    <Button 
                      variant="outline" 
                      onClick={() => handleCancelFriendRequest(educator.friendshipId)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Cancel Request
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received">
          <h2 className="text-xl font-semibold mb-6">Received Friend Requests</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading received requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : pendingReceivedRequests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-muted-foreground">You don't have any pending friend requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingReceivedRequests.map((educator) => (
                <EducatorCard
                  key={educator.id}
                  educator={educator}
                  actionButton={
                    <div className="flex gap-2">
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleAcceptFriendRequest(educator.friendshipId)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleRejectFriendRequest(educator.friendshipId)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EducatorCard({ educator, actionButton }) {
  return (
    <Card className="overflow-hidden bg-slate-50">
      <CardContent className="p-6">
        <Link href={`/profile/${educator.id}`} className="flex items-center gap-4 mb-4 hover:text-indigo-600 transition-colors group">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold group-hover:bg-indigo-200">
            {educator.username
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h3 className="font-semibold">{educator.username}</h3>
            <p className="text-sm text-muted-foreground group-hover:text-indigo-500">
              {educator.institution || "No institution specified"}
            </p>
          </div>
        </Link>

        {educator.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{educator.bio}</p>
        )}

        <div className="mt-4">{actionButton}</div>
      </CardContent>
    </Card>
  )
}