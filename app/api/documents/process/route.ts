import { NextRequest, NextResponse } from 'next/server'
import { TextractParser } from '@/lib/document-parsers/textract-parser'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let bytes: Buffer | null = null

    if (contentType.includes('application/json')) {
      const { fileBase64 } = await req.json()
      if (!fileBase64) return NextResponse.json({ success: false, error: 'fileBase64 required' }, { status: 400 })
      bytes = Buffer.from(fileBase64, 'base64')
    } else if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file') as unknown as File | null
      if (!file) return NextResponse.json({ success: false, error: 'file required' }, { status: 400 })
      const arrayBuffer = await (file as File).arrayBuffer()
      bytes = Buffer.from(arrayBuffer)
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported content type' }, { status: 415 })
    }

    const parser = new TextractParser()
    const extracted = await parser.parseDocument(bytes!)

    return NextResponse.json({ success: true, extracted })
  } catch {
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 500 })
  }
}


