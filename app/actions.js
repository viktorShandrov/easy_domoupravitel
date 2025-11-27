'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import crypto from 'crypto' // Import crypto for generating secret keys
import { sendTelegramNotification } from '@/services/telegramService' // Import the Telegram service
import { generateUniqueSixDigitCode } from '@/lib/utils' // Import the helper function

// Helper функция за проверка дали сградата принадлежи на потребителя
async function verifyBuildingOwnership(buildingId) {
  const { userId } = await auth()
  if (!userId) return false
  
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { userId: true }
  })
  
  return building?.userId === userId
}

// --- ФУНКЦИЯ 1: Създаване на тестови данни (Seed) ---
export async function seedDatabase() {
  const { userId } = await auth()
  
  if (!userId) {
    return { success: false, message: "Моля, влезте в системата!" }
  }

  // Проверяваме дали потребителят вече има сгради
  const count = await prisma.building.count({
    where: { userId }
  })
  
  if (count > 0) {
    return { success: false, message: "Вече имате данни в базата!" }
  }

  const newBuilding = await prisma.building.create({
    data: {
      name: "Бл. 24, Вх. А (Тестов)",
      address: "ж.к. Младост 4",
      cashBalance: 0,
      userId, // Свързваме сградата с текущия потребител
      pairingCode: await generateUniqueSixDigitCode(), // Generate and assign pairing code
      apartments: {
        create: [
          { number: "Ап. 1", ownerName: "Иван Петров", residents: 2, balance: -15.00 },
          { number: "Ап. 2", ownerName: "Мария Иванова", residents: 1, balance: 50.00 }
        ]
      }
    }
  })
  
  revalidatePath('/')
  return { success: true, message: "Данните са заредени!" }
}

// --- ФУНКЦИЯ 2: Взимане на данните за екрана ---
export async function getBuildings() {
  const { userId } = await auth()
  
  // Ако няма потребител, връщаме празен масив
  if (!userId) {
    return []
  }

  try {
    return await prisma.building.findMany({
      where: { userId }, // Филтрираме само сградите на текущия потребител
      include: {
        apartments: { 
          orderBy: { number: 'asc' },
          include: {
            payments: { orderBy: { date: 'desc' } }
          }
        },
        expenses: { orderBy: { date: 'desc' } },
        signals: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error("Database Error:", error)
    return []
  }
}

// --- ФУНКЦИЯ 3: ПЛАЩАНЕ (Експортната функция, която липсваше) ---
export async function addPayment(formData) {
  // Взимаме данните от формата
  const amount = parseFloat(formData.get('amount'))
  const apartmentId = formData.get('apartmentId')
  const buildingId = formData.get('buildingId')

  if (!amount || !apartmentId || !buildingId) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return { success: false, message: "Нямате достъп до тази сграда!" }
  }

  // 1. Записваме история на плащането (Audit log)
  await prisma.payment.create({
    data: {
      amount,
      type: 'DEPOSIT', 
      apartmentId
    }
  })

  // 2. Обновяваме баланса на апартамента
  await prisma.apartment.update({
    where: { id: apartmentId },
    data: { balance: { increment: amount } }
  })

  // 3. Обновяваме касата на входа
  await prisma.building.update({
    where: { id: buildingId },
    data: { cashBalance: { increment: amount } }
  })

  // Обновяваме UI-а веднага
  revalidatePath('/')
  return { success: true }
}

// --- ФУНКЦИЯ 4: РАЗХОД (Добавяне на разход) ---
export async function addExpense(formData) {
  // Взимаме данните от формата
  const amount = parseFloat(formData.get('amount'))
  const description = formData.get('description')
  const buildingId = formData.get('buildingId')

  if (!amount || !description || !buildingId) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return { success: false, message: "Нямате достъп до тази сграда!" }
  }

  // 1. Записваме разхода в базата данни
  await prisma.expense.create({
    data: {
      amount,
      description,
      buildingId
    }
  })

  // 2. Намаляваме касата на входа (разход = минус пари)
  await prisma.building.update({
    where: { id: buildingId },
    data: { cashBalance: { decrement: amount } }
  })

  // Обновяваме UI-а веднага
  revalidatePath('/')
  return { success: true }
}

// --- ФУНКЦИЯ 5: ГЕНЕРИРАНЕ НА МЕСЕЧНИ ТАКСИ (Batch Processing) ---
export async function generateMonthlyFees(formData) {
  const buildingId = formData.get('buildingId')
  const feePerPerson = parseFloat(formData.get('feePerPerson'))
  const feePerUnit = parseFloat(formData.get('feePerUnit'))

  if (!buildingId || isNaN(feePerPerson) || isNaN(feePerUnit)) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return { success: false, message: "Нямате достъп до тази сграда!" }
  }

  try {
    // 1. Взимаме сградата за да получим feeConfig
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { feeConfig: true }
    })

    const feeConfig = building?.feeConfig || []

    // 2. Взимаме всички апартаменти за сградата
    const apartments = await prisma.apartment.findMany({
      where: { buildingId }
    })

    if (apartments.length === 0) {
      return { success: false, message: "Няма апартаменти в тази сграда!" }
    }

    // 3. Използваме транзакция за атомарност
    await prisma.$transaction(async (tx) => {
      // За всеки апартамент:
      for (const apartment of apartments) {
        // Изчисляваме базовата такса
        let totalFee = (apartment.residents * feePerPerson) + feePerUnit

        // Добавяме такси за атрибути
        if (apartment.attributes && apartment.attributes.length > 0 && feeConfig.length > 0) {
          for (const attr of apartment.attributes) {
            // Търсим конфигурация за този атрибут
            const configItem = feeConfig.find((item) => item.id === attr)
            if (configItem && configItem.price) {
              totalFee += parseFloat(configItem.price)
            }
          }
        }

        // Обновяваме баланса на апартамента (намаляваме го)
        await tx.apartment.update({
          where: { id: apartment.id },
          data: { balance: { decrement: totalFee } }
        })

        // Създаваме запис за плащането (Audit log)
        await tx.payment.create({
          data: {
            amount: totalFee,
            type: 'MONTHLY_FEE',
            apartmentId: apartment.id
          }
        })
      }
    })

    // Обновяваме UI-а веднага
    revalidatePath('/')
    return { success: true, message: `Генерирани такси за ${apartments.length} апартамента!` }
  } catch (error) {
    console.error("Error generating monthly fees:", error)
    return { success: false, message: "Грешка при генериране на такси!" }
  }
}

