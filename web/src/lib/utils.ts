import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Alias for truncateAddress to maintain backward compatibility
export function formatAddress(address: string) {
  return truncateAddress(address)
}

export function formatDate(date: Date | number) {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj)
}