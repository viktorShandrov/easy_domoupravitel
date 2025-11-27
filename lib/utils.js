import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import prisma from "@/lib/prisma"; // Import prisma for DB check

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function generateUniqueSixDigitCode() {
    let code;
    let exists = true;
    while (exists) {
        // Generate a 6-digit number and convert to string
        code = Math.floor(100000 + Math.random() * 900000).toString();
        // Check if it already exists in the database
        const building = await prisma.building.findUnique({
            where: { pairingCode: code },
        });
        exists = !!building; // If building is found, exists is true
    }
    return code;
}
