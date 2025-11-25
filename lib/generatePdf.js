import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// --- ПОМОЩНА ФУНКЦИЯ ЗА ТРАНСЛИТЕРАЦИЯ ---
// Превръща кирилицата в латиница, за да е четим PDF-ът без специални шрифтове
function toLatin(str) {
  if (!str) return "";
  
  const map = {
    'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v', 'Г': 'G', 'г': 'g',
    'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e', 'Ж': 'Zh', 'ж': 'zh', 'З': 'Z', 'з': 'z',
    'И': 'I', 'и': 'i', 'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k', 'Л': 'L', 'л': 'l',
    'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o', 'П': 'P', 'п': 'p',
    'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't', 'У': 'U', 'у': 'u',
    'Ф': 'F', 'ф': 'f', 'Х': 'H', 'х': 'h', 'Ц': 'Ts', 'ц': 'ts', 'Ч': 'Ch', 'ч': 'ch',
    'Ш': 'Sh', 'ш': 'sh', 'Щ': 'Sht', 'щ': 'sht', 'Ъ': 'A', 'ъ': 'a', 'Ь': 'Y', 'ь': 'y',
    'Ю': 'Yu', 'ю': 'yu', 'Я': 'Ya', 'я': 'ya', 
    '№': 'No', '–': '-', '—': '-'
  };

  return str.split('').map(char => map[char] || char).join('');
}

export function generateMonthlyReport(building) {
  const doc = new jsPDF()
  
  const currentDate = new Date().toLocaleDateString('bg-BG')

  // 1. ЗАГЛАВИЕ (Транслитерирано за сигурност)
  doc.setFontSize(18)
  doc.text("MESECHEN OTCHET", 105, 20, null, null, "center")
  doc.setFontSize(10)
  doc.text("(Monthly Report)", 105, 25, null, null, "center")
  
  doc.setFontSize(12)
  // Транслитерираме името на сградата, ако е на кирилица
  doc.text(`Sgrada: ${toLatin(building.name)}`, 14, 35)
  doc.text(`Data: ${currentDate}`, 14, 41)

  // 2. Финансов Баланс
  doc.setDrawColor(0)
  doc.setFillColor(245, 245, 245)
  doc.rect(14, 48, 180, 16, "F")
  doc.setFontSize(11)
  doc.text(`Kasa (Nalichnost): ${building.cashBalance.toFixed(2)} BGN`, 20, 59)
  
  const totalExpenses = building.expenses.reduce((acc, curr) => acc + curr.amount, 0)
  // doc.text(`Razhodi tozi mesets: ${totalExpenses.toFixed(2)} BGN`, 100, 59) // Ако има място

  // 3. ТАБЛИЦА ДЛЪЖНИЦИ
  const tableColumn = ["Ap.", "Sobstvenik", "Balans (BGN)"]
  const tableRows = []

  building.apartments.forEach(apt => {
    const balanceData = apt.balance.toFixed(2)
    // Транслитерираме името на собственика
    const ownerData = toLatin(apt.ownerName || "N/A")
    tableRows.push([apt.number, ownerData, balanceData])
  })

  autoTable(doc, {
    startY: 75,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80] }, // Тъмносин хедър
    didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
            const val = parseFloat(data.cell.raw)
            if (val < 0) {
                data.cell.styles.textColor = [220, 53, 69] // Червено за дълг
            } else {
                data.cell.styles.textColor = [25, 135, 84] // Зелено
            }
        }
    }
  })

  // 4. ТАБЛИЦА РАЗХОДИ
  const finalY = doc.lastAutoTable.finalY + 15
  
  // Проверка дали имаме място на страницата
  if (finalY > 250) {
      doc.addPage()
      doc.text("RAZHODI (EXPENSES)", 14, 20)
  } else {
      doc.text("RAZHODI (EXPENSES)", 14, finalY)
  }
  
  const expenseColumn = ["Data", "Opisanie", "Suma"]
  const expenseRows = []

  building.expenses.forEach(exp => {
    const dateStr = new Date(exp.date).toLocaleDateString('bg-BG')
    // Транслитерираме описанието (пр. "Krushki")
    const desc = toLatin(exp.description)
    expenseRows.push([dateStr, desc, `-${exp.amount.toFixed(2)}`])
  })

  autoTable(doc, {
    startY: finalY > 250 ? 25 : finalY + 5,
    head: [expenseColumn],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [211, 84, 0] }, // Оранжев хедър
  })

  // 5. Footer
  const pageCount = doc.internal.getNumberOfPages()
  doc.setFontSize(8)
  for(var i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text("Generirano ot Digital Domoupravitel App", 105, 290, null, null, "center")
  }

  doc.save(`Otchet_${toLatin(building.name).replace(/\s+/g, '_')}.pdf`)
}