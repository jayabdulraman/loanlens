import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          LoanLens
        </h1>
        <h4 className="text-2xl md:text-2xl font-bold tracking-tight">
          Mortgage Document Intelligence
        </h4>
        <p className="text-muted-foreground text-lg md:text-xl">
          Upload mortgage documents, get instant AI-driven assessments, and automate borrower notifications.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
