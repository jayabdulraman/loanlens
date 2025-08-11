"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type FinancialMetricsProps = {
  metrics: {
    ltv: number
    dti: number
    housingRatio?: number
    piti?: number
  }
}

export function FinancialMetrics({ metrics }: FinancialMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Loan-to-Value (LTV)</span>
          <span className="font-medium">{metrics.ltv}%</span>
        </div>
        <div className="flex justify-between">
          <span>Debt-to-Income (DTI)</span>
          <span className="font-medium">{metrics.dti}%</span>
        </div>
        {metrics.housingRatio !== undefined && (
          <div className="flex justify-between">
            <span>Housing Ratio</span>
            <span className="font-medium">{metrics.housingRatio}%</span>
          </div>
        )}
        {metrics.piti !== undefined && (
          <div className="flex justify-between">
            <span>PITI</span>
            <span className="font-medium">${metrics.piti.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


