import { Button } from "@/components/ui/button"
import { seedDatabase, getBuildings } from "./actions" 
import ApartmentRow from "@/components/ApartmentRow"
import ExpensesSection from "@/components/ExpensesSection"
import MonthlyFeeDialog from "@/components/MonthlyFeeDialog"
import CreateApartmentDialog from "@/components/CreateApartmentDialog"
import BuildingSettingsDialog from "@/components/BuildingSettingsDialog"
import PrintReportButton from "@/components/PrintReportButton"
import SignalManager from "@/components/SignalManager"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import PublicLinkButton from "@/components/PublicLinkButton"
import { Building2, MapPin } from "lucide-react"

export default async function Home() {
  const buildings = await getBuildings()

  return (
    <div className="min-h-screen bg-slate-100 pb-20"> 
      
      {/* Header / Navbar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-2 rounded-xl shadow-blue-200">
                      <Building2 className="w-5 h-5" />
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">Domoupravitel</h1>
              </div>
              <SignedIn>
                  <form action={seedDatabase}>
                      <Button type="submit" variant="ghost" size="sm" className="text-slate-500">
                          + Demo
                      </Button>
                  </form>
              </SignedIn>
          </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-8">
        
        <SignedOut>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
                  <h1 className="text-2xl font-bold text-slate-900 mb-4">Добре дошли</h1>
                  <p className="text-slate-500 mb-8">Лесно управление на входа от телефона.</p>
                  <SignInButton mode="modal">
                    <Button size="lg" className="w-full h-14 text-lg bg-blue-600 rounded-xl">Вход</Button>
                  </SignInButton>
              </div>
          </div>
        </SignedOut>

        <SignedIn>
          {buildings.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-slate-500 mb-4">Няма добавени сгради.</p>
                <form action={seedDatabase}>
                  <Button type="submit">Създай първата сграда</Button>
                </form>
            </div>
          ) : (
            <div className="space-y-8">
              {buildings.map((building) => (
                <div key={building.id} className="space-y-6">
                  
                  {/* Building Header Card */}
                  <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                      <div className="relative z-10">
                          <h2 className="text-2xl font-bold mb-1">{building.name}</h2>
                          <div className="flex items-center gap-2 text-blue-100 text-sm mb-6">
                              <MapPin className="w-4 h-4" /> {building.address}
                          </div>

                          <div className="flex justify-between items-end">
                              <div>
                                  <div className="text-blue-200 text-xs uppercase tracking-wider font-bold mb-1">Наличност в касата</div>
                                  <div className="text-3xl font-bold text-white">{building.cashBalance.toFixed(2)} лв.</div>
                              </div>
                              <div className="flex gap-2">
                                  <BuildingSettingsDialog building={building} />
                                  <PrintReportButton building={building} />
                              </div>
                          </div>
                      </div>
                      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      <CreateApartmentDialog buildingId={building.id} />
                      <MonthlyFeeDialog buildingId={building.id} />
                      <PublicLinkButton slug={building.slug} />
                  </div>
                  
                  {/* APARTMENTS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {building.apartments.length === 0 ? (
                             <div className="p-8 text-center text-slate-500 col-span-full bg-white rounded-xl">Няма апартаменти</div>
                        ) : (
                            building.apartments.map((apt) => (
                                <ApartmentRow
                                    key={apt.id}
                                    apt={apt}
                                    buildingId={building.id} 
                                    feeConfig={building.feeConfig}
                                />
                            ))
                        )}
                  </div>
                  
                  {/* BOTTOM SECTIONS - ЕДНО ПОД ДРУГО (MODERN LOOK) */}
                  <div className="grid grid-cols-1 gap-6 pt-4">
                      <ExpensesSection
                        expenses={building.expenses}
                        buildingId={building.id}
                      />
                      <SignalManager
                        signals={building.signals || []}
                        buildingId={building.id}
                      />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SignedIn>
      </div>
    </div>
  )
}