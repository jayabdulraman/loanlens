import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract"

export interface ExtractedData {
  borrowerInfo: { firstName: string; lastName: string; email?: string }
  propertyAddress?: string
  zipCode?: string
  loanAmount: number
  interestRate: number
  loanTerm?: number
  monthlyDebtPayments: number
  monthlyIncome: number
  principalAndInterest: number
  propertyTax: number
  insurance: number
  creditScore?: number
}

export class TextractParser {
  private client: TextractClient

  constructor() {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS Textract environment variables are not set")
    }

    this.client = new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    })
  }

  async parseDocument(documentBytes: Buffer): Promise<ExtractedData> {
    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: documentBytes },
      FeatureTypes: ["FORMS", "TABLES"],
    })

    await this.client.send(command)
    return this.extractMortgageFields()
  }

  // NOTE: Minimal placeholder extraction; real implementation would parse blocks
  private extractMortgageFields(): ExtractedData {
    // Stub values so the Phase 2 flow works end-to-end
    return {
      borrowerInfo: { firstName: "Borrower", lastName: "Name" },
      propertyAddress: "123 Main St",
      zipCode: "00000",
      loanAmount: 300000,
      interestRate: 6.5,
      loanTerm: 30,
      monthlyDebtPayments: 1200,
      monthlyIncome: 8000,
      principalAndInterest: 1896,
      propertyTax: 350,
      insurance: 120,
      creditScore: 720,
    }
  }
}


