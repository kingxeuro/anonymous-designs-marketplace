import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // You can add auth checks here if needed
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/zip",
            "application/x-zip-compressed",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
        }
      },
      onUploadCompleted: async () => {
        // Optional: log or process after upload
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("[blob-handle] error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
