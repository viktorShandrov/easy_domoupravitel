"use client"

import { useState, useTransition } from "react"
import { resolveSignal } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SignalManager({ signals, buildingId }) {
  const [resolvingId, setResolvingId] = useState(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleResolve(signalId) {
    setResolvingId(signalId)
    const formData = new FormData()
    formData.append('signalId', signalId)
    formData.append('buildingId', buildingId)
    
    startTransition(async () => {
      await resolveSignal(formData)
      setResolvingId(null)
      router.refresh()
    })
  }

  if (!signals || signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Сигнали</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">Няма сигнали</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сигнали ({signals.filter(s => s.status === 'OPEN').length} активни)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {signals.map((signal) => (
            <div 
              key={signal.id} 
              className={`p-4 border rounded-lg ${
                signal.status === 'OPEN' 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{signal.title}</h3>
                  <p className="text-slate-600 text-sm mb-2">{signal.description}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    {signal.apartmentNumber && (
                      <span>От: {signal.apartmentNumber}</span>
                    )}
                    <span>
                      {new Date(signal.createdAt).toLocaleDateString('bg-BG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    signal.status === 'OPEN' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {signal.status === 'OPEN' ? 'Нерешен' : 'РЕШЕН'}
                  </span>
                  {signal.status === 'OPEN' && (
                    <Button
                      onClick={() => handleResolve(signal.id)}
                      size="sm"
                      variant="outline"
                      disabled={resolvingId === signal.id || isPending}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {resolvingId === signal.id ? 'Решава...' : 'Реши'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