// --- ФУНКЦИЯ 5.5: ОБНОВЯВАНЕ НА КОНФИГУРАЦИЯ НА СГРАДА ---
export async function updateBuildingConfig(formData) {
  const buildingId = formData.get('buildingId')
  const feeConfigJson = formData.get('feeConfig')

  if (!buildingId) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return { success: false, message: "Нямате достъп до тази сграда!" }
  }

  try {
    let feeConfig = []
    if (feeConfigJson) {
      try {
        feeConfig = JSON.parse(feeConfigJson)
      } catch (e) {
        return { success: false, message: "Невалиден JSON формат!" }
      }
    }

    await prisma.building.update({
      where: { id: buildingId },
      data: { feeConfig }
    })

    revalidatePath('/')
    return { success: true, message: "Конфигурацията е обновена успешно!" }
  } catch (error) {
    console.error("Error updating building config:", error)
    return { success: false, message: "Грешка при обновяване на конфигурация!" }
  }
}

// --- ФУНКЦИЯ 6: СЪЗДАВАНЕ НА АПАРТАМЕНТ ---
export async function createApartment(formData) {
  const buildingId = formData.get('buildingId')
  const number = formData.get('number')
  const ownerName = formData.get('ownerName')
  const residents = parseInt(formData.get('residents'))

  if (!buildingId || !number || !ownerName || isNaN(residents)) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return { success: false, message: "Нямате достъп до тази сграда!" }
  }

  try {
    await prisma.apartment.create({
      data: {
        number,
        ownerName,
        residents,
        buildingId,
        balance: 0
      }
    })

    revalidatePath('/')
    return { success: true, message: "Апартаментът е създаден успешно!" }
  } catch (error) {
    console.error("Error creating apartment:", error)
    return { success: false, message: "Грешка при създаване на апартамент!" }
  }
}

// --- ФУНКЦИЯ 7: ОБНОВЯВАНЕ НА АПАРТАМЕНТ ---
export async function updateApartment(formData) {
  const apartmentId = formData.get('apartmentId')
  const ownerName = formData.get('ownerName')
  const residents = parseInt(formData.get('residents'))
  
  // Get attributes array from form data
  const attributes = formData.getAll('attributes[]')

  if (!apartmentId || !ownerName || isNaN(residents)) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали апартаментът принадлежи на потребителя
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: { building: { select: { userId: true } } }
  })

  const { userId } = await auth()
  if (!userId || apartment?.building?.userId !== userId) {
    return { success: false, message: "Нямате достъп до този апартамент!" }
  }

  try {
    await prisma.apartment.update({
      where: { id: apartmentId },
      data: {
        ownerName,
        residents,
        attributes: attributes || []
      }
    })

    revalidatePath('/')
    return { success: true, message: "Апартаментът е обновен успешно!" }
  } catch (error) {
    console.error("Error updating apartment:", error)
    return { success: false, message: "Грешка при обновяване на апартамент!" }
  }
}

