"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppStore, type UploadedDocument } from "@/lib/store/app-store"
import { toast } from "sonner"



export function DocumentUpload({ onDocumentsUploaded }: { onDocumentsUploaded: (docs: UploadedDocument[]) => void }) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setAssessment, setProperty } = useAppStore()

  const analyzeFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    console.log("Processing documents...")
    const res = await fetch("/api/documents/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: base64,
        filename: file.name,
        contentType: file.type || "application/pdf",
      }),
    })
    if (!res.ok) throw new Error("Analyze failed")
    console.log("Response:", res)
    return res.json()
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsProcessing(true)
      setError(null)
      try {
        const results: UploadedDocument[] = []
        for (let i = 0; i < acceptedFiles.length; i += 1) {
          const file = acceptedFiles[i]
          setUploadProgress(Math.round(((i) / acceptedFiles.length) * 100))
          const analyzed = await analyzeFile(file)
          results.push({ id: `doc-${Date.now()}-${i}`, name: file.name, size: file.size, analysis: analyzed })
          setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))

          // If backend returned analysis, sync primary UI stores off the first doc
          try {
            const analysis = analyzed?.analysis
            if (analysis) {
              // Merge strategy: do not overwrite existing valid values
              const prevAssessment = useAppStore.getState().assessment || null
              const nextAssessment = {
                eligibilityStatus: analysis.eligibilityStatus,
                eligibilityReason: analysis.eligibilityReason,
                ltv: analysis.metrics?.ltv ?? prevAssessment?.ltv ?? 0,
                dti: analysis.metrics?.dti ?? prevAssessment?.dti ?? 0,
                creditScore:
                  (Number.isFinite(analysis.extracted?.creditScore)
                    ? analysis.extracted?.creditScore
                    : undefined) ?? prevAssessment?.creditScore ?? 720,
                suggestions: analysis.recommendations ?? prevAssessment?.suggestions ?? [],
                borrowerInfo:
                  analysis.extracted?.borrowerInfo ?? prevAssessment?.borrowerInfo ?? { firstName: "", lastName: "", email: "" },
                loanAmount: analysis.extracted?.loanAmount ?? prevAssessment?.loanAmount,
                interestRate: analysis.extracted?.interestRate ?? prevAssessment?.interestRate,
                monthlyPayment: analysis.metrics?.monthlyPayment ?? prevAssessment?.monthlyPayment,
              }
              setAssessment(nextAssessment)

              const valuation = analysis.valuation ?? {}
              const prevProperty = useAppStore.getState().property
              const nextProperty = {
                estimatedValue:
                  valuation.estimatedValue ?? prevProperty?.estimatedValue ?? analysis.extracted?.loanAmount ?? 0,
                confidence: valuation.confidence ?? prevProperty?.confidence,
                lowEstimate: valuation.lowEstimate ?? prevProperty?.lowEstimate,
                highEstimate: valuation.highEstimate ?? prevProperty?.highEstimate,
                priceHistory:
                  (Array.isArray(valuation.priceHistory) && valuation.priceHistory.length > 0
                    ? valuation.priceHistory
                    : prevProperty?.priceHistory) ?? [],
              }
              setProperty(nextProperty)
            }
          } catch {
            // Ignore store sync errors; UI can still show upload results
          }
        }
        onDocumentsUploaded(results)
        if (results.length > 0) {
          toast.success("Documents processed", {
            description: "Open the Loan Assessment, Property Analysis, and Financial Metrics tabs to view results.",
          })
        }
      } catch (e) {
        console.log("Error processing documents:", JSON.stringify(e, null, 2))
        setError("Failed to process one or more documents.")
      } finally {
        setIsProcessing(false)
      }
    },
    [onDocumentsUploaded, setAssessment, setProperty]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
    multiple: true,
  })

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle>Upload Mortgage Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className="cursor-pointer p-8 text-center rounded-md hover:bg-accent/30 transition-colors"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the documents here...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">Drag & drop mortgage documents</p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports: PDF, PNG, JPG
              </p>
              <Button type="button">Select Files</Button>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">Processing documents with AI...</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive mt-3">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}

