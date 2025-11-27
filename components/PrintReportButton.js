'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Printer, FileText, Users, Calendar, Download, RefreshCw } from "lucide-react"
import { MonthlyReportPDF, HouseBookPDF, InvitationPDF } from '@/lib/pdf-templates'
import { getMonthlyReportData } from '@/app/actions'
import QRCode from 'qrcode'
import dynamic from 'next/dynamic'

// Динамично импортиране за избягване на SSR грешки
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <Button disabled className="w-full">Зареждане на PDF модул...</Button>,
  }
)

export default function PrintReportButton({ building }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false) // Важно: за да знаем кога сме в браузъра
  
  // Уверяваме се, че компонента е маунтнат
  useEffect(() => {
    setIsClient(true)
  }, [])

  // States for Monthly Report
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportData, setReportData] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  // States for Invitation
  const [invitationData, setInvitationData] = useState({
      date: '',
      time: '19:00',
      location: 'Входа на блока',
      agenda: '1. Отчет на приходи и разходи\n2. Избор на нов касиер\n3. Разни'
  })
  const [invitationReady, setInvitationReady] = useState(false) // Ново: дали поканата е готова за сваляне

  // Функция за подготовка на месечния отчет
  async function prepareMonthlyReport() {
    setLoading(true)
    const result = await getMonthlyReportData(building.id, parseInt(reportMonth), parseInt(reportYear))
    
    if (result.success) {
        try {
            const url = `${window.location.origin}/portal/${building.slug}`
            const qr = await QRCode.toDataURL(url)
            setQrCodeUrl(qr)
            setReportData(result.data)
        } catch (e) {
            console.error(e)
        }
    } else {
        alert("Грешка при зареждане на данни")
    }
    setLoading(false)
  }

  // Когато променяме данните за поканата, скриваме бутона за сваляне (за да не гърми PDF-а)
  const updateInvitation = (field, value) => {
      setInvitationData(prev => ({ ...prev, [field]: value }))
      setInvitationReady(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 border-slate-200 text-slate-600 hover:text-slate-900">
          <Printer className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Център за Документи</DialogTitle>
          <DialogDescription>Генерирайте задължителни по ЗУЕС документи за разпечатване.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="monthly" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly"><FileText className="w-4 h-4 mr-2"/> <span className="hidden sm:inline">Отчет</span></TabsTrigger>
                <TabsTrigger value="housebook"><Users className="w-4 h-4 mr-2"/> <span className="hidden sm:inline">Книга</span></TabsTrigger>
                <TabsTrigger value="invite"><Calendar className="w-4 h-4 mr-2"/> <span className="hidden sm:inline">Покана</span></TabsTrigger>
            </TabsList>

            {/* --- ТАБ 1: МЕСЕЧЕН ОТЧЕТ --- */}
            <TabsContent value="monthly" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Месец</Label>
                        <Input 
                            type="number" min="1" max="12" 
                            value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Година</Label>
                        <Input 
                            type="number" min="2023" max="2030" 
                            value={reportYear} onChange={(e) => setReportYear(e.target.value)} 
                        />
                    </div>
                </div>
                
                {!reportData ? (
                    <Button onClick={prepareMonthlyReport} disabled={loading} className="w-full bg-slate-900 text-white">
                        {loading ? "Изчисляване..." : "🔍 Подготви Данни"}
                    </Button>
                ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-green-50 p-3 rounded text-sm text-green-800 border border-green-200">
                            Данните за {reportMonth}/{reportYear} са готови!
                            <br/>Начално салдо: <strong>{reportData.openingBalance.toFixed(2)} лв.</strong>
                            <br/>Крайно салдо: <strong>{reportData.closingBalance.toFixed(2)} лв.</strong>
                        </div>
                        
                        {isClient && (
                            <PDFDownloadLink
                                document={<MonthlyReportPDF data={reportData} qrCodeUrl={qrCodeUrl} />}
                                fileName={`Otchet_${building.name}_${reportMonth}_${reportYear}.pdf`}
                                className="w-full block"
                            >
                                {({ loading }) => (
                                    <Button className="w-full bg-slate-900 text-white" disabled={loading}>
                                        <Download className="w-4 h-4 mr-2" />
                                        {loading ? 'Генериране...' : 'Свали PDF'}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => setReportData(null)} className="w-full">
                            <RefreshCw className="w-3 h-3 mr-2" /> Промени месеца
                        </Button>
                    </div>
                )}
            </TabsContent>

            {/* --- ТАБ 2: ДОМОВА КНИГА --- */}
            <TabsContent value="housebook" className="space-y-4 py-4">
                <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 mb-4">
                    Този документ съдържа списък на всички апартаменти, собственици и живущи. Подходящ е за представяне пред общината.
                </div>
                
                {isClient && (
                    <PDFDownloadLink
                        document={<HouseBookPDF building={building} />}
                        fileName={`Domova_Kniga_${building.name}.pdf`}
                        className="w-full block"
                    >
                        {({ loading }) => (
                            <Button className="w-full bg-slate-900 text-white" disabled={loading}>
                                <Download className="w-4 h-4 mr-2" />
                                {loading ? 'Генериране...' : 'Свали Домова Книга'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                )}
            </TabsContent>

            {/* --- ТАБ 3: ПОКАНА --- */}
            <TabsContent value="invite" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Дата на събранието</Label>
                        <Input type="date" value={invitationData.date} onChange={e => updateInvitation('date', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Час</Label>
                        <Input type="time" value={invitationData.time} onChange={e => updateInvitation('time', e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Място</Label>
                    <Input value={invitationData.location} onChange={e => updateInvitation('location', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Дневен ред (Всяка точка на нов ред)</Label>
                    <Textarea 
                        rows={5} 
                        value={invitationData.agenda} 
                        onChange={e => updateInvitation('agenda', e.target.value)} 
                    />
                </div>

                {/* БУТОН ЗА ГЕНЕРИРАНЕ (За да не гърми докато пишеш) */}
                {!invitationReady ? (
                    <Button 
                        onClick={() => setInvitationReady(true)} 
                        disabled={!invitationData.date}
                        className="w-full bg-slate-900 text-white"
                    >
                        🔍 Генерирай Покана
                    </Button>
                ) : (
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                        {isClient && (
                            <PDFDownloadLink
                                document={<InvitationPDF building={building} formData={invitationData} />}
                                fileName={`Pokana_OS_${invitationData.date}.pdf`}
                                className="w-full block"
                            >
                                {({ loading }) => (
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                                        <Download className="w-4 h-4 mr-2" />
                                        {loading ? 'Обработване...' : 'Свали Покана (PDF)'}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setInvitationReady(false)} 
                            className="w-full text-slate-500"
                        >
                            ✏️ Редактирай данните
                        </Button>
                    </div>
                )}
            </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}