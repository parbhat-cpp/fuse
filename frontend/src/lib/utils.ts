import { clsx, type ClassValue } from "clsx"
import { BASE_URL } from "config";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toLocalDate(date: string) {
  const localDate = new Date(date).toString();
  return localDate;
}

export function canJoinRoom(date: string) {
  const scheduledDate = new Date(date);
  const currentDate = new Date();

  if (scheduledDate.getTime() > currentDate.getTime()) return false;
  return true;
}

export function roomJoinLink(roomId: string) {
  return `${BASE_URL}/room/join-room?id=${roomId}`;
}
