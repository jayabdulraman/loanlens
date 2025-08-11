"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

type PropertyData = {
  estimatedValue: number
  confidence?: number
  lowEstimate?: number
  highEstimate?: number
  priceHistory?: Array<{ month: string; value: number }>
}

export function PropertyValuation({ property }: { property: PropertyData }) {
  const lowEstimate = property.lowEstimate ?? Math.round(property.estimatedValue * 0.95)
  const highEstimate = property.highEstimate ?? Math.round(property.estimatedValue * 1.05)

  const data = property.priceHistory ?? []
  const values = data.map((d) => d.value)
  const minVal = values.length ? Math.min(...values) : lowEstimate
  const maxVal = values.length ? Math.max(...values) : highEstimate
  const padding = Math.max(1000, Math.round((maxVal - minVal) * 0.1))
  const domain: [number, number] = [minVal - padding, maxVal + padding]

  const formatAbbrev = (value: number) => {
    const abs = Math.abs(value)
    if (abs >= 1_000_000) {
      const v = value / 1_000_000
      const s = (abs >= 10_000_000 ? Math.round(v) : parseFloat(v.toFixed(1))).toString()
      return `$${s}M`
    }
    if (abs >= 1_000) {
      const v = value / 1_000
      const s = (abs >= 10_000 ? Math.round(v) : parseFloat(v.toFixed(1))).toString()
      return `$${s}K`
    }
    return `$${Math.round(value).toLocaleString()}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold">${property.estimatedValue.toLocaleString()}</h4>
              <p className="text-sm text-muted-foreground">
                Estimated Value{property.confidence !== undefined ? ` (Confidence: ${property.confidence}%)` : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Low Estimate</p>
                <p className="font-medium">${lowEstimate.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Estimate</p>
                <p className="font-medium">${highEstimate.toLocaleString()}</p>
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
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={domain} tickFormatter={formatAbbrev} />
              <Tooltip formatter={(value: number) => [formatAbbrev(value as number), 'Value']} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}


