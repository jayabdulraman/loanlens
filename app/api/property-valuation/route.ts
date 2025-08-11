import { NextRequest, NextResponse } from 'next/server'
import { PropertyValuationService } from '@/lib/apis/property-valuation'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })
  try {
    const svc = new PropertyValuationService()
    const [value, history] = await Promise.all([
      svc.getPropertyValue(address),
      svc.getSalesHistory(address),
    ])
    return NextResponse.json({ ...value, priceHistory: history })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}


