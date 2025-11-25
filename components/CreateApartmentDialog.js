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
import { createApartment } from "../app/actions"

export default function CreateApartmentDialog({ buildingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [number, setNumber] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [residents, setResidents] = useState('1')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('buildingId', buildingId)
    formData.append('number', number)
    formData.append('ownerName', ownerName)
    formData.append('residents', residents)

    const result = await createApartment(formData)
    
    if (result.success) {
      setIsOpen(false)
      setNumber('')
      setOwnerName('')
      setResidents('1')
    } else {
      alert(result.message || 'Грешка при създаване на апартамент!')
    }
    
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50">
          + Добави Апартамент
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Добавяне на нов апартамент
          </DialogTitle>
          <DialogDescription>
            Въведете информацията за новия апартамент. Началният баланс ще бъде 0.00 лв.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="space-y-3">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="number">Номер на апартамент</Label>
              <Input
                id="number"
                name="number"
                type="text"
                placeholder="Ап. 5"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="ownerName">Собственик</Label>
              <Input
                id="ownerName"
                name="ownerName"
                type="text"
                placeholder="Име на собственика"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="residents">Брой живущи</Label>
              <Input
                id="residents"
                name="residents"
                type="number"
                min="1"
                placeholder="1"
                value={residents}
                onChange={(e) => setResidents(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Отказ
            </Button>
            <Button 
              type="submit" 
              className="bg-slate-900 hover:bg-slate-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Създаване...' : '✅ Създай Апартамент'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

