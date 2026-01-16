import { clsx, type ClassValue } from 'clsx'
import { API_URL, BASE_URL, SUPABASE_AUTH_KEY } from 'config'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toLocalDate(date: string) {
  const localDate = new Date(date).toString()
  return localDate
}

export function getLocalTime(date: string) {
  const localDate = new Date(date)

  const formattedHours = String(localDate.getHours()).padStart(2, '0')
  const formattedMinutes = String(localDate.getMinutes()).padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}`
}

export function canJoinRoom(date: string) {
  const scheduledDate = new Date(date)
  const currentDate = new Date()

  if (scheduledDate.getTime() > currentDate.getTime()) return false
  return true
}

export function roomJoinLink(roomId: string) {
  return `${API_URL}/room/join-room?id=${roomId}`
}

export function getToken() {
  const authData = JSON.parse(localStorage.getItem(SUPABASE_AUTH_KEY) || '{}')
  return authData.access_token
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function getRelativeTime(date: string) {
  const now = Date.now()
  const diffSeconds = Math.round((new Date(date).getTime() - now) / 1000)

  const divisions = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Infinity, name: 'years' },
  ]

  let duration = diffSeconds

  for (let i = 0; i < divisions.length; i++) {
    if (Math.abs(duration) < divisions[i].amount) {
      return rtf.format(Math.round(duration), divisions[i].name)
    }
    duration /= divisions[i].amount
  }
}

export function getNextUpdate(diffMs) {
  const abs = Math.abs(diffMs)

  if (abs < 60_000) return 1_000
  if (abs < 3_600_000) return 60_000
  if (abs < 86_400_000) return 3_600_000
  return 86_400_000
}
