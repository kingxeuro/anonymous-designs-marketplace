export default function UploadSuccessPage() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <span className="text-xl text-green-700">✓</span>
      </div>
      <h1 className="text-xl font-semibold">Submission received</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Your design is now <span className="font-medium">pending review</span>. You'll see it in your dashboard. Once an
        admin approves it, it will appear in the marketplace.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <a href="/dashboard/designer" className="rounded-lg border px-4 py-2 text-sm">
          Go to dashboard
        </a>
        <a href="/marketplace" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
          View marketplace
        </a>
      </div>
    </div>
  )
}