// --- ФУНКЦИЯ 8: ИЗТРИВАНЕ НА АПАРТАМЕНТ ---
export async function deleteApartment(formData) {
  const apartmentId = formData.get('apartmentId')

  if (!apartmentId) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали апартаментът принадлежи на потребителя
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: { building: { select: { userId: true } } }
  })

  const { userId } = await auth()
  if (!userId || apartment?.building?.userId !== userId) {
    return { success: false, message: "Нямате достъп до този апартамент!" }
  }

  try {
    await prisma.apartment.delete({
      where: { id: apartmentId }
    })

    revalidatePath('/')
    return { success: true, message: "Апартаментът е изтрит успешно!" }
  } catch (error) {
    console.error("Error deleting apartment:", error)
    return { success: false, message: "Грешка при изтриване на апартамент!" }
  }
}

// --- ФУНКЦИЯ 9: ДОБАВЯНЕ НА ПЕРСОНАЛИЗИРАНА ТАКСА (Custom Charge) ---
export async function addCustomCharge(formData) {
  const apartmentId = formData.get('apartmentId')
  const amount = parseFloat(formData.get('amount'))
  const description = formData.get('description')

  if (!apartmentId || !amount || !description) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали апартаментът принадлежи на потребителя
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: { building: { select: { userId: true } } }
  })

  const { userId } = await auth()
  if (!userId || apartment?.building?.userId !== userId) {
    return { success: false, message: "Нямате достъп до този апартамент!" }
  }

  try {
    // 1. Намаляваме баланса на апартамента (потребителят дължи пари)
    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { balance: { decrement: amount } }
    })

    // 2. Създаваме запис за плащането (Audit log) с отрицателна сума за визуална консистентност
    await prisma.payment.create({
      data: {
        amount: -amount, // Отрицателна сума за визуална консистентност
        type: 'CUSTOM_CHARGE',
        description,
        apartmentId
      }
    })

    // Обновяваме UI-а веднага
    revalidatePath('/')
    return { success: true, message: "Задължението е добавено успешно!" }
  } catch (error) {
    console.error("Error adding custom charge:", error)
    return { success: false, message: "Грешка при добавяне на задължение!" }
  }
}

// --- ФУНКЦИЯ 10: ПУБЛИЧНИ ДАННИ ЗА СГРАДА (Resident Portal) ---
export async function getPublicBuildingData(slug) {
  try {
    const building = await prisma.building.findUnique({
      where: { slug },
      include: {
        apartments: {
          select: {
            number: true,
            balance: true,
            // НЕ включваме ownerName за поверителност
          },
          orderBy: { number: 'asc' }
        },
        expenses: {
          orderBy: { date: 'desc' },
          take: 20 // Последните 20 разхода
        },
        signals: {
          where: {
            status: { not: 'RESOLVED' } // Само активни сигнали
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!building) {
      return null
    }

    return {
      id: building.id,
      name: building.name,
      address: building.address,
      cashBalance: building.cashBalance,
      publicDisplayBalance: building.publicDisplayBalance, // Include this new field
      apartments: building.apartments,
      expenses: building.expenses,
      signals: building.signals
    }
  } catch (error) {
    console.error("Error fetching public building data:", error)
    return null
  }
}

// --- ФУНКЦИЯ 11: ПОДАВАНЕ НА СИГНАЛ (Resident Portal) ---
export async function submitSignal(formData) {
  const slug = formData.get('slug')
  const title = formData.get('title')
  const description = formData.get('description')
  const apartmentNumber = formData.get('apartmentNumber')

  if (!slug || !title || !description) {
    return { success: false, message: "Моля, попълнете всички задължителни полета!" }
  }

  try {
    // Намираме сградата по slug
    const building = await prisma.building.findUnique({
      where: { slug },
      select: { id: true, name: true, telegramChatId: true } // Select telegramChatId
    })

    if (!building) {
      return { success: false, message: "Сградата не е намерена!" }
    }

    // Създаваме сигнала
    const newSignal = await prisma.signal.create({
      data: {
        title,
        description,
        apartmentNumber: apartmentNumber || null,
        buildingId: building.id,
        status: 'OPEN',
        secretKey: crypto.randomUUID() // Генерираме уникален ключ
      }
    })

    // --- Send Telegram Notification ---
    if (building.telegramChatId) {
      const telegramMessage = `<b>Нов сигнал за ${building.name}:</b>\n\n<b>Заглавие:</b> ${title}\n<b>Описание:</b> ${description}\n<b>Апартамент:</b> ${apartmentNumber || 'Анонимен'}`;
      await sendTelegramNotification(building.telegramChatId, telegramMessage);
    }

    revalidatePath(`/portal/${slug}`)
    // Връщаме ID и SecretKey, за да може жителят да управлява сигнала си
    return { success: true, signal: { id: newSignal.id, secretKey: newSignal.secretKey }, message: "Сигналът е изпратен успешно!" }
  } catch (error) {
    console.error("Error submitting signal:", error)
    return { success: false, message: "Грешка при изпращане на сигнал!" }
  }
}

// --- ФУНКЦИЯ 12: ИЗТРИВАНЕ НА СИГНАЛ ОТ ЖИТЕЛ ---
export async function deleteSignalResident(formData) {
  const signalId = formData.get('signalId')
  const secretKey = formData.get('secretKey')
  const slug = formData.get('slug')

  if (!signalId || !secretKey || !slug) {
    return { success: false, message: "Невалидни данни!" }
  }

  try {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      select: { secretKey: true, building: { select: { slug: true } } }
    })

    if (!signal || signal.secretKey !== secretKey) {
      return { success: false, message: "Нямате достъп до този сигнал!" }
    }

    await prisma.signal.delete({
      where: { id: signalId }
    })

    revalidatePath(`/portal/${slug}`)
    return { success: true, message: "Сигналът е изтрит успешно!" }
  } catch (error) {
    console.error("Error deleting signal:", error)
    return { success: false, message: "Грешка при изтриване на сигнал!" }
  }
}

// --- ФУНКЦИЯ 13: ОБНОВЯВАНЕ НА СИГНАЛ ОТ ЖИТЕЛ ---
export async function updateSignalResident(formData) {
  const signalId = formData.get('signalId')
  const secretKey = formData.get('secretKey')
  const title = formData.get('title')
  const description = formData.get('description')
  const slug = formData.get('slug')

  if (!signalId || !secretKey || !title || !description || !slug) {
    return { success: false, message: "Невалидни данни!" }
  }

  try {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      select: { secretKey: true, building: { select: { slug: true } } }
    })

    if (!signal || signal.secretKey !== secretKey) {
      return { success: false, message: "Нямате достъп до този сигнал!" }
    }

    await prisma.signal.update({
      where: { id: signalId },
      data: { title, description }
    })

    revalidatePath(`/portal/${slug}`)
    return { success: true, message: "Сигналът е обновен успешно!" }
  } catch (error) {
    console.error("Error updating signal:", error)
    return { success: false, message: "Грешка при обновяване на сигнал!" }
  }
}

