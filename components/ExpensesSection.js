'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addExpense } from "../app/actions"

export default function ExpensesSection({ expenses, buildingId }) {
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
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Card className="border-orange-200 mt-4">
      <CardHeader className="bg-orange-50 border-b border-orange-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-orange-700">Разходи на домоуправител</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                + Добави Разход
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-orange-700">
                  Добавяне на разход
                </DialogTitle>
                <DialogDescription>
                  Въведете информация за разхода. Сумата ще бъде приспадната от касата на сградата.
                </DialogDescription>
              </DialogHeader>

              <form action={handleSubmit} className="grid gap-6 py-4">
                <input type="hidden" name="buildingId" value={buildingId} />
                
                <div className="space-y-3">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="description" className="text-orange-700">
                      Описание
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      type="text"
                      placeholder="Напр. Крушки - 10 BGN"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="amount" className="text-orange-700">
                      Сума
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8 text-lg font-bold border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">лв.</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Сумата ще бъде приспадната от общата каса.
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    ✅ Запиши Разхода
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Няма регистрирани разходи.
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex justify-between items-center p-3 border border-orange-100 rounded-md hover:bg-orange-50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-slate-800 font-medium text-sm">
                    {expense.description}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(expense.date)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">
                    -{expense.amount.toFixed(2)} лв.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

