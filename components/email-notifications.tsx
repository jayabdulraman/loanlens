"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MailCheck, MailX, Clock, Eye } from 'lucide-react'
import { useAppStore } from '@/lib/store/app-store'
import type { EmailNotification } from '@/types/loan'

export function EmailNotifications() {
  const { emailNotifications } = useAppStore()

  const getStatusIcon = (status: EmailNotification['status']) => {
    switch (status) {
      case 'sent': return <MailCheck className="h-4 w-4 text-green-500" />
      case 'delivered': return <Mail className="h-4 w-4 text-blue-500" />
      case 'opened': return <Eye className="h-4 w-4 text-purple-500" />
      case 'failed': return <MailX className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: EmailNotification['status']) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-blue-100 text-blue-800'
      case 'opened': return 'bg-purple-100 text-purple-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
        </CardHeader>
        <CardContent>
          {emailNotifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No email notifications sent yet</p>
          ) : (
            <div className="space-y-3">
              {emailNotifications.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(n.status)}
                    <div>
                      <h4 className="font-medium">{n.content.subject}</h4>
                      <p className="text-sm text-muted-foreground">To: {n.recipientEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(n.status)}>{n.status.toUpperCase()}</Badge>
                    <Badge variant="outline">{n.type.toUpperCase()}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


