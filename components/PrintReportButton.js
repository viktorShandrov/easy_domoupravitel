'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Printer, FileText, Users, Calendar } from "lucide-react"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { MonthlyReportPDF, HouseBookPDF, InvitationPDF } from '@/lib/pdf-templates'
import { getMonthlyReportData } from '@/app/actions'
import QRCode from 'qrcode'

export default function PrintReportButton({ building }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
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

  // Функция за подготовка на месечния отчет
  async function prepareMonthlyReport() {
    setLoading(true)
    const result = await getMonthlyReportData(building.id, parseInt(reportMonth), parseInt(reportYear))
    
    if (result.success) {
        // Генериране на QR код
        const url = `${window.location.origin}/portal/${building.slug}`
        const qr = await QRCode.toDataURL(url)
        setQrCodeUrl(qr)
        setReportData(result.data)
    } else {
        alert("Грешка при зареждане на данни")
    }
    setLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Документи и Печат" className="border-slate-300 text-slate-600">
          <Printer className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Център за Документи</DialogTitle>
          <DialogDescription>Генерирайте задължителни по ЗУЕС документи за разпечатване.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="monthly" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly"><FileText className="w-4 h-4 mr-2"/> Месечен Отчет</TabsTrigger>
                <TabsTrigger value="housebook"><Users className="w-4 h-4 mr-2"/> Домова Книга</TabsTrigger>
                <TabsTrigger value="invite"><Calendar className="w-4 h-4 mr-2"/> Покана за ОС</TabsTrigger>
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
                    <Button onClick={prepareMonthlyReport} disabled={loading} className="w-full">
                        {loading ? "Изчисляване..." : "🔍 Подготви Данни"}
                    </Button>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-3 rounded text-sm text-green-800 border border-green-200">
                            Данните за {reportMonth}/{reportYear} са готови!
                            <br/>Начално салдо: <strong>{reportData.openingBalance.toFixed(2)} лв.</strong>
                            <br/>Крайно салдо: <strong>{reportData.closingBalance.toFixed(2)} лв.</strong>
                        </div>
                        
                        <PDFDownloadLink
                            document={<MonthlyReportPDF data={reportData} qrCodeUrl={qrCodeUrl} />}
                            fileName={`Otchet_${building.name}_${reportMonth}_${reportYear}.pdf`}
                            className="w-full block"
                        >
                            {({ blob, url, loading, error }) => (
                                <Button className="w-full bg-slate-900 text-white" disabled={loading}>
                                    {loading ? 'Генериране на PDF...' : '⬇️ Свали PDF за Печат'}
                                </Button>
                            )}
                        </PDFDownloadLink>

                        <Button variant="ghost" size="sm" onClick={() => setReportData(null)} className="w-full">
                            Промени месеца
                        </Button>
                    </div>
                )}
            </TabsContent>

            {/* --- ТАБ 2: ДОМОВА КНИГА --- */}
            <TabsContent value="housebook" className="space-y-4 py-4">
                <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 mb-4">
                    Този документ съдържа списък на всички апартаменти, собственици и живущи. Подходящ е за представяне пред общината.
                </div>
                <PDFDownloadLink
                    document={<HouseBookPDF building={building} />}
                    fileName={`Domova_Kniga_${building.name}.pdf`}
                    className="w-full block"
                >
                    {({ loading }) => (
                        <Button className="w-full bg-slate-900 text-white" disabled={loading}>
                            {loading ? 'Генериране...' : '⬇️ Свали Домова Книга'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </TabsContent>

            {/* --- ТАБ 3: ПОКАНА --- */}
            <TabsContent value="invite" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Дата на събранието</Label>
                        <Input type="date" value={invitationData.date} onChange={e => setInvitationData({...invitationData, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Час</Label>
                        <Input type="time" value={invitationData.time} onChange={e => setInvitationData({...invitationData, time: e.target.value})} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Място</Label>
                    <Input value={invitationData.location} onChange={e => setInvitationData({...invitationData, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label>Дневен ред (Всяка точка на нов ред)</Label>
                    <Textarea 
                        rows={5} 
                        value={invitationData.agenda} 
                        onChange={e => setInvitationData({...invitationData, agenda: e.target.value})} 
                    />
                </div>

                <PDFDownloadLink
                    document={<InvitationPDF building={building} formData={invitationData} />}
                    fileName={`Pokana_OS_${invitationData.date}.pdf`}
                    className="w-full block"
                >
                    {({ loading }) => (
                        <Button className="w-full bg-slate-900 text-white" disabled={loading || !invitationData.date}>
                            {loading ? 'Генериране...' : '⬇️ Свали Покана'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}