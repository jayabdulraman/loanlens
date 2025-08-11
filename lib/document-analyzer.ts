import { TextractParser, type ExtractedData } from "@/lib/document-parsers/textract-parser"
import { OpenAIPdfParser } from "@/lib/document-parsers/openai-pdf-parser"
import { PropertyValuationService } from "@/lib/apis/property-valuation"
import { DEFAULT_MORTGAGE_CRITERIA } from "@/constants/mortgage-criteria"
import { sendConditionalApprovalEmail, sendLoanApprovalEmail } from "@/lib/composio/gmail-client"

export type EligibilityStatus = "approved" | "conditional" | "denied"

export interface LoanMetrics {
  ltv: number
  dti: number
  housingRatio: number
  piti: number
  monthlyPayment: number
}

export interface DocumentAnalysis {
  extracted: ExtractedData
  valuation?: { estimatedValue: number } & Record<string, unknown>
  metrics: LoanMetrics
  eligibilityStatus: EligibilityStatus
  eligibilityReason: string
  recommendations: string[]
}

export class DocumentAnalyzer {
  async analyzeFromUrl(params: {
    url: string
    addressOverride?: string
    notify?: boolean
  }): Promise<DocumentAnalysis> {
    const { url, addressOverride, notify } = params
    // Simplified: let OpenAI fetch the URL directly
    const ai = new OpenAIPdfParser()
    const extracted = await ai.parseDocumentFromUrl(url)

    const valuationSvc = new PropertyValuationService()
    let valuation: { estimatedValue?: number; confidence?: number; lowEstimate?: number; highEstimate?: number } | undefined
    let priceHistory: Array<{ month: string; value: number }> | undefined
    const address = addressOverride || extracted.propertyAddress
    if (address) {
      try {
        // Fetch valuation once
        valuation = await valuationSvc.getPropertyValue(address)
        // Fetch sales history separately for price trend
        priceHistory = await valuationSvc.getSalesHistory(address)
      } catch {
        valuation = undefined
        priceHistory = undefined
      }
    }

    const metrics = this.calculateLoanMetrics(extracted, valuation?.estimatedValue)
    const credit = Number.isFinite(extracted.creditScore as number) && (extracted.creditScore as number) > 0
      ? (extracted.creditScore as number)
      : 720
    const { status, reason } = this.assessEligibility(metrics, credit)
    const recommendations = this.generateRecommendations(metrics, credit)

    const analysis: DocumentAnalysis = {
      extracted,
      valuation: {
        estimatedValue: valuation?.estimatedValue ?? extracted.loanAmount,
        priceHistory:
          (priceHistory && priceHistory.length > 0
            ? priceHistory
            : this.generateSyntheticHistory((valuation?.estimatedValue ?? extracted.loanAmount) || 300000)),
      },
      metrics,
      eligibilityStatus: status,
      eligibilityReason: reason,
      recommendations,
    }

    if (notify) {
      await this.handleNotification(analysis)
    }

    // Save the most recent analysis for UI retrieval
    try {
      const { setJSON, lpushJSON } = await import('./upstash')
      const key = `analysis:latest`
      await setJSON(key, analysis)
      await lpushJSON('analysis:history', { ...analysis, createdAt: new Date().toISOString() })
    } catch {}

    return analysis
  }
  async analyzeBytes(params: {
    bytes: Buffer
    addressOverride?: string
    notify?: boolean
  }): Promise<DocumentAnalysis> {
    const { bytes, addressOverride, notify } = params

    let extracted: ExtractedData
    try {
      // Try OpenAI PDF parser first
      const ai = new OpenAIPdfParser()
      extracted = await ai.parseDocument(bytes)
    } catch {
      // Fallback to Textract if configured
      const parser = new TextractParser()
      extracted = await parser.parseDocument(bytes)
    }

    const valuationSvc = new PropertyValuationService()
    let valuation: { estimatedValue?: number; confidence?: number; lowEstimate?: number; highEstimate?: number } | undefined
    const address = addressOverride || extracted.propertyAddress
    if (address) {
      try {
        valuation = await valuationSvc.getPropertyValue(address)
      } catch {
        valuation = undefined
      }
    }

    const metrics = this.calculateLoanMetrics(extracted, valuation?.estimatedValue)
    const { status, reason } = this.assessEligibility(metrics, extracted.creditScore)
    const recommendations = this.generateRecommendations(metrics, extracted.creditScore)

    const analysis: DocumentAnalysis = {
      extracted,
      valuation: valuation ? {
        estimatedValue: valuation.estimatedValue ?? extracted.loanAmount ?? 300000,
        confidence: valuation.confidence,
        lowEstimate: valuation.lowEstimate,
        highEstimate: valuation.highEstimate,
      } : undefined,
      metrics,
      eligibilityStatus: status,
      eligibilityReason: reason,
      recommendations,
    }

    if (notify) {
      await this.handleNotification(analysis)
    }

    return analysis
  }

