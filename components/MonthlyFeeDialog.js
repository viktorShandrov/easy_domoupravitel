'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { generateMonthlyFees } from "../app/actions"

export default function MonthlyFeeDialog({ buildingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [feePerPerson, setFeePerPerson] = useState('5.00')
  const [feePerUnit, setFeePerUnit] = useState('0.00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('buildingId', buildingId)
    formData.append('feePerPerson', feePerPerson)
    formData.append('feePerUnit', feePerUnit)

    const result = await generateMonthlyFees(formData)
    
    if (result.success) {
      setIsOpen(false)
      setFeePerPerson('5.00')
      setFeePerUnit('0.00')
    } else {
      alert(result.message || 'Грешка при генериране на такси!')
    }
    
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          📅 Начисли месечните такси
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-blue-700">
            Генериране на месечни такси
          </DialogTitle>
          <DialogDescription>
            Въведете тарифите за месечните такси. Всички апартаменти в сградата ще бъдат таксувани автоматично.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="space-y-3">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="feePerPerson" className="text-blue-700">
                Такса на човек
              </Label>
              <div className="relative">
                <Input
                  id="feePerPerson"
                  name="feePerPerson"
                  type="number"
                  step="0.01"
                  placeholder="5.00"
                  value={feePerPerson}
                  onChange={(e) => setFeePerPerson(e.target.value)}
                  className="pl-8 text-lg font-bold border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">лв.</span>
              </div>
              <p className="text-xs text-slate-500">
                Сума, която се умножава по броя живущи във всеки апартамент.
              </p>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="feePerUnit" className="text-blue-700">
                Фиксирана такса на апартамент
              </Label>
              <div className="relative">
                <Input
                  id="feePerUnit"
                  name="feePerUnit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={feePerUnit}
                  onChange={(e) => setFeePerUnit(e.target.value)}
                  className="pl-8 text-lg font-bold border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">лв.</span>
              </div>
              <p className="text-xs text-slate-500">
                Фиксирана сума, която се добавя към всеки апартамент независимо от броя живущи.
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>ℹ️ Допълнителни такси:</strong> Таксите за атрибути (напр. Куче, Паркинг) ще бъдат автоматично изчислени въз основа на настройките на сградата и атрибутите на всеки апартамент.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Обработване...' : '✅ Генерирай Такси'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

