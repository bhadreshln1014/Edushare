"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Upload,
  Mail,
  Building,
  User,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
  Info,
  Globe,
  Activity,
  LogOut,
  AlertTriangle,
  Star,
  Download,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UserSettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span>User Settings</span>
      </div>

      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-slate-50 p-6 rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    <User className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="font-medium mb-2">Profile Image</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Upload a profile picture to personalize your account
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    <Button size="sm" variant="outline">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium">
                    Username
                  </label>
                  <Input id="username" defaultValue="educator_jane" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input id="email" type="email" defaultValue="jane.doe@education.org" className="pl-10" />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="institution" className="block text-sm font-medium">
                    Institution
                  </label>
                  <div className="relative">
                    <Input id="institution" defaultValue="Springfield High School" className="pl-10" />
                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="bio" className="block text-sm font-medium">
                    Bio
                  </label>
                  <Textarea
                    id="bio"
                    defaultValue="Science teacher with 10+ years of experience specializing in biology and environmental science."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">Save Profile Information</Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>
          <div className="max-w-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="current-password" className="block text-sm font-medium">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="block text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-sm font-medium">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Update Password</Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
          <div className="max-w-2xl">
            <div className="bg-slate-50 p-6 rounded-lg mb-6">
              <div className="flex items-center mb-6">
                <Bell className="h-6 w-6 text-indigo-600 mr-3" />
                <h3 className="text-lg font-medium">Email Notifications</h3>
              </div>

              <div className="space-y-6">
                <NotificationPreference
                  icon={<MessageSquare className="h-5 w-5 text-indigo-600" />}
                  title="Resource Comments"
                  description="Receive notifications when someone comments on your resources"
                />

                <NotificationPreference
                  icon={<Star className="h-5 w-5 text-amber-500" />}
                  title="Friend Requests"
                  description="Receive notifications for new connection requests"
                />

                <NotificationPreference
                  icon={<Download className="h-5 w-5 text-blue-600" />}
                  title="Resource Updates"
                  description="Receive notifications when educators you follow upload new resources"
                />

                <NotificationPreference
                  icon={<Info className="h-5 w-5 text-gray-600" />}
                  title="Platform Announcements"
                  description="Receive notifications about EduShare updates and features"
                />
              </div>

              <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">Save Notification Settings</Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
          <div className="max-w-2xl">
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-lg">
                <div className="flex items-center mb-6">
                  <Globe className="h-6 w-6 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium">Profile Visibility</h3>
                    <p className="text-sm text-muted-foreground">Choose who can view your profile information</p>
                  </div>
                </div>

                <div className="mb-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="educators">Educators Only - Only registered educators</SelectItem>
                      <SelectItem value="connections">Connections Only - Only your connections</SelectItem>
                      <SelectItem value="private">Private - Only you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <div className="flex items-center mb-6">
                  <FileText className="h-6 w-6 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium">Resource Sharing</h3>
                    <p className="text-sm text-muted-foreground">Choose who can view your uploaded resources</p>
                  </div>
                </div>

                <div className="mb-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="educators">Educators Only - Only registered educators</SelectItem>
                      <SelectItem value="connections">Connections Only - Only your connections</SelectItem>
                      <SelectItem value="private">Private - Only you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-6 w-6 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium">Activity Tracking</h3>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your recent activity on the platform
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Privacy Settings</Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-6">Account Actions</h2>
          <div className="max-w-2xl flex gap-4">
            <Button variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-200">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function NotificationPreference({ icon, title, description }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-3">{icon}</div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch />
    </div>
  )
}
