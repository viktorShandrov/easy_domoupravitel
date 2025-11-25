import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublicBuildingData } from "@/app/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ResidentSignals from "@/components/portal/ResidentSignals"

export default async function PortalPage({ params }) {
  // 1. Взимаме slug-а (await е задължителен в новите версии)
  const { slug } = await params
  
  // 2. Дърпаме данните от сървъра
  const building = await getPublicBuildingData(slug)

  // 3. Ако няма такава сграда, показваме грешка
  if (!building) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center p-8">
          <h1 className="text-xl font-bold text-red-600 mb-2">Сградата не е намерена</h1>
          <p className="text-slate-500">Този линк е невалиден или остарял.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Хедър на портала */}
      <div className="bg-white border-b p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto text-center">
            <h1 className="font-bold text-lg text-slate-800">{building.name}</h1>
            <p className="text-xs text-slate-500">Портал за живущи</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        
        {/* Общ Баланс */}
        <Card className="bg-blue-600 text-white border-none shadow-lg">
            <CardContent className="p-6 text-center">
                <p className="text-blue-100 text-sm mb-1">Наличност в касата</p>
                <h2 className="text-3xl font-bold">
                    {building.publicDisplayBalance ? `${building.cashBalance.toFixed(2)} лв.` : '*.** лв (Скрито)'}
                </h2>
            </CardContent>
        </Card>

        <Tabs defaultValue="finance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="finance">💰 Финанси</TabsTrigger>
            <TabsTrigger value="signals">⚠️ Сигнали</TabsTrigger>
          </TabsList>
          
          {/* ТАБ 1: ФИНАНСИ (Списък с дългове) */}
          <TabsContent value="finance" className="space-y-4 mt-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase text-slate-500">Списък Задължения</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {building.apartments.map(apt => (
                            <div key={apt.number} className="flex justify-between items-center p-4 text-sm">
                                <span className="font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                                    {apt.number}
                                </span>
                                {/* ВАЖНО: Тук не показваме имената на собствениците за GDPR */}
                                <span className={`font-bold ${apt.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {apt.balance < 0 ? '' : '+'}{apt.balance.toFixed(2)} лв.
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase text-slate-500">Последни Разходи</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {building.expenses.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">Няма скорошни разходи</div>
                        ) : (
                            building.expenses.map(exp => (
                                <div key={exp.id} className="flex justify-between items-center p-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-800 font-medium">{exp.description}</span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(exp.date).toLocaleDateString('bg-BG')}
                                        </span>
                                    </div>
                                    <span className="text-orange-600 font-bold">
                                        -{exp.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          
          {/* ТАБ 2: СИГНАЛИ */}
          <TabsContent value="signals" className="mt-4">
             {/* Тук ползваме нашия нов компонент ResidentSignals */}
             <ResidentSignals 
                signals={building.signals} 
                slug={slug} 
             />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}