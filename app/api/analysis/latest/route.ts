import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { getJSON } = await import('@/lib/upstash')
    const analysis = await getJSON<Record<string, unknown>>('analysis:latest')
    console.log("Analysis:", analysis)
    if (!analysis) return NextResponse.json({ success: false, error: 'No analysis found' }, { status: 404 })
    return NextResponse.json({ success: true, analysis })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load latest analysis' }, { status: 500 })
  }
}

