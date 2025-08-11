import { OpenAI } from "openai"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { writeFileSync, createReadStream } from "node:fs"
import type { ExtractedData } from "@/lib/document-parsers/textract-parser"

export class OpenAIPdfParser {
  private client: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set")
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async parseDocument(documentBytes: Buffer): Promise<ExtractedData> {
    // Write to a temp file so OpenAI SDK can stream it
    const tempPath = join(tmpdir(), `loanlens-${Date.now()}.pdf`)
    writeFileSync(tempPath, documentBytes)

    const file = await this.client.files.create({
      file: createReadStream(tempPath) as unknown as File,
      purpose: "assistants",
    })

    const prompt = this.buildPrompt()

    const response = await this.client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_file", file_id: file.id },
          ],
        },
      ],
    })

    const text = (response as unknown as { output_text?: string }).output_text as string
    const json = this.safeParseJson(text)
    return this.mapToExtractedData(json)
  }

  async parseDocumentFromUrl(fileUrl: string): Promise<ExtractedData> {
    const prompt = this.buildPrompt()
    const response = await this.client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_file", file_url: fileUrl },
          ],
        },
      ],
    })

    const text = (response as unknown as { output_text?: string }).output_text as string
    const json = this.safeParseJson(text)
    return this.mapToExtractedData(json)
  }

  private buildPrompt(): string {
    return (
      "Extract the following structured JSON fields from the attached mortgage document. " +
      "Respond with ONLY a valid JSON object (no prose). Fields: {\n" +
      "  borrowerInfo: { firstName: string, lastName: string, email?: string },\n" +
      "  propertyAddress?: string, zipCode?: string,\n" +
      "  loanAmount: number, interestRate: number, loanTerm?: number,\n" +
      "  monthlyDebtPayments: number, monthlyIncome: number,\n" +
      "  principalAndInterest: number, propertyTax: number, insurance: number,\n" +
      "  creditScore?: number\n" +
      "}. Assume missing values as best as possible based on the document."
    )
  }

  private safeParseJson(text: string): Record<string, unknown> {
    try {
      const start = text.indexOf("{")
      const end = text.lastIndexOf("}")
      const sliced = start >= 0 && end >= 0 ? text.slice(start, end + 1) : text
      return JSON.parse(sliced)
    } catch {
      return {}
    }
  }

  private mapToExtractedData(raw: Record<string, unknown>): ExtractedData {
    const toNumber = (v: unknown, d = 0) => {
      const n = typeof v === "string" ? Number(v.replace(/[^0-9.\-]/g, "")) : Number(v)
      return Number.isFinite(n) ? n : d
    }
    const borrower = (raw?.borrowerInfo as Record<string, unknown>) ?? {}
    const emailVal = (borrower as Record<string, unknown>)?.email || (raw as Record<string, unknown>)?.borrowerEmail || "infobookish@gmail.com"
    const email = typeof emailVal === 'string' && emailVal.trim().length > 0 ? emailVal : 'infobookish@gmail.com'
    // Credit score fallback to 720 if missing/invalid; clamp to [300, 850]
    let creditScore = toNumber(raw?.creditScore, 720)
    if (!Number.isFinite(creditScore) || creditScore <= 0) creditScore = 720
    if (creditScore < 300) creditScore = 300
    if (creditScore > 850) creditScore = 850

    const data = {
      borrowerInfo: {
        firstName: (borrower.firstName as string) ?? "",
        lastName: (borrower.lastName as string) ?? "",
        email,
      },
      propertyAddress: raw?.propertyAddress as string,
      zipCode: raw?.zipCode as string,
      loanAmount: toNumber(raw?.loanAmount, 0),
      interestRate: toNumber(raw?.interestRate, 0),
      loanTerm: toNumber(raw?.loanTerm, 30),
      monthlyDebtPayments: toNumber(raw?.monthlyDebtPayments, 0),
      monthlyIncome: toNumber(raw?.monthlyIncome, 0),
      principalAndInterest: toNumber(raw?.principalAndInterest, 0),
      propertyTax: toNumber(raw?.propertyTax, 0),
      insurance: toNumber(raw?.insurance, 0),
      creditScore,
    }
    console.log("Extracted data:", JSON.stringify(data, null, 2))
    return data
  }
}


