'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Plus, User } from "lucide-react"
import { updateBuildingSettings } from "../app/actions"

export default function BuildingSettingsDialog({ building }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- STATE ЗА НАСТРОЙКИТЕ ---
  const [publicDisplayBalance, setPublicDisplayBalance] = useState(building.publicDisplayBalance ?? true)
  
  // STATE ЗА ИМЕНАТА
  const [managerName, setManagerName] = useState(building.managerName || '')
  const [cashierName, setCashierName] = useState(building.cashierName || '')
  const [isManagerCashier, setIsManagerCashier] = useState(building.isManagerCashier ?? true)

  const [config, setConfig] = useState([])

  // Синхронизиране при отваряне на модала
  useEffect(() => {
    if (isOpen) {
        setPublicDisplayBalance(building.publicDisplayBalance ?? true)
        setManagerName(building.managerName || '')
        setCashierName(building.cashierName || '')
        setIsManagerCashier(building.isManagerCashier ?? true)
        
        if (building.feeConfig && Array.isArray(building.feeConfig)) {
            setConfig([...building.feeConfig])
        } else {
            setConfig([])
        }
    }
  }, [isOpen, building])

  // Ако потребителят цъкне "Касиерът е домоуправителя", копираме името
  useEffect(() => {
    if (isManagerCashier) {
        setCashierName(managerName)
    }
  }, [isManagerCashier, managerName])

  // --- ЛОГИКА ЗА АТРИБУТИ ---
  function addAttribute() {
    const newId = `attr_${Date.now()}`
    setConfig([...config, { id: newId, label: '', price: 0 }])
  }

  function removeAttribute(index) {
    setConfig(config.filter((_, i) => i !== index))
  }

  function updateAttribute(index, field, value) {
    const updated = [...config]
    updated[index] = { ...updated[index], [field]: value }
    setConfig(updated)
  }

  // --- ЗАПИСВАНЕ НА НАСТРОЙКИ ---
  async function handleSubmit(e) {
    if (e) e.preventDefault()
    setIsSubmitting(true)

    const validConfig = config.filter(item => item.label && item.id)
    
    const formData = new FormData()
    formData.append('buildingId', building.id)
    formData.append('publicDisplayBalance', publicDisplayBalance) 
    
    // Добавяме имената към формата
    formData.append('managerName', managerName)
    formData.append('cashierName', cashierName)
    formData.append('isManagerCashier', isManagerCashier)

    formData.append('feeConfig', JSON.stringify(validConfig))
    if(building.telegramChatId) formData.append('telegramChatId', building.telegramChatId)

    const result = await updateBuildingSettings(formData)
    
    if (result.success) {
      setIsOpen(false)
    } else {
      alert(result.message || 'Грешка при запазване на настройките!')
    }
    
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Настройки на сградата" className="border-slate-300 text-slate-600">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-800 text-xl">
            Настройки на Входа
          </DialogTitle>
          <DialogDescription>
            Управлявайте видимостта, имената на управата и таксите.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="general">🛠️ Общи</TabsTrigger>
                <TabsTrigger value="fees">🐶 Такси</TabsTrigger>
            </TabsList>

            {/* --- ТАБ 1: ОБЩИ НАСТРОЙКИ --- */}
            <TabsContent value="general" className="space-y-6 border rounded-md p-4 bg-slate-50/50">
                
                {/* СЕКЦИЯ: УПРАВА */}
                <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                        <User className="w-4 h-4 text-blue-500"/> Управителен Съвет
                    </h3>
                    
                    {/* Домоуправител */}
                    <div className="space-y-2">
                        <Label htmlFor="managerName">Име на Домоуправител</Label>
                        <Input 
                            id="managerName"
                            placeholder="Иван Петров" 
                            value={managerName}
                            onChange={(e) => setManagerName(e.target.value)}
                        />
                    </div>

                    {/* Отметка за касиер */}
                    <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-slate-50">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Касиерът е домоуправителя</Label>
                            <p className="text-xs text-slate-500">
                                Включете, ако едно лице изпълнява и двете длъжности.
                            </p>
                        </div>
                        <Switch 
                            checked={isManagerCashier}
                            onCheckedChange={setIsManagerCashier}
                        />
                    </div>

                    {/* Касиер (Показва се само ако е различен човек) */}
                    {!isManagerCashier && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="cashierName">Име на Касиер</Label>
                            <Input 
                                id="cashierName"
                                placeholder="Мария Иванова" 
                                value={cashierName}
                                onChange={(e) => setCashierName(e.target.value)}
                            />
                        </div>
                    )}
                </div>


                <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-white">
                    <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Публична Каса</Label>
                        <p className="text-xs text-slate-500">
                            Показвай наличната сума (Кеш) в портала за живущи.
                        </p>
                    </div>
                    <Switch 
                        checked={publicDisplayBalance}
                        onCheckedChange={setPublicDisplayBalance}
                    />
                </div>
                <div className="text-xs text-slate-400 italic px-2">
                    * Ако изключите тази опция, съседите ще виждат само своите задължения и списъка с разходи, но не и колко пари държите в наличност. Това се препоръчва за сигурност, ако държите големи суми в брой.
                </div>
                <br></br>
                <br></br>


                {/* Telegram секция */}
                
                                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Свързване с Telegram</h3>
                  
                  {/* Ако вече е свързано */}
                  {building.telegramChatId ? (
                    <div className="text-green-600 flex items-center gap-2">
                      <span className="text-xl">✅</span>
                      <span>Тази сграда е успешно свързана с група!</span>
                      {/* Опция за разкачане */}
                    </div>
                  ) : (
                    /* Ако НЕ Е свързано - покажи кода */
                    <div>
                      <p className="mb-4 text-gray-600">
                        За да получавате известия, изпълнете тези 2 стъпки:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
                        <li>Създайте група или канал в Telegram и добавете бота: <strong>@TvoyatBot</strong></li>
                        <li>Напишете следното съобщение вътре в групата:</li>
                      </ol>
                      
                      <div className="bg-white border-2 border-dashed border-gray-400 p-4 text-center rounded-xl cursor-pointer hover:bg-gray-50 transition"
                          onClick={() => navigator.clipboard.writeText(`/connect ${building.pairingCode}`)}>
                        <span className="text-2xl font-mono font-bold text-blue-600">
                          /connect {building.pairingCode}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">(Натиснете, за да копирате)</p>
                      </div>
                    </div>
                  )}
                </div>




                
                

                
            </TabsContent>

            {/* --- ТАБ 2: ТАКСИ --- */}
            <TabsContent value="fees" className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800 mb-4">
                    Тук дефинирате допълнителните такси (напр. Куче, Втори асансьор).
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {config.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
                            Няма добавени специални такси.
                        </div>
                    ) : (
                        config.map((item, index) => (
                            <div key={index} className="flex items-end gap-2 bg-white p-3 rounded border shadow-sm">
                                <div className="grid gap-1 flex-1">
                                    <Label className="text-xs font-medium text-slate-500">Наименование</Label>
                                    <Input 
                                        value={item.label} 
                                        onChange={(e) => updateAttribute(index, 'label', e.target.value)}
                                        placeholder="Напр. Куче" 
                                        className="h-9"
                                    />
                                </div>
                                <div className="grid gap-1 w-24">
                                    <Label className="text-xs font-medium text-slate-500">Цена (лв.)</Label>
                                    <Input 
                                        type="number" 
                                        value={item.price} 
                                        onChange={(e) => updateAttribute(index, 'price', e.target.value)}
                                        className="h-9 font-bold"
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeAttribute(index)}
                                    className="h-9 w-9 text-red-500 hover:bg-red-50"
                                >
                                    ✕
                                </Button>
                            </div>
                        ))
                    )}
                </div>
                <Button type="button" variant="outline" onClick={addAttribute} className="w-full border-dashed border-slate-300">
                    <Plus className="w-4 h-4 mr-2"/> Добави такса
                </Button>
            </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex justify-between items-center w-full">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Затвори
          </Button>
          <Button type="button" onClick={handleSubmit} className="bg-slate-900 hover:bg-slate-800" disabled={isSubmitting}>
            {isSubmitting ? 'Запазване...' : 'Запази Настройките'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}