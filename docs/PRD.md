## Detailed Project Specification

### 🎯 Project Overview
Build a Next.js application that processes mortgage documents using AI-powered OCR and provides instant loan assessments with LTV calculations, eligibility analysis, and improvement suggestions. This project directly aligns with Addy AI's core business of automating mortgage document processing.

---

## 🏗️ Technical Stack

### Core Framework
- **Frontend**: Next.js 14 (App Router)
- **UI Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for global state
- **Form Handling**: React Hook Form + Zod validation
- **File Upload**: react-dropzone + Next.js API routes

### Backend & APIs
- **Runtime**: Node.js with Edge Runtime where possible
- **Database**: Upstash Redis for caching + document metadata storage
- **File Storage**: Vercel Blob for document storage
- **Email Automation**: Composio Gmail MCP for automated notifications
- **Authentication**: NextAuth.js (optional for demo)

---

## 🔧 Phase-by-Phase Development Plan

## Phase 1: Project Setup & Foundation (Day 1)

### 1.1 Project Initialization

**Project root:** loanlens (already setup nextjs, shadcn, tailwindcss, typescript project)

```bash
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar
npm install @radix-ui/react-button @radix-ui/react-card @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-input @radix-ui/react-label
npm install @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-separator
npm install @radix-ui/react-table @radix-ui/react-tabs @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install react-hook-form @hookform/resolvers zod
npm install react-dropzone zustand
npm install @vercel/blob @upstash/redis
npm install recharts date-fns
npm install composio-core openai
npm install @aws-sdk/client-textract
npm install @vercel/blob
```

### 1.2 shadcn/ui Setup
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label progress select table tabs toast
npx shadcn-ui@latest add accordion alert-dialog avatar dialog dropdown-menu separator
```

### 1.3 Project Structure
```

app/
├── api/
│   ├── documents/
│   │   ├── upload/route.ts
│   │   ├── process/route.ts
│   │   └── analyze/route.ts
│   ├── property-valuation/route.ts
│   ├── loan-assessment/route.ts
│   └── notifications/
│       ├── send-approval/route.ts
│       └── send-conditional/route.ts
├── dashboard/
│   ├── page.tsx
│   └── layout.tsx
├── globals.css
├── layout.tsx
└── page.tsx
components/
├── ui/ (shadcn components)
├── document-upload.tsx
├── document-processor.tsx
├── loan-assessment.tsx
├── property-valuation.tsx
└── financial-metrics.tsx
lib/
├── utils.ts
├── validations.ts
├── document-parsers/
├── apis/
├── email-templates/
├── composio/
└── store/
types/
├── document.ts
├── loan.ts
└── property.ts
constants└── mortgage-criteria.ts
```

---

## Phase 2: Document Processing Infrastructure (Days 2-3)

### 2.1 MCP Tools & API Integration

#### Primary OCR/Document Processing APIs
1. **Amazon Textract** (Primary choice)
   - **Why**: Specifically designed for financial documents
   - **Features**: Form extraction, table parsing, signature detection
   - **Pricing**: $1.50 per 1,000 pages
   - **MCP Integration**: Direct AWS SDK integration

#### Property Valuation APIs
1. **RentCast API** (Primary choice)
   - **Features**: AVM (Automated Valuation Model), comparables, market trends
   - **Data**: 140M+ property records
   - **Pricing**: $0.10-$0.50 per call
   - **Free Tier**: 50 calls/month

#### Email Automation APIs
1. **Composio Gmail MCP** (Primary choice)
   - **Why**: Direct Gmail integration with MCP protocol
   - **Features**: Send emails, templates, attachments, tracking
   - **Authentication**: OAuth2 with Google
   - **MCP Integration**: Native Composio MCP server

### 2.2 Composio Gmail MCP Setup

```typescript
// lib/composio/gmail-client.ts
import { ComposioToolSet } from "composio-core";

export class ComposioGmailClient {
  private composio: ComposioToolSet;

  constructor() {
    this.composio = new ComposioToolSet({
      apiKey: process.env.COMPOSIO_API_KEY!,
    });
  }

