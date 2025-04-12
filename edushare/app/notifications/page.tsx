"use client"
import { Bell, MessageSquare, Star, Download, Users, Settings, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { config } from '../../config'; // Adjust path as needed

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700">
          Mark all as read
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <div className="space-y-4">
            {notifications
              .filter((n) => n.type === "comment")
              .map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="ratings" className="mt-6">
          <div className="space-y-4">
            {notifications
              .filter((n) => n.type === "rating")
              .map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="downloads" className="mt-6">
          <div className="space-y-4">
            {notifications
              .filter((n) => n.type === "download")
              .map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="friends" className="mt-6">
          <div className="space-y-4">
            {notifications
              .filter((n) => n.type === "friend")
              .map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="space-y-4">
            {notifications
              .filter((n) => n.type === "system")
              .map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-xl font-semibold">Email Notifications</h3>
          </div>

          <p className="text-muted-foreground mb-6">Choose which notifications you want to receive via email</p>

          <div className="space-y-6">
            <NotificationPreference
              title="Comments on my resources"
              description="Get notified when someone comments on your uploads"
            />

            <NotificationPreference
              title="Ratings on my resources"
              description="Get notified when someone rates your uploads"
            />

            <NotificationPreference
              title="Resource downloads"
              description="Get notified when your resources are downloaded"
            />

            <NotificationPreference
              title="Friend requests"
              description="Get notified about new and accepted friend requests"
            />

            <NotificationPreference
              title="System announcements"
              description="Get notified about platform updates and new features"
            />
          </div>

          <div className="mt-8">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationItem({ notification }) {
  const getIcon = (type) => {
    switch (type) {
      case "comment":
        return <MessageSquare className="h-5 w-5 text-indigo-600" />
      case "rating":
        return <Star className="h-5 w-5 text-amber-500" />
      case "download":
        return <Download className="h-5 w-5 text-blue-600" />
      case "friend":
        return <Users className="h-5 w-5 text-purple-600" />
      case "system":
        return <Settings className="h-5 w-5 text-gray-600" />
      default:
        return <Bell className="h-5 w-5 text-indigo-600" />
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className="mr-3 mt-1">{getIcon(notification.type)}</div>

          <div className="flex-1">
            <h3 className="font-medium">{notification.title}</h3>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
            {notification.type === "friend" && notification.status === "request" && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="outline">
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className="ml-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationPreference({ title, description }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch />
    </div>
  )
}

const notifications = [
  {
    id: 1,
    type: "comment",
    title: "New comment on 'Math Worksheet: Fractions'",
    message: 'Sarah Johnson: "This is exactly what I needed for my class!"',
    time: "10 minutes ago",
  },
  {
    id: 2,
    type: "rating",
    title: "New 5-star rating on 'Science Lab: Photosynthesis'",
    message: "10 minutes ago",
    time: "10 minutes ago",
  },
  {
    id: 3,
    type: "friend",
    title: "Friend request accepted",
    message: "Michael Chen is now connected with you",
    time: "1 hour ago",
    status: "accepted",
  },
  {
    id: 4,
    type: "download",
    title: "Resource downloaded",
    message: "'History Timeline: Industrial Revolution' was downloaded 5 times today",
    time: "3 hours ago",
  },
  {
    id: 5,
    type: "system",
    title: "System update",
    message: "New feature: You can now schedule resource publishing",
    time: "1 day ago",
  },
  {
    id: 6,
    type: "friend",
    title: "New friend request",
    message: "Emily Rodriguez wants to connect",
    time: "2 days ago",
    status: "request",
  },
  {
    id: 7,
    type: "download",
    title: "Resource downloaded",
    message: "'English Literature Quiz' was downloaded by James Wilson",
    time: "3 days ago",
  },
]
