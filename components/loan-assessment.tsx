"use client"

import type { LoanAssessmentData } from "@/types/loan"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

export function LoanAssessment({ assessment }: { assessment: LoanAssessmentData }) {
  const statusVariant =
    assessment.eligibilityStatus === "approved"
      ? "default"
      : assessment.eligibilityStatus === "conditional"
      ? "secondary"
      : "destructive"

  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const handleSendNotification = async () => {
    setEmailStatus("sending")
    try {
      const endpoint =
        assessment.eligibilityStatus === "approved"
          ? "/api/notifications/send-approval"
          : "/api/notifications/send-conditional"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerEmail: assessment.borrowerInfo.email,
          borrowerName: assessment.borrowerInfo.firstName,
          loanDetails:
            assessment.eligibilityStatus === "approved"
              ? {
                  loanId: "N/A",
                  loanAmount: (assessment as unknown as { loanAmount?: number }).loanAmount ?? 300000,
                  interestRate: (assessment as unknown as { interestRate?: number }).interestRate ?? 6.5,
                  monthlyPayment: (assessment as unknown as { monthlyPayment?: number }).monthlyPayment ?? 2000,
                }
              : undefined,
          conditions:
            assessment.eligibilityStatus === "conditional" ? assessment.suggestions : undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || "Email failed")
      setEmailStatus("sent")
      toast.success(
        `${assessment.eligibilityStatus === "approved" ? "Approval" : "Conditional"} email sent to ${assessment.borrowerInfo.email}`
      )

      // Optimistically add to local notifications store
      // NOTE: EmailNotifications list hydrates from /api/notifications/history on page load
      // so this is just UI-friendly immediate feedback; persistence handled on server
    } catch {
      setEmailStatus("error")
      toast.error("Failed to send email. Please retry.")
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Loan Eligibility</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={statusVariant as 'default' | 'secondary' | 'destructive'} className={`${assessment.eligibilityStatus === "approved" ? "bg-green-500" : assessment.eligibilityStatus === "conditional" ? "bg-yellow-500" : "text-white bg-red-500"}`}>
            {assessment.eligibilityStatus.toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {assessment.eligibilityReason}
          </p>
          {assessment.eligibilityStatus !== "denied" && (
            <Button
              onClick={handleSendNotification}
              disabled={emailStatus === "sending" || emailStatus === "sent"}
              className="mt-4 w-full"
              variant={emailStatus === "sent" ? "outline" : "default"}
            >
              {emailStatus === "sending"
                ? "Sending..."
                : emailStatus === "sent"
                ? "Email Sent ✓"
                : emailStatus === "error"
                ? "Retry Email"
                : "Send Notification"}
            </Button>
          )}
          {emailStatus === "sent" && (
            <p className="text-xs text-green-600 mt-2">Notification sent to {assessment.borrowerInfo.email}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Loan-to-Value (LTV):</span>
            <span className="font-medium">{assessment.ltv}%</span>
          </div>
          <div className="flex justify-between">
            <span>Debt-to-Income (DTI):</span>
            <span className="font-medium">{assessment.dti}%</span>
          </div>
          <div className="flex justify-between">
            <span>Credit Score:</span>
            <span className="font-medium">{assessment.creditScore}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {assessment.suggestions.map((s, i) => (
              <li key={i} className="text-sm">
                • {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}


