"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

export default function PublicLinkButton({ slug }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const url = `${window.location.origin}/portal/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button
      onClick={copyLink}
      size="sm"
      variant="outline"
      className="text-xs"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          Копирано!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          Копирай линк за жители
        </>
      )}
    </Button>
  )
}

