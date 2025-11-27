'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addExpense } from "../app/actions"
import { Receipt, Plus } from "lucide-react"

export default function ExpensesSection({ expenses = [], buildingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(formData) {
    await addExpense(formData)
    setIsOpen(false)
    setAmount('')
    setDescription('')
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Receipt className="w-5 h-5"/></span>
                Разходи
            </h3>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:text-slate-900">
                        <Plus className="w-4 h-4 mr-2" /> Добави
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-slate-50 rounded-3xl">
                    <DialogHeader className="bg-white p-6 rounded-t-3xl border-b">
                        <DialogTitle>Нов разход</DialogTitle>
                    </DialogHeader>
                    <form action={handleSubmit} className="p-6 space-y-6">
                        <input type="hidden" name="buildingId" value={buildingId} />
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Описание</Label>
                                <Input name="description" placeholder="Напр. Крушки" value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 bg-white text-lg rounded-xl" required autoFocus />
                            </div>
                            <div className="space-y-2">
                                <Label>Сума</Label>
                                <div className="relative">
                                    <Input name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-14 pl-4 text-2xl font-bold bg-white rounded-xl" required />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">BGN</span>
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-xl">Запиши</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <div className="space-y-3">
            {expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl">Няма записани разходи</div>
            ) : (
                expenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                            <div className="font-bold text-slate-900">{expense.description}</div>
                            <div className="text-xs text-slate-400">{formatDate(expense.date)}</div>
                        </div>
                        <div className="text-lg font-bold text-orange-600">
                            -{expense.amount.toFixed(2)}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  )
}