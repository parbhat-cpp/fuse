import { useEffect, useState } from 'react'
import { getNextUpdate, getRelativeTime } from '@/lib/utils'

export function useRelativeTime(date: string) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    let timer

    const update = () => {
      const now = Date.now()
      const diff = new Date(date).getTime() - now
      setLabel(getRelativeTime(date) as string)

      timer = setTimeout(update, getNextUpdate(diff))
    }

    update()
    return () => clearTimeout(timer)
  }, [date])

  return label
}
