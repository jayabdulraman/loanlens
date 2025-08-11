import { NextResponse } from 'next/server'
import { lrangeJSON } from '@/lib/upstash'
import type { EmailNotification } from '@/types/loan'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Fetch last 50 email notifications
    const items = await lrangeJSON<EmailNotification>('emails:history', 0, 49)
    return NextResponse.json({ success: true, notifications: items })
  } catch {
    return NextResponse.json({ success: false, notifications: [] })
  }
}


