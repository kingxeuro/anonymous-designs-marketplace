"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { submitDesignAction } from "@/app/actions/designs"

export default function UploadDesignPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priceNonExclusive, setPriceNonExclusive] = useState("")
  const [priceExclusive, setPriceExclusive] = useState("")
  const [tags, setTags] = useState("")
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.onerror = () => {
        setError("Failed to read image file. Please try again.")
        setPreviewFile(null)
        setImagePreview(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSourceFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!previewFile) {
      setError("Please select a preview image")
      return
    }

    if (!sourceFile) {
      setError("Please select a source file")
      return
    }

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    const nonExclusivePrice = Number.parseFloat(priceNonExclusive)
    const exclusivePrice = Number.parseFloat(priceExclusive)

    if (!priceNonExclusive || Number.isNaN(nonExclusivePrice) || nonExclusivePrice <= 0) {
      setError("Please enter a valid non-exclusive price")
      return
    }

    if (!priceExclusive || Number.isNaN(exclusivePrice) || exclusivePrice <= 0) {
      setError("Please enter a valid exclusive price")
      return
    }

    const formData = new FormData()
    formData.append("title", title.trim())
    formData.append("description", description.trim())
    formData.append("price_non_exclusive", nonExclusivePrice.toString())
    formData.append("price_exclusive", exclusivePrice.toString())
    formData.append("tags", tags.trim())
    formData.append("preview_file", previewFile)
    formData.append("source_file", sourceFile)

    startTransition(async () => {
      console.log("[v0] Submitting design upload...")

      try {
        const result = await submitDesignAction(formData)

        console.log("[v0] Upload result:", result)

        if (!result) {
          console.error("[v0] No result returned from server action")
          setError("No response from server. Please try again.")
          return
        }

        if (result.ok) {
          console.log("[v0] Upload successful, design ID:", result.data.id)
          await new Promise((resolve) => setTimeout(resolve, 1000))
          router.push(`/marketplace/${result.data.id}`)
          router.refresh()
        } else {
          const errorMessages: Record<string, string> = {
            UNAUTHENTICATED: "🔒 Please log in to upload designs.",
            VALIDATION_FAILED: `⚠️ ${result.message}`,
            CONFIG_ERROR: "⚙️ Storage is not configured. Contact support.",
            BLOB_UPLOAD_FAILED: "📁 File upload failed. Try smaller files or another format.",
            DB_INSERT_FAILED: "💾 We couldn't save your design. Try again shortly.",
            UNEXPECTED: "❌ Something went wrong while uploading.",
          }
          const errorMsg = errorMessages[result.code] || result.message || "Upload failed."
          console.log("[v0] Upload failed:", { code: result.code, message: result.message })
          setError(errorMsg)
        }
      } catch (err) {
        console.error("[v0] Client-side error calling server action:", err)
        setError(
          err instanceof Error ? `Upload failed: ${err.message}` : "An unexpected error occurred. Please try again.",
        )
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Upload Design</h1>
          <p className="mt-2 text-muted-foreground">Submit your design for review and approval</p>
        </div>

        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Design Details</CardTitle>
            <CardDescription>Provide information about your design and set your pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Preview Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="preview_file">Preview Image</Label>
                {imagePreview ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border/40">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewFile(null)
                        setImagePreview(null)
                      }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="preview_file"
                    className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 bg-background/50 transition-colors hover:border-accent/50 hover:bg-accent/5"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload preview image</span>
                    <input
                      id="preview_file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      required
                    />
                  </label>
                )}
              </div>

              {/* Source File Upload */}
              <div className="space-y-2">
                <Label htmlFor="source_file">Source File</Label>
                <Input
                  id="source_file"
                  type="file"
                  onChange={handleSourceChange}
                  required
                  className="bg-background/50"
                />
                {sourceFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {sourceFile.name} ({(sourceFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter design title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your design..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceNonExclusive">Non-Exclusive Price ($)</Label>
                  <Input
                    id="priceNonExclusive"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="49.99"
                    value={priceNonExclusive}
                    onChange={(e) => setPriceNonExclusive(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Multiple buyers can purchase</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceExclusive">Exclusive Buyout Price ($)</Label>
                  <Input
                    id="priceExclusive"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="499.99"
                    value={priceExclusive}
                    onChange={(e) => setPriceExclusive(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">One buyer gets full rights</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="streetwear, minimal, typography"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Uploading..." : "Submit for Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
