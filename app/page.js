import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabase, getBuildings } from "./actions" 
import ApartmentRow from "@/components/ApartmentRow" // Импортираме нашия нов компонент
import ExpensesSection from "@/components/ExpensesSection"
import MonthlyFeeDialog from "@/components/MonthlyFeeDialog"
import CreateApartmentDialog from "@/components/CreateApartmentDialog"
import BuildingSettingsDialog from "@/components/BuildingSettingsDialog"
import PrintReportButton from "@/components/PrintReportButton"
import SignalManager from "@/components/SignalManager"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import PublicLinkButton from "@/components/PublicLinkButton"

export default async function Home() {
  const buildings = await getBuildings()

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Signed Out State - Welcome Screen */}
        <SignedOut>
          <div className="flex flex-col items-center justify-center min-h-[60vh text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Добре дошли в Easy Domoupravitel 🏢
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Управление на етажна собственост v1.0
              </p>
              <p className="text-slate-500 mb-6">
                Влезте в системата, за да започнете да управлявате своите сгради
              </p>
            </div>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 text-lg px-8 py-6">
                Влез в системата
              </Button>
            </SignInButton>
          </div>
        </SignedOut>

        {/* Signed In State - Dashboard */}
        <SignedIn>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Моите Сгради 🏢</h1>
              <p className="text-slate-500">Управление на етажна собственост v1.0</p>
            </div>
            <form action={seedDatabase}>
              <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                + Генерирай Тестов Вход
              </Button>
            </form>
          </div>

          {/* Списък */}
          {buildings.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-12 text-center text-slate-500">
                <p className="mb-4">Няма добавени сгради.</p>
                <p className="text-sm">Натисни бутона горе, за да започнеш.</p>
              </CardContent>
            </Card>
          ) : (
            buildings.map((building) => (
              <div key={building.id} className="space-y-4">
                <Card className="shadow-md overflow-hidden">
                  <CardHeader className="bg-slate-100 border-b pb-4">
                    <div className="flex justify-between items-center">
                       <CardTitle className="text-xl">{building.name}</CardTitle>
                       <div className="flex items-center gap-2">
                         <CreateApartmentDialog buildingId={building.id} />
                         <BuildingSettingsDialog
                           building={building}
                         />
                         <PrintReportButton building={building} />
                         <MonthlyFeeDialog buildingId={building.id} />
                         <span className="text-xs font-mono text-slate-400 bg-white px-2 py-1 rounded border">
                           ID: {building.id.slice(-6)}
                         </span>
                       </div>
                    </div>
                    <div className="text-sm text-slate-500 flex gap-2 items-center flex-wrap">
                        <span>📍 {building.address}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-bold text-slate-700">
                            Каса: {building.cashBalance.toFixed(2)} лв.
                        </span>
                        <span className="text-slate-300">|</span>
                        <PublicLinkButton slug={building.slug} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-0">
                    {/* Използваме новия компонент за всеки апартамент */}
                    <div className="divide-y divide-slate-100">
                      {building.apartments.map((apt) => (
                        <ApartmentRow
                            key={apt.id}
                            apt={apt}
                  buildingId={building.id} 
                            feeConfig={building.feeConfig}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Expenses Section */}
                <ExpensesSection
                  expenses={building.expenses}
                  buildingId={building.id}
                />
                
                {/* Signals Section */}
                <SignalManager
                  signals={building.signals || []}
                  buildingId={building.id}
                />
              </div>
            ))
          )}
        </SignedIn>

    </div>
    </div>
  )
}