"use client"

import { StatusScene } from "@/components/shared/StatusScene"

export default function NotFound() {
  return (
    <StatusScene
      code="404"
      eyebrow="Frame missing"
      title="This scene isn't on the reel"
      description="The page you're looking for doesn't exist — or the movie, profile, or list has been taken offline."
      actions={[
        { label: "Back to Frameo", href: "/" },
        { label: "Explore movies", href: "/explore", variant: "secondary" },
      ]}
    />
  )
}
