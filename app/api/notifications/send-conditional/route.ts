import { NextRequest, NextResponse } from 'next/server'
import { sendConditionalApprovalEmail } from '@/lib/composio/gmail-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { borrowerEmail, borrowerName, conditions } = (await req.json()) as {
      borrowerEmail: string
      borrowerName: string
      conditions: string[]
    }

    if (!borrowerEmail || !borrowerName || !Array.isArray(conditions)) {
      console.log("Missing required fields:", borrowerEmail, borrowerName, conditions)
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sendConditionalApprovalEmail(borrowerEmail, borrowerName, conditions)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error ?? 'Email failed' }, { status: 502 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.log("Error sending conditional approval email:", JSON.stringify(error, null, 2))
    return NextResponse.json({ success: false, error: 'Notification failed' }, { status: 500 })
  }
}


