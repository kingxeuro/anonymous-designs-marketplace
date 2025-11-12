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

export default function UploadDesignPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priceNonExclusive, setPriceNonExclusive] = useState("")
  const [priceExclusive, setPriceExclusive] = useState("")
  const [tags, setTags] = useState("")
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", file.name, file.type, file.size)
      setDesignFile(file)

      // Generate preview for image files
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.onerror = () => {
          setError("Failed to read image file. Please try again.")
          setDesignFile(null)
          setImagePreview(null)
        }
        reader.readAsDataURL(file)
      } else {
        // For non-image files, show file icon/placeholder
        setImagePreview(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!designFile) {
      setError("Please select a design file")
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
    formData.append("preview_file", designFile)
    formData.append("source_file", designFile)

    startTransition(async () => {
      try {
        const res = await fetch("/api/designs/submit", { method: "POST", body: formData })
        const result = await res.json().catch(() => null)

        if (!res.ok || !result?.ok) {
          const code = result?.code || "UNEXPECTED"
          const errorMessages: Record<string, string> = {
            UNAUTHENTICATED: "Please log in to upload designs.",
            VALIDATION_FAILED: result?.message || "Please check your input and try again.",
            CONFIG_ERROR: "Storage is not configured. Please contact support.",
            BLOB_UPLOAD_FAILED: "File upload failed. Try a smaller file or different format.",
            DB_INSERT_FAILED: "We couldn't save your design. Please try again.",
            UNEXPECTED: "Something went wrong. Please try again.",
          }
          const errorMsg = errorMessages[code] || result?.message || "Upload failed."
          setError(errorMsg)
          return
        }

        // Success - redirect to the design page
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push(`/marketplace/${result.data.id}`)
        router.refresh()
      } catch (err) {
        setError("Network error. Please try again.")
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
              <div className="space-y-2">
                <Label htmlFor="design_file">Design File</Label>
                {designFile ? (
                  <div className="space-y-3">
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
                            setDesignFile(null)
                            setImagePreview(null)
                          }}
                          className="absolute right-2 top-2 rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/40 bg-background/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{designFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(designFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDesignFile(null)
                              setImagePreview(null)
                            }}
                            className="rounded-full bg-background/80 p-2 backdrop-blur hover:bg-background"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="design_file"
                    className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/40 bg-background/50 transition-colors hover:border-accent/50 hover:bg-accent/5"
                  >
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload your design</span>
                    <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, PSD, AI, or other formats</span>
                    <input
                      id="design_file"
                      type="file"
                      accept="image/*,.psd,.ai,.sketch,.fig"
                      className="hidden"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
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