  private calculateLoanMetrics(data: ExtractedData, estimatedValue?: number): LoanMetrics {
    const propertyValue = estimatedValue ?? Math.max(1, data.loanAmount)
    const ltv = (data.loanAmount / propertyValue) * 100
    // Fallbacks if parser missed monthlyIncome or monthlyDebtPayments
    const monthlyIncome = Math.max(1, data.monthlyIncome || 8000)
    const monthlyDebtPayments = data.monthlyDebtPayments || Math.round((data.loanAmount / 1000) * 30)
    const dti = (monthlyDebtPayments / monthlyIncome) * 100
    const monthlyPayment = this.calculateMonthlyPayment(data)
    const principalAndInterest = data.principalAndInterest || monthlyPayment
    const propertyTax = data.propertyTax || Math.round((propertyValue / 12) * 0.001)
    const insurance = data.insurance || 100
    const piti = principalAndInterest + propertyTax + insurance
    const housingRatio = (piti / monthlyIncome) * 100
    return {
      ltv: this.round2(ltv),
      dti: this.round2(dti),
      housingRatio: this.round2(housingRatio),
      piti: Math.round(piti),
      monthlyPayment,
    }
  }

  private calculateMonthlyPayment(data: ExtractedData): number {
    const principal = data.loanAmount
    const monthlyRate = (data.interestRate || 0) / 100 / 12
    const numberOfPayments = (data.loanTerm || 30) * 12
    if (monthlyRate === 0) return Math.round(principal / numberOfPayments)
    const monthlyPayment =
      principal *
      ((monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1))
    return Math.round(monthlyPayment)
  }

  private assessEligibility(metrics: LoanMetrics, creditScore?: number) {
    const { maxLtvPercent, maxDtiPercent, minCreditScore } = DEFAULT_MORTGAGE_CRITERIA
    const meets =
      metrics.ltv <= maxLtvPercent &&
      metrics.dti <= maxDtiPercent &&
      (creditScore ?? 0) >= minCreditScore

    if (meets) {
      return { status: "approved" as EligibilityStatus, reason: "All metrics within lender thresholds" }
    }

    const near =
      metrics.ltv <= maxLtvPercent + 5 ||
      metrics.dti <= maxDtiPercent + 5 ||
      (creditScore ?? 0) >= minCreditScore - 20
    if (near) {
      return {
        status: "conditional" as EligibilityStatus,
        reason: "Close to thresholds; additional documentation required",
      }
    }

    return { status: "denied" as EligibilityStatus, reason: "Key metrics outside lender thresholds" }
  }

  private generateRecommendations(metrics: LoanMetrics, creditScore?: number): string[] {
    const recs: string[] = []
    if (metrics.ltv > DEFAULT_MORTGAGE_CRITERIA.maxLtvPercent) {
      recs.push("Consider a larger down payment or lower loan amount")
    }
    if (metrics.dti > DEFAULT_MORTGAGE_CRITERIA.maxDtiPercent) {
      recs.push("Reduce monthly debts or increase verifiable income")
    }
    if ((creditScore ?? 850) < DEFAULT_MORTGAGE_CRITERIA.minCreditScore) {
      recs.push("Provide credit history explanations or improve credit score")
    }
    return recs
  }

  private async handleNotification(analysis: DocumentAnalysis) {
    const borrowerEmail = analysis.extracted.borrowerInfo.email
    const borrowerName = analysis.extracted.borrowerInfo.firstName
    if (!borrowerEmail || !borrowerName) return

    if (analysis.eligibilityStatus === "approved") {
      await sendLoanApprovalEmail(borrowerEmail, borrowerName, {
        loanId: "N/A",
        loanAmount: analysis.extracted.loanAmount,
        interestRate: analysis.extracted.interestRate,
        loanTerm: analysis.extracted.loanTerm ?? 30,
        monthlyPayment: analysis.metrics.monthlyPayment,
        propertyAddress: analysis.extracted.propertyAddress,
        ltv: analysis.metrics.ltv,
        dti: analysis.metrics.dti,
        creditScore: analysis.extracted.creditScore,
      })
    } else if (analysis.eligibilityStatus === "conditional") {
      await sendConditionalApprovalEmail(borrowerEmail, borrowerName, analysis.recommendations)
    }
  }

  private round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

  private generateSyntheticHistory(baseline: number): Array<{ month: string; value: number }> {
    const base = Math.max(100000, baseline || 300000)
    const months: Array<{ month: string; value: number }> = []
    const now = new Date()
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const drift = 1 + (Math.sin(i / 2) * 0.02 + i * 0.001)
      months.push({
        month: d.toLocaleString("en", { month: "short", year: "numeric" }),
        value: Math.round(base * drift),
      })
    }
    return months
  }
}


