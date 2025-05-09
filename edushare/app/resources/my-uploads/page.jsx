"use client"

import { useEffect } from "react"
import ResourcesPage from "../page"

export default function MyUploadsPage() {
  useEffect(() => {
    // Select the uploads tab via DOM after component mounts
    const uploadsTab = document.querySelector('[value="uploads"]')
    if (uploadsTab) {
      uploadsTab.click()
    }
  }, [])

  return <ResourcesPage defaultTab="uploads" />
}