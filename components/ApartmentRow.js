'use client'

import { useState, useEffect } from 'react'
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
import { Settings } from "lucide-react"
import { addPayment, updateApartment, deleteApartment, addCustomCharge } from "@/app/actions"

export default function ApartmentRow({ apt, buildingId, feeConfig }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isChargeMode, setIsChargeMode] = useState(false) // Toggle between Deposit and Charge
  const [amount, setAmount] = useState('') // Държим сумата в state, за да я контролираме
  const [chargeAmount, setChargeAmount] = useState('') // Amount for custom charge
  const [chargeDescription, setChargeDescription] = useState('') // Description for custom charge
  const [ownerName, setOwnerName] = useState(apt.ownerName || '')
  const [residents, setResidents] = useState(apt.residents.toString())
  const [attributes, setAttributes] = useState(apt.attributes || []) // Array of attribute strings

  // Reset edit mode when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false)
      setIsChargeMode(false)
      // Reset form values to current apartment values
      setOwnerName(apt.ownerName || '')
      setResidents(apt.residents.toString())
      setAttributes(apt.attributes || [])
      setAmount('')
      setChargeAmount('')
      setChargeDescription('')
    }
  }, [isOpen, apt.ownerName, apt.residents, apt.attributes])

  // Изчисляваме дали има дълг (ако балансът е -20, дългът е 20)
  const debt = apt.balance < 0 ? Math.abs(apt.balance) : 0

  async function handleSubmit(formData) {
    await addPayment(formData)
    setIsOpen(false)
    setAmount('') // Чистим полето след успех
  }

  // Функция, която попълва цялата сума
  function fillFullDebt() {
    setAmount(debt.toString())
  }

  // Функция за форматиране на датата
  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Функция за форматиране на типа плащане
  function formatPaymentType(type) {
    if (type === 'MONTHLY_FEE') return 'Месечна такса'
    if (type === 'DEPOSIT') return 'Депозит'
    if (type === 'CUSTOM_CHARGE') return 'Персонализирана такса'
    return type
  }

  // Toggle attribute checkbox
  function toggleAttribute(value) {
    if (attributes.includes(value)) {
      setAttributes(attributes.filter(attr => attr !== value))
    } else {
      setAttributes([...attributes, value])
    }
  }

  // Handle custom charge submit
  async function handleChargeSubmit(e) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('apartmentId', apt.id)
    formData.append('amount', chargeAmount)
    formData.append('description', chargeDescription)

    const result = await addCustomCharge(formData)
    if (result.success) {
      setIsOpen(false)
      setChargeAmount('')
      setChargeDescription('')
    } else {
      alert(result.message || 'Грешка при добавяне на задължение!')
    }
  }

  // Функция за обработка на редактиране
  async function handleEditSubmit(e) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('apartmentId', apt.id)
    formData.append('ownerName', ownerName)
    formData.append('residents', residents)
    // Add attributes array
    attributes.forEach(attr => {
      formData.append('attributes[]', attr)
    })

    const result = await updateApartment(formData)
    if (result.success) {
      setIsEditMode(false)
      setIsOpen(false)
    } else {
      alert(result.message || 'Грешка при обновяване!')
    }
  }

  // Функция за обработка на изтриване
  async function handleDelete() {
    if (!confirm(`Сигурни ли сте, че искате да изтриете ${apt.number}?`)) {
      return
    }

    const formData = new FormData()
    formData.append('apartmentId', apt.id)

    const result = await deleteApartment(formData)
    if (result.success) {
      setIsOpen(false)
    } else {
      alert(result.message || 'Грешка при изтриване!')
    }
  }

  return (
    <div className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors border-b last:border-0">
      {/* ЛЯВА ЧАСТ: Информация */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
        <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded text-sm w-16 text-center">
                {apt.number}
            </span>
        </div>
        <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-800 font-medium">{apt.ownerName}</span>
              {apt.attributes && apt.attributes.length > 0 && feeConfig && Array.isArray(feeConfig) && (
                <div className="flex gap-1 flex-wrap">
                  {apt.attributes.map((attrId) => {
                    const configItem = feeConfig.find(item => item.id === attrId)
                    if (configItem) {
                      return (
                        <span 
                          key={attrId}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                        >
                          {configItem.label}
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400">{apt.residents} живущи</span>
        </div>
      </div>
      
      {/* ДЯСНА ЧАСТ */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
            <div className={`font-bold text-lg ${apt.balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {apt.balance > 0 ? '+' : ''}{apt.balance} лв.
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Баланс</div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant={apt.balance < 0 ? "destructive" : "outline"}>
              {apt.balance < 0 ? 'Плати' : 'Внеси'}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <DialogTitle>
                    {isEditMode ? 'Редактиране на апартамент' : (apt.balance < 0 ? 'Погасяване на задължение' : 'Внасяне на депозит')}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditMode ? (
                      `Обновете информацията за ${apt.number}`
                    ) : (
                      <>
                        Каса на: <b>{apt.number} ({apt.ownerName})</b>.
                        <br/>
                        Текущ баланс: <span className={apt.balance < 0 ? 'text-red-500 font-bold' : 'text-green-600'}>{apt.balance} лв.</span>
                      </>
                    )}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsEditMode(!isEditMode)}
                  type="button"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            {isEditMode ? (
              /* Edit Mode: Show Edit Form */
              <form onSubmit={handleEditSubmit} className="grid gap-6 py-4">
                <div className="space-y-3">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="editOwnerName">Собственик</Label>
                    <Input
                      id="editOwnerName"
                      name="ownerName"
                      type="text"
                      placeholder="Име на собственика"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="editResidents">Брой живущи</Label>
                    <Input
                      id="editResidents"
                      name="residents"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={residents}
                      onChange={(e) => setResidents(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label>Допълнителни атрибути</Label>
                    {feeConfig && Array.isArray(feeConfig) && feeConfig.length > 0 ? (
                      <div className="space-y-2">
                        {feeConfig.map((configItem) => (
                          <label key={configItem.id} className="flex items-center justify-between gap-2 cursor-pointer p-2 border border-slate-200 rounded hover:bg-slate-50">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={attributes.includes(configItem.id)}
                                onChange={() => toggleAttribute(configItem.id)}
                                className="w-4 h-4 rounded border-slate-300"
                              />
                              <span className="text-sm">{configItem.label}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {configItem.price ? `${configItem.price.toFixed(2)} лв.` : '0.00 лв.'}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Няма конфигурирани атрибути. Използвайте настройките на сградата, за да добавите атрибути.
                      </p>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="!flex-col gap-2">
                  <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
                    ✅ Запази промените
                  </Button>
                  <Button 
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                  >
                    🗑️ Изтрий Апартамент
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              /* Payment Mode: Show Payment/Charge Form and History */
              <>
                {/* Toggle between Deposit and Charge */}
                <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg">
                  <Button
                    type="button"
                    variant={!isChargeMode ? "default" : "ghost"}
                    size="sm"
                    className={`flex-1 ${!isChargeMode ? 'bg-slate-900 text-white' : ''}`}
                    onClick={() => setIsChargeMode(false)}
                  >
                    Внеси
                  </Button>
                  <Button
                    type="button"
                    variant={isChargeMode ? "default" : "ghost"}
                    size="sm"
                    className={`flex-1 ${isChargeMode ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
                    onClick={() => setIsChargeMode(true)}
                  >
                    Начисли
                  </Button>
                </div>

                {!isChargeMode ? (
                  /* Deposit Form */
                  <form action={handleSubmit} className="grid gap-6 py-4">
                      <input type="hidden" name="apartmentId" value={apt.id} />
                      <input type="hidden" name="buildingId" value={buildingId} />
                      
                      <div className="space-y-3">
                          {/* БУТОН ЗА БЪРЗО ПОГАСЯВАНЕ (Показва се само ако има дълг) */}
                          {debt > 0 && (
                              <div 
                                  onClick={fillFullDebt}
                                  className="cursor-pointer bg-red-50 border border-red-200 p-3 rounded-md flex justify-between items-center hover:bg-red-100 transition-colors"
                              >
                                  <div className="text-sm text-red-800">
                                      Пълно задължение:
                                  </div>
                                  <div className="font-bold text-red-700">
                                      {debt.toFixed(2)} лв.
                                  </div>
                                  <div className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                                      Натисни за избор
                                  </div>
                              </div>
                          )}

                          <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="amount">Сума за внасяне</Label>
                              <div className="relative">
                                  <Input
                                      id="amount"
                                      name="amount"
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={amount}
                                      onChange={(e) => setAmount(e.target.value)}
                                      className="pl-8 text-lg font-bold"
                                      autoFocus
                                  />
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">лв.</span>
                              </div>
                              <p className="text-xs text-slate-500">
                                  Въведената сума ще бъде добавена към баланса.
                              </p>
                          </div>
                      </div>
                      
                      <DialogFooter>
                          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
                              ✅ Запиши Плащането
                          </Button>
                      </DialogFooter>
                  </form>
                ) : (
                  /* Charge Form */
                  <form onSubmit={handleChargeSubmit} className="grid gap-6 py-4">
                      <div className="space-y-3">
                          <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="chargeDescription">Причина</Label>
                              <Input
                                  id="chargeDescription"
                                  name="description"
                                  type="text"
                                  placeholder="Напр. Поправка на ключ, Стар дълг"
                                  value={chargeDescription}
                                  onChange={(e) => setChargeDescription(e.target.value)}
                                  required
                                  autoFocus
                              />
                          </div>

                          <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="chargeAmount">Сума</Label>
                              <div className="relative">
                                  <Input
                                      id="chargeAmount"
                                      name="amount"
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={chargeAmount}
                                      onChange={(e) => setChargeAmount(e.target.value)}
                                      className="pl-8 text-lg font-bold"
                                      required
                                  />
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">лв.</span>
                              </div>
                              <p className="text-xs text-slate-500">
                                  Сумата ще бъде приспадната от баланса (задължение).
                              </p>
                          </div>
                      </div>
                      
                      <DialogFooter>
                          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                              ⚠️ Начисли Задължение
                          </Button>
                      </DialogFooter>
                  </form>
                )}

                {/* Payment History Section */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">История на транзакциите</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {!apt.payments || apt.payments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Няма история</p>
                    ) : (
                      apt.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex justify-between items-center p-3 bg-slate-50 rounded-md border border-slate-100"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500">
                              {formatDate(payment.date)}
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {formatPaymentType(payment.type)}
                            </span>
                            {payment.description && (
                              <span className="text-xs text-slate-400 italic">
                                {payment.description}
                              </span>
                            )}
                          </div>
                          <div className={`font-bold ${
                            payment.type === 'MONTHLY_FEE' || payment.type === 'CUSTOM_CHARGE'
                              ? 'text-red-500' 
                              : payment.type === 'DEPOSIT' 
                              ? 'text-emerald-600' 
                              : 'text-slate-700'
                          }`}>
                            {payment.type === 'MONTHLY_FEE' || payment.type === 'CUSTOM_CHARGE' ? '-' : '+'}
                            {Math.abs(payment.amount).toFixed(2)} лв.
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}