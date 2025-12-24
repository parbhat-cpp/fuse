import { useRelativeTime } from '@/hooks/useRelativeTime'
import { Separator } from '../ui/separator'
import { cn } from '@/lib/utils'

interface ScheduledRoomListItemProps {
  room: {
    id: string
    user_id: string
    isPublic: boolean
    roomId: string
    roomName: string
    start_at: string
    status: string
    created_at: string
    updated_at: string
  }
}

export default function ScheduledRoomListItem({
  room,
}: ScheduledRoomListItemProps) {
  const relativeTime = useRelativeTime(room.start_at)

  return (
    <>
      <div key={room.roomId} className="flex justify-between items-center px-3">
        <div className="space-y-2">
          <p className="text-lg font-semibold">
            {room.roomName} ({room.roomId})
          </p>
          <div className="flex gap-3 items-center">
            {room.status === 'active' && <p>Ending in {relativeTime}</p>}
            {room.status === 'scheduled' && <p>Starting in {relativeTime}</p>}
            {room.status === 'ended' && <p>Ended {relativeTime}</p>}
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-xs font-medium',
            room.status === 'active' && 'bg-green-300 text-green-800',
            room.status === 'ended' && 'bg-red-300',
            room.status === 'scheduled' && 'bg-yellow-300 text-yellow-800',
          )}
        >
          {room.status}
        </span>
      </div>
      <Separator />
    </>
  )
}
