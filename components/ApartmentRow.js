'use client'

import { useState, useEffect } from 'react'
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
import { Settings, Users, ArrowLeft, History } from "lucide-react"
import { addPayment, updateApartment, deleteApartment, addCustomCharge } from "@/app/actions"

export default function ApartmentRow({ apt, buildingId, feeConfig }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState('main') // 'main', 'history', 'edit'
  const [isChargeMode, setIsChargeMode] = useState(false) 
  
  const [amount, setAmount] = useState('') 
  const [chargeAmount, setChargeAmount] = useState('') 
  const [chargeDescription, setChargeDescription] = useState('') 
  const [ownerName, setOwnerName] = useState(apt.ownerName || '')
  const [residents, setResidents] = useState(apt.residents.toString())
  const [attributes, setAttributes] = useState(apt.attributes || [])

  useEffect(() => {
    if (!isOpen) {
      setView('main')
      setIsChargeMode(false)
      setAmount('')
      setChargeAmount('')
      setChargeDescription('')
    }
  }, [isOpen])

  const debt = apt.balance < 0 ? Math.abs(apt.balance) : 0
  const isDebt = apt.balance < 0;

  async function handleSubmit(formData) {
    await addPayment(formData)
    setIsOpen(false)
    setAmount('') 
  }

  function fillFullDebt() {
    setAmount(debt.toString())
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function formatPaymentType(type) {
    if (type === 'MONTHLY_FEE') return 'Месечна такса'
    if (type === 'DEPOSIT') return 'Вноска'
    if (type === 'CUSTOM_CHARGE') return 'Индивидуална такса'
    return type
  }

  function toggleAttribute(value) {
    if (attributes.includes(value)) {
      setAttributes(attributes.filter(attr => attr !== value))
    } else {
      setAttributes([...attributes, value])
    }
  }

  async function handleChargeSubmit(e) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('apartmentId', apt.id)
    formData.append('amount', chargeAmount)
    formData.append('description', chargeDescription)
    await addCustomCharge(formData)
    setIsOpen(false)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('apartmentId', apt.id)
    formData.append('ownerName', ownerName)
    formData.append('residents', residents)
    attributes.forEach(attr => formData.append('attributes[]', attr))
    await updateApartment(formData)
    setView('main')
  }

  async function handleDelete() {
    if (!confirm(`Сигурни ли сте?`)) return
    const formData = new FormData()
    formData.append('apartmentId', apt.id)
    await deleteApartment(formData)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      
      {/* КАРТА (TRIGGER) */}
      <DialogTrigger asChild>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
                <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg text-sm">
                    {apt.number}
                </div>
                <div className="flex gap-1">
                    {apt.attributes?.map(a => (
                        <div key={a} className="w-2 h-2 rounded-full bg-blue-400"></div>
                    ))}
                </div>
            </div>
            <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg truncate mb-1">{apt.ownerName}</h3>
                <div className="text-slate-500 text-sm flex items-center gap-1">
                    <Users className="w-3 h-3" /> {apt.residents} живущи
                </div>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Баланс</div>
                    <div className={`text-2xl font-black ${isDebt ? 'text-red-500' : 'text-emerald-500'}`}>
                        {apt.balance > 0 ? '+' : ''}{apt.balance.toFixed(2)}
                    </div>
                </div>
                <div className={`h-10 px-4 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${isDebt ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {isDebt ? 'ПЛАТИ' : 'ВНЕСИ'}
                </div>
            </div>
        </div>
      </DialogTrigger>

      {/* МОДАЛЕН ПРОЗОРЕЦ (СЪДЪРЖАНИЕ) - ТУК Е ПРОМЯНАТА (h-[90vh]) */}
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-slate-50 rounded-3xl border-0 h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="bg-white p-4 border-b shrink-0 flex items-center justify-between">
            {view === 'main' ? (
                <>
                    <h2 className="text-lg font-bold text-slate-900">{apt.number} <span className="font-normal text-slate-500">| {apt.ownerName}</span></h2>
                    <Button variant="ghost" size="icon" onClick={() => setView('edit')}>
                        <Settings className="w-5 h-5 text-slate-400" />
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="ghost" size="sm" className="gap-2 pl-0 hover:bg-transparent text-slate-600" onClick={() => setView('main')}>
                        <ArrowLeft className="w-5 h-5" /> Назад
                    </Button>
                    <span className="font-bold text-slate-700">
                        {view === 'history' ? 'История на плащания' : 'Редактиране'}
                    </span>
                    <div className="w-8"></div>
                </>
            )}
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* VIEW: MAIN */}
            {view === 'main' && (
                <div className="space-y-6">
                    <div className={`text-center p-6 rounded-3xl ${isDebt ? 'bg-red-50' : 'bg-emerald-50'}`}>
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">Текущ Баланс</p>
                        <p className={`text-4xl font-black ${isDebt ? 'text-red-500' : 'text-emerald-500'}`}>
                            {apt.balance > 0 ? '+' : ''}{apt.balance.toFixed(2)} <span className="text-lg">лв.</span>
                        </p>
                    </div>

                    <div className="bg-slate-200 p-1 rounded-xl flex">
                        <button onClick={() => setIsChargeMode(false)} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!isChargeMode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                            ВНАСЯНЕ
                        </button>
                        <button onClick={() => setIsChargeMode(true)} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${isChargeMode ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}>
                            НАЧИСЛЯВАНЕ
                        </button>
                    </div>

                    {!isChargeMode ? (
                        <form action={handleSubmit} className="space-y-4">
                            <input type="hidden" name="apartmentId" value={apt.id} />
                            <input type="hidden" name="buildingId" value={buildingId} />
                            
                            {debt > 0 && (
                                <div onClick={fillFullDebt} className="bg-white border border-red-100 p-4 rounded-xl flex justify-between items-center shadow-sm active:scale-95 transition-transform cursor-pointer">
                                    <span className="text-red-600 font-bold text-sm">Погаси целия дълг</span>
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold text-sm">{debt.toFixed(2)} лв.</span>
                                </div>
                            )}

                            <div className="relative">
                                <Input 
                                    type="number" name="amount" value={amount} onChange={e => setAmount(e.target.value)} 
                                    placeholder="0.00" 
                                    className="h-16 text-3xl font-bold text-center bg-white rounded-xl border-slate-200 focus:ring-emerald-500" 
                                    autoFocus
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">BGN</span>
                            </div>

                            <Button type="submit" className="w-full h-14 text-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
                                ПОТВЪРДИ
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleChargeSubmit} className="space-y-4">
                             <Input 
                                placeholder="Причина (напр. Фонд Ремонт)" value={chargeDescription} onChange={e => setChargeDescription(e.target.value)}
                                className="h-12 bg-white text-lg" required
                             />
                             <div className="relative">
                                <Input 
                                    type="number" value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} 
                                    placeholder="0.00" className="h-16 text-3xl font-bold text-center bg-white rounded-xl border-red-200 focus:ring-red-500" required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">BGN</span>
                            </div>
                            <Button type="submit" className="w-full h-14 text-xl font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-200">
                                НАЧИСЛИ ДЪЛГ
                            </Button>
                        </form>
                    )}

                    <div className="pt-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-white hover:text-blue-600"
                            onClick={() => setView('history')}
                        >
                            <History className="w-4 h-4 mr-2"/> Виж пълна история
                        </Button>
                    </div>
                </div>
            )}

            {/* VIEW: HISTORY */}
            {view === 'history' && (
                <div className="space-y-3 pb-6">
                    {!apt.payments || apt.payments.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">
                          <History className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                          <p>Няма записана история</p>
                      </div>
                    ) : (
                      apt.payments.map((payment) => (
                        <div key={payment.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-700 text-sm mb-1">{formatPaymentType(payment.type)}</div>
                            <div className="text-xs text-slate-400 flex flex-col">
                                <span>{formatDate(payment.date)}</span>
                                {payment.description && <span className="text-slate-500 italic mt-0.5">{payment.description}</span>}
                            </div>
                          </div>
                          <span className={`text-lg font-bold ${
                            ['MONTHLY_FEE', 'CUSTOM_CHARGE'].includes(payment.type) ? 'text-red-500' : 'text-emerald-600'
                          }`}>
                            {['MONTHLY_FEE', 'CUSTOM_CHARGE'].includes(payment.type) ? '-' : '+'}{Math.abs(payment.amount).toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                </div>
            )}

            {/* VIEW: EDIT */}
            {view === 'edit' && (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Име на собственик</Label>
                        <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="h-12 text-lg bg-white" />
                    </div>
                    <div className="space-y-2">
                        <Label>Живущи</Label>
                        <Input type="number" value={residents} onChange={e => setResidents(e.target.value)} className="h-12 text-lg bg-white" />
                    </div>
                    
                    <div className="space-y-2 pt-2">
                        <Label>Екстри (Такси)</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {feeConfig?.map((item) => (
                                <div key={item.id} onClick={() => toggleAttribute(item.id)} className={`p-3 rounded-xl border-2 cursor-pointer flex justify-between items-center ${attributes.includes(item.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white'}`}>
                                    <span className="font-medium">{item.label}</span>
                                    <span className="text-xs bg-slate-200 px-2 py-1 rounded">{parseFloat(item.price).toFixed(2)} лв.</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                         <Button type="submit" className="w-full h-12 bg-slate-900 rounded-xl">Запази промените</Button>
                         <Button type="button" variant="ghost" className="w-full text-red-500 h-12" onClick={handleDelete}>Изтрий апартамента</Button>
                    </div>
                </form>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}