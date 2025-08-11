"use client"

import { useEffect } from "react"
import { DocumentUpload } from "@/components/document-upload"
import { LoanAssessment } from "@/components/loan-assessment"
import { PropertyValuation } from "@/components/property-valuation"
import { FinancialMetrics } from "@/components/financial-metrics"
import { EmailNotifications } from "@/components/email-notifications"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/store/app-store"

export default function Dashboard() {
  const { setUploadedDocuments, assessment, setAssessment, property, setProperty } = useAppStore()

  // Live mode: hydrate last analysis from Upstash on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/analysis/latest', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const a = data?.analysis
        if (!a) return
        setAssessment({
          eligibilityStatus: a.eligibilityStatus,
          eligibilityReason: a.eligibilityReason,
          ltv: a.metrics?.ltv ?? 0,
          dti: a.metrics?.dti ?? 0,
          creditScore: a.extracted?.creditScore ?? 720,
          suggestions: a.recommendations ?? [],
          borrowerInfo: a.extracted?.borrowerInfo ?? { firstName: '', lastName: '', email: '' },
          loanAmount: a.extracted?.loanAmount,
          interestRate: a.extracted?.interestRate,
          monthlyPayment: a.metrics?.monthlyPayment,
        })

        setProperty({
          estimatedValue: a.valuation?.estimatedValue ?? a.extracted?.loanAmount ?? 0,
          confidence: a.valuation?.confidence,
          lowEstimate: a.valuation?.lowEstimate,
          highEstimate: a.valuation?.highEstimate,
          priceHistory: a.valuation?.priceHistory ?? [],
        })
      } catch {}
    }
    load()
  }, [setAssessment, setProperty])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">LoanLens - Assess Faster, Get Approved!</h1>
        <p className="text-muted-foreground">AI-powered mortgage loan assessment with automated notifications</p>
      </header>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="assessment">Loan Assessment</TabsTrigger>
          <TabsTrigger value="property">Property Analysis</TabsTrigger>
          <TabsTrigger value="metrics">Financial Metrics</TabsTrigger>
          <TabsTrigger value="notifications">Email Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <DocumentUpload onDocumentsUploaded={(docs) => setUploadedDocuments(docs)} />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          {assessment && <LoanAssessment assessment={assessment} />}
        </TabsContent>

        <TabsContent value="property" className="space-y-6">
          {property && <PropertyValuation property={property} />}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {assessment && (
            <FinancialMetrics
              metrics={{
                ltv: assessment.ltv,
                dti: assessment.dti,
                housingRatio: 31, // demo value; wire from analyzer when available
                piti: assessment.monthlyPayment,
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <EmailNotifications />
        </TabsContent>
      </Tabs>
    </div>
  )
}


