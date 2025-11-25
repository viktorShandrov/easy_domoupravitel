'use client'

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { generateMonthlyReport } from "@/lib/generatePdf"

export default function PrintReportButton({ building }) {
  function handlePrint() {
    generateMonthlyReport(building)
  }

  return (

    <Button
     variant="outline" size="icon" title="Принтиране на отчет" className="border-slate-300 text-slate-600"
      onClick={handlePrint}


      // variant="ghost"
      // size="sm"
      // onClick={handlePrint}
      // className="h-8 w-8 p-0"
      // title="Генерирай месечен отчет (PDF)"
    >
      <Printer className="h-4 w-4" />
    </Button>
  )
}