  async initializeGmailConnection(userEmail: string) {
    // Initialize Gmail connection for the user
    const connection = await this.composio.initiateConnection(
      "gmail",
      userEmail,
      {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/composio/callback`,
      }
    );
    
    return connection;
  }

  async sendLoanApprovalEmail(
    recipientEmail: string,
    borrowerName: string,
    loanDetails: LoanApprovalDetails
  ): Promise<EmailSendResult> {
    const emailTemplate = this.generateApprovalEmailTemplate(borrowerName, loanDetails);
    
    const result = await this.composio.executeAction("gmail", "send_email", {
      to: recipientEmail,
      subject: `🎉 Great News! Your Loan Application Has Been Approved`,
      body: emailTemplate.html,
      bodyType: "html",
    });

    return result;
  }

  async sendConditionalApprovalEmail(
    recipientEmail: string,
    borrowerName: string,
    conditions: string[]
  ): Promise<EmailSendResult> {
    const emailTemplate = this.generateConditionalEmailTemplate(borrowerName, conditions);
    
    const result = await this.composio.executeAction("gmail", "send_email", {
      to: recipientEmail,
      subject: `📋 Your Loan Application Status Update - Action Required`,
      body: emailTemplate.html,
      bodyType: "html",
    });

    return result;
  }

  private generateApprovalEmailTemplate(borrowerName: string, loanDetails: LoanApprovalDetails) {
    return {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Loan Approval Notification</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
            .highlight { background: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
            .loan-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .btn { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations ${borrowerName}!</h1>
              <h2>Your Loan Application Has Been Approved</h2>
            </div>
            
            <div class="content">
              <div class="highlight">
                <strong>Great news!</strong> Your mortgage application has been approved and you're one step closer to owning your new home.
              </div>
              
              <p>Dear ${borrowerName},</p>
              
              <p>We're excited to inform you that your loan application has been <strong>approved</strong>! Our AI-powered document analysis system has successfully processed your application and determined that you meet all our lending criteria.</p>
              
              <div class="loan-details">
                <h3>📋 Loan Details</h3>
                <div class="detail-row">
                  <span><strong>Loan Amount:</strong></span>
                  <span>${loanDetails.loanAmount.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Interest Rate:</strong></span>
                  <span>${loanDetails.interestRate}%</span>
                </div>
                <div class="detail-row">
                  <span><strong>Loan Term:</strong></span>
                  <span>${loanDetails.loanTerm} years</span>
                </div>
                <div class="detail-row">
                  <span><strong>Monthly Payment:</strong></span>
                  <span>${loanDetails.monthlyPayment.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Property Address:</strong></span>
                  <span>${loanDetails.propertyAddress}</span>
                </div>
              </div>
              
              <h3>📊 Key Metrics That Led to Approval</h3>
              <ul>
                <li><strong>Loan-to-Value (LTV):</strong> ${loanDetails.ltv}% ✓</li>
                <li><strong>Debt-to-Income (DTI):</strong> ${loanDetails.dti}% ✓</li>
                <li><strong>Credit Score:</strong> ${loanDetails.creditScore} ✓</li>
              </ul>
              
              <h3>🚀 Next Steps</h3>
              <ol>
                <li>Review the attached loan terms and conditions</li>
                <li>Schedule a closing appointment with our team</li>
                <li>Coordinate with your real estate agent</li>
                <li>Prepare for final walkthrough and closing</li>
              </ol>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/loan/${loanDetails.loanId}" class="btn">
                View Full Loan Details
              </a>
              
              <p>If you have any questions, please don't hesitate to contact our loan specialists at <a href="mailto:loans@addyai.com">loans@addyai.com</a> or call us at (555) 123-4567.</p>
              
              <p>Congratulations again on your approval!</p>
              
              <p>Best regards,<br>
              <strong>The Addy AI Lending Team</strong></p>
            </div>
            
            <div class="footer">
              <p>This email was automatically generated by our AI-powered loan processing system.</p>
              <p>© 2025 Addy AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  private generateConditionalEmailTemplate(borrowerName: string, conditions: string[]) {
    return {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Conditional Loan Approval</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
            .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .conditions { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .condition-item { background: white; padding: 15px; margin: 10px 0; border-left: 3px solid #ffc107; border-radius: 4px; }
            .btn { background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Conditional Approval</h1>
              <h2>Action Required on Your Loan Application</h2>
            </div>
            
            <div class="content">
              <div class="highlight">
                <strong>Good news!</strong> Your loan application has been conditionally approved. Please review the conditions below to complete your approval.
              </div>
              
              <p>Dear ${borrowerName},</p>
              
              <p>Thank you for your mortgage application. Our AI-powered system has reviewed your documents and we're pleased to offer you a <strong>conditional approval</strong>.</p>
              
              <p>This means you're very close to final approval! You just need to satisfy the following conditions:</p>
              
              <div class="conditions">
                <h3>📋 Required Actions</h3>
                ${conditions.map((condition, index) => `
                  <div class="condition-item">
                    <strong>${index + 1}.</strong> ${condition}
                  </div>
                `).join('')}
              </div>
              
              <h3>⏰ Timeline</h3>
              <p>Please provide the requested information within <strong>30 days</strong> to maintain your interest rate lock and proceed to closing.</p>
              
              <h3>📞 Need Help?</h3>
              <p>Our loan specialists are here to guide you through each condition. Contact us at:</p>
              <ul>
                <li>Email: <a href="mailto:loans@addyai.com">loans@addyai.com</a></li>
                <li>Phone: (555) 123-4567</li>
                <li>Online: Upload documents directly to your dashboard</li>
              </ul>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conditions" class="btn">
                Upload Required Documents
              </a>
              
              <p>We're committed to helping you achieve homeownership and look forward to your final approval!</p>
              
              <p>Best regards,<br>
              <strong>The Addy AI Lending Team</strong></p>
            </div>
            
            <div class="footer">
              <p>This email was automatically generated by our AI-powered loan processing system.</p>
              <p>© 2025 Addy AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
}

```typescript
// lib/document-parsers/textract-parser.ts
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";

export class TextractParser {
  private client: TextractClient;

  constructor() {
    this.client = new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async parseDocument(documentBytes: Buffer): Promise<ExtractedData> {
    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: documentBytes },
      FeatureTypes: ["FORMS", "TABLES", "SIGNATURES"],
    });

    const response = await this.client.send(command);
    return this.extractMortgageFields(response);
  }

  private extractMortgageFields(response: any): ExtractedData {
    // Extract key mortgage fields:
    // - Borrower information
    // - Property details
    // - Income data
    // - Asset information
    // - Loan details
  }
}
```

### 2.5 Property Valuation Service

```typescript
// lib/apis/property-valuation.ts
export class PropertyValuationService {
  private rentcastApiKey = process.env.RENTCAST_API_KEY!;

  async getPropertyValue(address: string): Promise<PropertyValuation> {
    const response = await fetch(`https://api.rentcast.io/v1/avm/value`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.rentcastApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();
    return {
      estimatedValue: data.estimate,
      confidence: data.confidence,
      comparables: data.comps,
      priceRange: data.range,
    };
  }

  async getMarketTrends(zipCode: string): Promise<MarketTrends> {
    // Get historical trends, market statistics
  }
}
```

---

## Phase 3: Core UI Components (Days 3-4)

### 3.1 Document Upload Component

```typescript
// components/document-upload.tsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle } from 'lucide-react';

export function DocumentUpload({ onDocumentsUploaded }: DocumentUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    
    for (const file of acceptedFiles) {
      // Upload to Vercel Blob
      // Process with OCR API
      // Update progress
    }
    
    setIsProcessing(false);
    onDocumentsUploaded(processedDocuments);
  }, [onDocumentsUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: true,
  });

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Mortgage Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div {...getRootProps()} className="cursor-pointer p-8 text-center">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the documents here...</p>
          ) : (
            <div>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg mb-2">Drag & drop mortgage documents</p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports: Loan applications, pay stubs, bank statements, tax returns
              </p>
              <Button>Select Files</Button>
            </div>
          )}
        </div>
        
        {isProcessing && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Processing documents with AI...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3.2 Loan Assessment Dashboard

```typescript
// components/loan-assessment.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function LoanAssessment({ assessment }: { assessment: LoanAssessmentData }) {
  const getStatusIcon = (status: EligibilityStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'conditional': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Eligibility Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(assessment.eligibilityStatus)}
            Loan Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={assessment.eligibilityStatus === 'approved' ? 'default' : 'destructive'}>
            {assessment.eligibilityStatus.toUpperCase()}
          </Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            {assessment.eligibilityReason}
          </p>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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

      {/* Improvement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {assessment.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm">
                • {suggestion}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 4: Advanced Features & AI Integration (Days 4-5)

### 4.1 Enhanced Document Analyzer with Email Automation

```typescript
// lib/document-analyzer.ts
import { ComposioGmailClient } from '@/lib/composio/gmail-client';

export class DocumentAnalyzer {
  private gmailClient: ComposioGmailClient;

  constructor() {
    this.gmailClient = new ComposioGmailClient();
  }

  async analyzeDocument(document: ProcessedDocument): Promise<DocumentAnalysis> {
    const extractedData = await this.extractFinancialData(document);
    const propertyValue = await this.getPropertyValuation(extractedData.propertyAddress);
    const marketTrends = await this.getMarketTrends(extractedData.zipCode);
    
    const analysis = {
      borrowerProfile: this.buildBorrowerProfile(extractedData),
      loanMetrics: this.calculateLoanMetrics(extractedData, propertyValue),
      riskAssessment: this.assessRisk(extractedData, marketTrends),
      recommendations: this.generateRecommendations(extractedData),
    };

    // Trigger email notification based on loan status
    await this.handleLoanDecisionNotification(analysis, extractedData);

    return analysis;
  }

  private async handleLoanDecisionNotification(
    analysis: DocumentAnalysis, 
    extractedData: ExtractedData
  ) {
    const { eligibilityStatus } = analysis.riskAssessment;
    
    try {
      switch (eligibilityStatus) {
        case 'approved':
          await this.sendApprovalNotification(analysis, extractedData);
          break;
        case 'conditional':
          await this.sendConditionalNotification(analysis, extractedData);
          break;
        case 'denied':
          // Could add denial notification here if needed
          console.log(`Loan denied for ${extractedData.borrowerInfo.email}`);
          break;
      }
    } catch (error) {
      console.error('Failed to send loan decision notification:', error);
      // Don't throw error - email failure shouldn't break loan processing
    }
  }

  private async sendApprovalNotification(
    analysis: DocumentAnalysis, 
    extractedData: ExtractedData
  ) {
    const loanDetails = {
      loanId: analysis.loanId,
      loanAmount: extractedData.loanAmount,
      interestRate: extractedData.interestRate,
      loanTerm: extractedData.loanTerm,
      monthlyPayment: this.calculateMonthlyPayment(extractedData),
      propertyAddress: extractedData.propertyAddress,
      ltv: analysis.loanMetrics.ltv,
      dti: analysis.loanMetrics.dti,
      creditScore: extractedData.creditScore,
    };

    await this.gmailClient.sendLoanApprovalEmail(
      extractedData.borrowerInfo.email,
      extractedData.borrowerInfo.firstName,
      loanDetails
    );

    // Log the approval email sent
    console.log(`✅ Approval email sent to ${extractedData.borrowerInfo.email}`);
  }

  private async sendConditionalNotification(
    analysis: DocumentAnalysis, 
    extractedData: ExtractedData
  ) {
    await this.gmailClient.sendConditionalApprovalEmail(
      extractedData.borrowerInfo.email,
      extractedData.borrowerInfo.firstName,
      analysis.recommendations // These become the conditions
    );

    // Log the conditional email sent
    console.log(`📋 Conditional approval email sent to ${extractedData.borrowerInfo.email}`);
  }

  private calculateLoanMetrics(data: ExtractedData, propertyValue: number) {
    const ltv = (data.loanAmount / propertyValue) * 100;
    const dti = (data.monthlyDebtPayments / data.monthlyIncome) * 100;
    const piti = data.principalAndInterest + data.propertyTax + data.insurance;
    const housingRatio = (piti / data.monthlyIncome) * 100;

    return { ltv, dti, housingRatio, piti };
  }

  private calculateMonthlyPayment(data: ExtractedData): number {
    const principal = data.loanAmount;
    const monthlyRate = data.interestRate / 100 / 12;
    const numberOfPayments = data.loanTerm * 12;
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return Math.round(monthlyPayment);
  }

  private generateRecommendations(data: ExtractedData): string[] {
    const recommendations = [];
    
    if (data.ltv > 80) {
      recommendations.push("Provide additional documentation for PMI requirements");
    }
    
    if (data.dti > 43) {
      recommendations.push("Submit proof of additional income sources");
    }
    
    if (data.creditScore < 620) {
      recommendations.push("Provide explanation letter for credit history");
    }
    
    return recommendations;
  }
}
```ts to improve debt-to-income ratio");
    }
    
    if (data.creditScore < 620) {
      recommendations.push("Work on improving credit score before applying");
    }
    
    return recommendations;
  }
}
```

### 4.2 Enhanced Loan Assessment Component with Email Status

```typescript
// components/loan-assessment.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Mail, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export function LoanAssessment({ assessment }: { assessment: LoanAssessmentData }) {
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const getStatusIcon = (status: EligibilityStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'conditional': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const handleSendNotification = async () => {
    setEmailStatus('sending');
    
    try {
      const endpoint = assessment.eligibilityStatus === 'approved' 
        ? '/api/notifications/send-approval'
        : '/api/notifications/send-conditional';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowerEmail: assessment.borrowerInfo.email,
          borrowerName: assessment.borrowerInfo.firstName,
          loanDetails: assessment.eligibilityStatus === 'approved' ? assessment.loanDetails : undefined,
          conditions: assessment.eligibilityStatus === 'conditional' ? assessment.suggestions : undefined,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setEmailStatus('sent');
        toast({
          title: "✅ Email Sent Successfully",
          description: `${assessment.eligibilityStatus === 'approved' ? 'Approval' : 'Conditional approval'} notification sent to ${assessment.borrowerInfo.email}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setEmailStatus('error');
      toast({
        title: "❌ Email Failed",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getEmailButtonText = () => {
    switch (emailStatus) {
      case 'sending': return 'Sending...';
      case 'sent': return 'Email Sent ✓';
      case 'error': return 'Retry Email';
      default: return 'Send Notification';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Eligibility Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(assessment.eligibilityStatus)}
            Loan Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant={assessment.eligibilityStatus === 'approved' ? 'default' : 'destructive'}>
            {assessment.eligibilityStatus.toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {assessment.eligibilityReason}
          </p>
          
          {/* Email Notification Button */}
          {assessment.eligibilityStatus !== 'denied' && (
            <Button 
              onClick={handleSendNotification}
              disabled={emailStatus === 'sending' || emailStatus === 'sent'}
              className="w-full"
              variant={emailStatus === 'sent' ? 'outline' : 'default'}
            >
              {emailStatus === 'sent' ? (
                <MailCheck className="h-4 w-4 mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {getEmailButtonText()}
            </Button>
          )}
          
          {emailStatus === 'sent' && (
            <p className="text-xs text-green-600 text-center">
              Notification sent to {assessment.borrowerInfo.email}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
          <div className="flex justify-between">
            <span>Monthly Payment:</span>
            <span className="font-medium">${assessment.monthlyPayment?.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {assessment.eligibilityStatus === 'conditional' ? 'Required Conditions' : 'Recommendations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {assessment.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
          
          {assessment.eligibilityStatus === 'conditional' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Action Required:</strong> Please provide the above information within 30 days to complete your approval.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescript
// components/property-valuation.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PropertyValuation({ property }: { property: PropertyData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold">
                ${property.estimatedValue.toLocaleString()}
              </h4>
              <p className="text-sm text-muted-foreground">
                Estimated Value (Confidence: {property.confidence}%)
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Low Estimate</p>
                <p className="font-medium">${property.lowEstimate.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Estimate</p>
                <p className="font-medium">${property.highEstimate.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Trend (12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={property.priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 5: Data Models & Validation (Day 5)

### Enhanced TypeScript Interfaces

```typescript
// types/loan.ts
export interface LoanApplication {
  id: string;
  borrowerInfo: BorrowerInfo;
  propertyInfo: PropertyInfo;
  loanDetails: LoanDetails;
  financialData: FinancialData;
  documents: Document[];
  assessment?: LoanAssessment;
  emailNotifications?: EmailNotification[];
}

export interface BorrowerInfo {
  firstName: string;
  lastName: string;
  email: string; // Required for email notifications
  phone?: string;
  ssn: string;
  dateOfBirth: string;
  employmentStatus: string;
  yearsAtCurrentJob: number;
  monthlyIncome: number;
}

export interface EmailNotification {
  id: string;
  type: 'approval' | 'conditional' | 'denial' | 'follow-up';
  recipientEmail: string;
  sentAt: Date;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  messageId?: string;
  template: string;
  content: EmailContent;
}

export interface EmailContent {
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface LoanApprovalDetails {
  loanId: string;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPayment: number;
  propertyAddress: string;
  ltv: number;
  dti: number;
  creditScore: number;
  approvalDate: Date;
  expirationDate: Date;
}

export interface LoanAssessment {
  eligibilityStatus: 'approved' | 'conditional' | 'denied';
  eligibilityReason: string;
  riskScore: number;
  recommendations: string[];
  requiredDocuments?: string[];
  conditions?: string[];
  emailSent?: boolean;
  emailSentAt?: Date;
  nextSteps?: string[];
}
```
```

### Enhanced Zod Validation Schemas

```typescript
// lib/validations.ts
import { z } from 'zod';

export const loanApplicationSchema = z.object({
  borrowerInfo: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Valid email address is required for notifications'),
    phone: z.string().optional(),
    ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format'),
    monthlyIncome: z.number().min(0, 'Income must be positive'),
  }),
  propertyInfo: z.object({
    address: z.string().min(5, 'Address is required'),
    purchasePrice: z.number().min(1000, 'Purchase price must be valid'),
  }),
  loanDetails: z.object({
    loanAmount: z.number().min(1000, 'Loan amount must be valid'),
    loanTerm: z.number().min(1).max(40, 'Loan term must be between 1-40 years'),
    interestRate: z.number().min(0).max(20, 'Interest rate must be between 0-20%'),
  }),
});

export const emailNotificationSchema = z.object({
  borrowerEmail: z.string().email('Valid email required'),
  borrowerName: z.string().min(1, 'Borrower name required'),
  loanDetails: z.object({
    loanId: z.string(),
    loanAmount: z.number(),
    interestRate: z.number(),
    monthlyPayment: z.number(),
  }).optional(),
  conditions: z.array(z.string()).optional(),
});

export const documentUploadSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, 'At least one document is required'),
});
```

---

## Phase 6: Dashboard & Analytics (Day 6)

### Enhanced Dashboard with Email Notifications

```typescript
// app/dashboard/page.tsx
import { DocumentUpload } from '@/components/document-upload';
import { LoanAssessment } from '@/components/loan-assessment';
import { PropertyValuation } from '@/components/property-valuation';
import { FinancialMetrics } from '@/components/financial-metrics';
import { EmailNotifications } from '@/components/email-notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Mortgage Document Intelligence</h1>
        <p className="text-muted-foreground">
          AI-powered loan assessment with automated notifications
        </p>
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
          <DocumentUpload onDocumentsUploaded={handleDocumentsUploaded} />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <LoanAssessment assessment={loanAssessment} />
        </TabsContent>

        <TabsContent value="property" className="space-y-6">
          <PropertyValuation property={propertyData} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <FinancialMetrics metrics={financialMetrics} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <EmailNotifications 
            notifications={emailNotifications} 
            onSendNotification={handleSendNotification}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Email Notifications Component

```typescript
// components/email-notifications.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MailCheck, MailX, Clock, Eye } from 'lucide-react';
import { formatDistance } from 'date-fns';

export function EmailNotifications({ 
  notifications, 
  onSendNotification 
}: { 
  notifications: EmailNotification[];
  onSendNotification: (type: string) => void;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <MailCheck className="h-4 w-4 text-green-500" />;
      case 'delivered': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'opened': return <Eye className="h-4 w-4 text-purple-500" />;
      case 'failed': return <MailX className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Send Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button 
            onClick={() => onSendNotification('approval')}
            className="bg-green-600 hover:bg-green-700"
          >
            <MailCheck className="h-4 w-4 mr-2" />
            Send Approval Email
          </Button>
          <Button 
            onClick={() => onSendNotification('conditional')}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Conditional Email
          </Button>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No email notifications sent yet
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(notification.status)}
                    <div>
                      <h4 className="font-medium">{notification.content.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        To: {notification.recipientEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistance(notification.sentAt, new Date(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(notification.status)}>
                      {notification.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {notification.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Templates Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-green-700 mb-2">✅ Approval Email</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Congratulations message with loan details, next steps, and closing information.
              </p>
              <ul className="text-xs text-muted-foreground">
                <li>• Loan amount and terms</li>
                <li>• Monthly payment calculation</li>
                <li>• Next steps for closing</li>
                <li>• Contact information</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-yellow-700 mb-2">📋 Conditional Approval</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Conditional approval with specific requirements and 30-day timeline.
              </p>
              <ul className="text-xs text-muted-foreground">
                <li>• Required documentation</li>
                <li>• Condition timeline</li>
                <li>• Upload instructions</li>
                <li>• Support contact info</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6.2 Real-time Processing Status

```typescript
// components/processing-status.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function ProcessingStatus({ documents }: { documents: ProcessedDocument[] }) {
  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const overallProgress = documents.length > 0 
    ? (documents.filter(d => d.status === 'completed').length / documents.length) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Document Processing Status
          <Badge variant="outline">{Math.round(overallProgress)}% Complete</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={overallProgress} className="mb-4" />
        
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                {getStatusIcon(doc.status)}
                <span className="text-sm">{doc.filename}</span>
              </div>
              <Badge variant={doc.status === 'completed' ? 'default' : 'secondary'}>
                {doc.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔌 MCP Integration Setup

### Environment Variables
```env
# AWS Textract
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Property Valuation APIs
RENTCAST_API_KEY=your_rentcast_key
ATTOM_API_KEY=your_attom_key

# Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# Email Automation - Composio Gmail MCP
COMPOSIO_API_KEY=your_composio_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GMAIL_USER_EMAIL=your_gmail_address

# Optional: Backup OCR Services
AZURE_DOCUMENT_INTELLIGENCE_KEY=your_azure_key
DOCSUMO_API_KEY=your_docsumo_key
```

### MCP Tool Connections
1. **Document Processing**: AWS Textract via AWS SDK
2. **Property Valuation**: RentCast API via REST
3. **Market Data**: ATTOM Data API via REST
4. **Email Automation**: Composio Gmail MCP via native integration
5. **Backup OCR**: Azure Document Intelligence via REST
6. **Storage**: Vercel Blob + Upstash Redis

### Composio Setup Instructions
```bash
# Install Composio CLI
npm install -g composio-core

# Login to Composio
composio login

# Add Gmail integration
composio add gmail

# Get connection details
composio connections list
```

---

## 📱 UI/UX Design Principles

### Design System
- **Color Palette**: Professional blue/green with high contrast
- **Typography**: Inter font for readability
- **Components**: Consistent shadcn/ui components
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG 2.1 AA compliance

### Key User Flows
1. **Document Upload** → **AI Processing** → **Results Display**
2. **Loan Assessment** → **Eligibility Check** → **Improvement Suggestions**
3. **Property Analysis** → **Valuation Display** → **Market Trends**

### Interactive Elements
- Real-time upload progress
- Live document processing status
- Interactive charts and metrics
- Expandable recommendation cards
- Copy-to-clipboard for data sharing

---

## 🎯 Demo Scenarios

### Scenario 1: Approved Loan with Email Notification
- Upload complete loan package (URLA, pay stubs, bank statements)
- Show successful extraction and processing
- Display positive assessment with all green metrics
- **Demonstrate automatic approval email sent via Composio Gmail**
- Show email content preview in dashboard
- Verify email delivery status

### Scenario 2: Conditional Approval with Follow-up
- Upload documents with marginal DTI ratio
- Show AI-detected risk factors requiring additional documentation
- Display improvement suggestions as conditions
- **Send conditional approval email with specific action items**
- Show 30-day timeline for condition fulfillment
- Demonstrate follow-up workflow

### Scenario 3: Email Integration Showcase
- **Live demonstration of Composio Gmail MCP connection**
- Show email template customization
- Display sent email tracking and delivery status
- Demonstrate error handling for email failures
- Show integration with loan officer dashboard

### Scenario 3: Property Valuation
- Input property address
- Show real-time valuation API call
- Display property trends and comparables
- Calculate LTV with different loan amounts

---

## 🚀 Deployment Strategy

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Environment variables setup in Vercel dashboard
```

### Performance Optimizations
- Edge Runtime for API routes
- Image optimization for document previews
- Redis caching for processed documents
- Lazy loading for dashboard components

---

## 🎯 Success Metrics

### Technical Metrics
- Document processing accuracy > 95%
- API response time < 3 seconds
- UI responsiveness on mobile devices
- Zero critical accessibility violations

### Business Metrics
- Loan assessment completion time < 2 minutes
- Property valuation accuracy within 5% of actual
- User engagement with improvement suggestions
- **Email delivery rate > 98%**
- **Email open rate tracking and analytics**
- Error rate for document processing < 2%
- **Automated notification response time < 30 seconds**

---

## 🔄 Future Enhancements

### Phase 2 Features
- Multi-borrower applications
- Commercial property support
- Automated underwriting integration
- Compliance checking (TRID, QM rules)
- **SMS notifications via Composio**
- **Email template customization interface**

### Advanced Features
- ML model training on processed documents
- Predictive analytics for loan performance
- Integration with loan origination systems
- White-label solution for lenders
- **Advanced email analytics and A/B testing**
- **Multi-channel notification preferences**
- **Automated follow-up email sequences**

---

## 🎯 Cursor Features Showcase for Interview

### 1. **AI-Assisted Email Template Generation**
- Use Cursor to generate professional HTML email templates
- Show AI helping with responsive email design
- Demonstrate smart suggestions for email content

### 2. **MCP Integration with AI Guidance**
- Let Cursor help set up Composio Gmail MCP connections
- Show AI-assisted error handling for email failures
- Demonstrate smart retry logic generation

### 3. **Complex Business Logic with AI**
- Use Cursor to generate loan calculation algorithms
- Show AI helping with mortgage industry compliance rules
- Demonstrate intelligent LTV/DTI calculation logic

### 4. **API Integration Automation**
- Show Cursor generating API client code for property valuation
- Demonstrate AI-assisted error handling for external APIs
- Use AI to generate comprehensive type definitions

### 5. **Real-time UI Updates**
- Let Cursor help build reactive components for email status
- Show AI generating loading states and progress indicators
- Demonstrate smart state management with Zustand

---

## 📧 Email Automation Highlights

This enhanced specification now includes comprehensive email automation using Composio Gmail MCP, which adds significant value to your demo:

### **Why This Makes Your Demo Stand Out:**

1. **Real-World Workflow**: Shows complete end-to-end automation from document processing to customer notification
2. **# Mortgage Document Intelligence Assistant

This specification provides a comprehensive roadmap for building a production-ready mortgage document intelligence system that showcases all the key technologies and approaches that Addy AI uses in their platform.