// --- ФУНКЦИЯ 14: ОБНОВЯВАНЕ НА НАСТРОЙКИ НА СГРАДА ---
export async function updateBuildingSettings(formData) {
  const buildingId = formData.get('buildingId')
  const publicDisplayBalance = formData.get('publicDisplayBalance') === 'true'
  const feeConfigJson = formData.get('feeConfig')
  const telegramChatId = formData.get('telegramChatId') // Get telegramChatId from form data
console.log(telegramChatId);

  if (!buildingId) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return { success: false, message: "Нямате достъп до тази сграда!" }
  }

  try {
    let feeConfig = []
    if (feeConfigJson) {
      try {
        feeConfig = JSON.parse(feeConfigJson)
      } catch (e) {
        return { success: false, message: "Невалиден JSON формат за такси!" }
      }
    }

    await prisma.building.update({
      where: { id: buildingId },
      data: {
        publicDisplayBalance,
        feeConfig,
        telegramChatId: telegramChatId || null, // Update telegramChatId
      },
    })

    revalidatePath('/')
    return { success: true, message: "Настройките на сградата са обновени успешно!" }
  } catch (error) {
    console.error("Error updating building settings:", error)
    return { success: false, message: "Грешка при обновяване на настройките!" }
  }
}


// --- ФУНКЦИЯ 15: РЕШАВАНЕ НА СИГНАЛ (Manager Only) ---
export async function resolveSignal(formData) {
  const signalId = formData.get('signalId')
  const buildingId = formData.get('buildingId')

  if (!signalId || !buildingId) {
    return { success: false, message: "Невалидни данни!" }
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return { success: false, message: "Нямате достъп до тази сграда!" }
  }

  try {
    await prisma.signal.update({
      where: { id: signalId },
      data: { status: 'RESOLVED' }
    })

    revalidatePath('/')
    return { success: true, message: "Сигналът е решен!" }
  } catch (error) {
    console.error("Error resolving signal:", error)
    return { success: false, message: "Грешка при решаване на сигнал!" }
  }
}

// --- ФУНКЦИЯ 16: ВЗИМАНЕ НА СИГНАЛИ ЗА СГРАДА (Manager Dashboard) ---
export async function getBuildingSignals(buildingId) {
  const { userId } = await auth()

  if (!userId) {
    return []
  }

  // Проверяваме дали сградата принадлежи на потребителя
  const isOwner = await verifyBuildingOwnership(buildingId)
  if (!isOwner) {
    return []
  }

  try {
    return await prisma.signal.findMany({
      where: { buildingId },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error("Error fetching signals:", error)
    return []
  }
}

