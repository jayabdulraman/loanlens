export interface PropertyValuation {
  estimatedValue: number
  confidence?: number
  comparables?: unknown[]
  priceRange?: { low: number; high: number }
  lowEstimate?: number
  highEstimate?: number
  priceHistory?: Array<{ month: string; value: number }>
}

export class PropertyValuationService {
  private rentcastApiKey = process.env.RENTCAST_API_KEY
  private valueCache = new Map<string, PropertyValuation>()
  private historyCache = new Map<string, Array<{ month: string; value: number }>>()

  async getPropertyValue(address: string): Promise<PropertyValuation> {
    if (this.valueCache.has(address)) return this.valueCache.get(address) as PropertyValuation
    if (!this.rentcastApiKey) throw new Error("RENTCAST_API_KEY is not set")

    const url = new URL("https://api.rentcast.io/v1/avm/value")
    url.searchParams.set("address", address)
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Api-Key": this.rentcastApiKey,
        accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`RentCast error: ${response.status} ${text}`)
    }

    const data = await response.json()
    console.log("RentCast response:", data.price ?? data.estimatedValue ?? 0)
    const result: PropertyValuation = {
      estimatedValue: data.price ?? data.estimatedValue ?? 0,
      confidence: data.confidence,
      comparables: data.comps,
      priceRange: data.range,
      lowEstimate: data.priceRangeLow ?? data.range?.low ?? data.lowEstimate,
      highEstimate: data.priceRangeHigh ?? data.range?.high ?? data.highEstimate,
    }
    this.valueCache.set(address, result)
    return result
  }

  // Fetch sales history (month/year + value). Only history is needed.
  async getSalesHistory(address: string): Promise<Array<{ month: string; value: number }>> {
    if (this.historyCache.has(address)) return this.historyCache.get(address) as Array<{ month: string; value: number }>
    if (!this.rentcastApiKey) throw new Error("RENTCAST_API_KEY is not set")

    const url = new URL("https://api.rentcast.io/v1/properties")
    url.searchParams.set("address", address)
    const res = await fetch(url.toString(), {
      headers: { "X-Api-Key": this.rentcastApiKey, accept: "application/json" },
      cache: "no-store",
    })
    if (!res.ok) return []
    const arr = (await res.json()) as Array<Record<string, unknown>>
    const first = Array.isArray(arr) ? arr[0] : undefined
    const historyObj = first?.history || {}
    const entries = Object.entries(historyObj) as Array<[
      string,
      { event?: string; date?: string; price?: number }
    ]>
    const mapped = entries
      .map(([k, v]) => ({ date: new Date(v?.date || k), value: typeof v?.price === "number" ? v.price : 0 }))
      .filter((d) => Number.isFinite(d.value) && d.value > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12)
      .map((d) => ({ month: d.date.toLocaleString("en", { month: "short", year: "numeric" }), value: d.value }))

    this.historyCache.set(address, mapped)
    return mapped
  }
}


