"use client"

import { useState, useEffect } from 'react'
import { submitSignal, deleteSignalResident, updateSignalResident } from '@/app/actions'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { PencilIcon, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'
import moment from 'moment'
import 'moment/locale/bg'

moment.locale('bg')

export default function ResidentSignals({ signals: initialSignals, slug }) {
  const [signals, setSignals] = useState(initialSignals)
  const [myKeys, setMyKeys] = useState({}) // { signalId: secretKey }
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingSignal, setEditingSignal] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    // Load keys from localStorage on mount
    const storedKeys = localStorage.getItem('mySignalKeys')
    if (storedKeys) {
      setMyKeys(JSON.parse(storedKeys))
    }
  }, [])

  useEffect(() => {
    setSignals(initialSignals)
  }, [initialSignals])

  const saveKeysToLocalStorage = (keys) => {
    localStorage.setItem('mySignalKeys', JSON.stringify(keys))
  }

  const handleDelete = async (signalId) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този сигнал?')) return

    const secretKey = myKeys[signalId]
    if (!secretKey) {
      toast.error('Грешка: Липсва ключ за изтриване на сигнала.')
      return
    }

    const formData = new FormData()
    formData.append('signalId', signalId)
    formData.append('secretKey', secretKey)
    formData.append('slug', slug)

    const result = await deleteSignalResident(formData)
    if (result.success) {
      toast.success(result.message)
      const newKeys = { ...myKeys }
      delete newKeys[signalId]
      setMyKeys(newKeys)
      saveKeysToLocalStorage(newKeys)
      setSignals(signals.filter(s => s.id !== signalId))
    } else {
      toast.error(result.message)
    }
  }

  const handleEdit = (signal) => {
    setEditingSignal(signal)
    setEditTitle(signal.title)
    setEditDescription(signal.description)
    setShowEditDialog(true)
  }

  const handleUpdateSubmit = async () => {
    if (!editingSignal) return

    const secretKey = myKeys[editingSignal.id]
    if (!secretKey) {
      toast.error('Грешка: Липсва ключ за редактиране на сигнала.')
      return
    }

    const formData = new FormData()
    formData.append('signalId', editingSignal.id)
    formData.append('secretKey', secretKey)
    formData.append('title', editTitle)
    formData.append('description', editDescription)
    formData.append('slug', slug)

    const result = await updateSignalResident(formData)
    if (result.success) {
      toast.success(result.message)
      setShowEditDialog(false)
      setSignals(signals.map(s => s.id === editingSignal.id ? { ...s, title: editTitle, description: editDescription } : s))
    } else {
      toast.error(result.message)
    }
  }

  const onSubmitSignal = async (formData) => {
    formData.append('slug', slug)
    const result = await submitSignal(formData)
    if (result.success) {
      toast.success(result.message || 'Сигналът е изпратен успешно!')
      // Save the new signal's secret key
      const newKeys = { ...myKeys, [result.signal.id]: result.signal.secretKey }
      setMyKeys(newKeys)
      saveKeysToLocalStorage(newKeys)
      // Optionally update the local signals state if needed
      // This will be revalidated by the server action anyway
    } else {
      toast.error(result.message || 'Грешка при изпращане на сигнал!')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Подай нов сигнал</CardTitle>
          <CardDescription>Опишете проблема, за да може домоуправителят да предприеме действия.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmitSignal} className="space-y-4">
            <div>
              <Input
                name="title"
                placeholder="Кратко заглавие (напр. Изгоряла крушка)"
                required
              />
            </div>
            <div>
              <Textarea
                name="description"
                placeholder="Подробно описание на проблема..."
                rows="4"
                required
              />
            </div>
            <div>
              <Input
                name="apartmentNumber"
                placeholder="Номер на апартамент (по избор)"
              />
            </div>
            <Button type="submit">Изпрати сигнал</Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Текущи сигнали</h2>
      {signals.length === 0 ? (
        <p>Няма подадени сигнали за тази сграда.</p>
      ) : (
        <div className="space-y-4">
          {signals.map((signal) => (
            <Card key={signal.id} className="relative">
              <CardHeader>
                <CardTitle>{signal.title}</CardTitle>
                <CardDescription>
                  Подаден на {moment(signal.createdAt).format('LL')}
                  {signal.apartmentNumber && ` от Ап. ${signal.apartmentNumber}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{signal.description}</p>
                <p className="mt-2 text-sm text-muted-foreground">Статус: {signal.status === 'OPEN' ? 'Нерешен' : 'Решен'}</p>
              </CardContent>
              {myKeys[signal.id] && (
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(signal)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(signal.id)}>
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Signal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирай сигнал</DialogTitle>
            <DialogDescription>
              Променете заглавието или описанието на вашия сигнал.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Заглавие"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Описание"
              rows="4"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Отказ</Button>
            <Button onClick={handleUpdateSubmit}>Запази промените</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
