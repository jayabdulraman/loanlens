import { NextRequest, NextResponse } from 'next/server'
import { DocumentAnalyzer } from '@/lib/document-analyzer'
import { put } from '@vercel/blob'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, address, notify, filename, contentType } = await req.json()
    if (!fileBase64) return NextResponse.json({ success: false, error: 'fileBase64 required' }, { status: 400 })

    const bytes = Buffer.from(fileBase64, 'base64')

    // Save to Vercel Blob and analyze by URL so OpenAI can fetch directly
    const safeName = typeof filename === 'string' && filename ? `${filename}-${Date.now()}` : `upload-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const path = `uploads/${safeName}`
    const ct = typeof contentType === 'string' && contentType ? contentType : 'application/pdf'
    const blob = await put(path, bytes, { access: 'public', contentType: ct })

    const analyzer = new DocumentAnalyzer()
    const analysis = await analyzer.analyzeFromUrl({ url: blob.url, addressOverride: address, notify })

    return NextResponse.json({ success: true, analysis, blob: { url: blob.url, pathname: blob.pathname } })
  } catch (error) {
    console.log("Error analyzing documents:", JSON.stringify(error, null, 2))
    return NextResponse.json({ success: false, error: 'Analysis failed' }, { status: 500 })
  }
}


