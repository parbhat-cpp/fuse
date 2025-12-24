import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { useRelativeTime } from '@/hooks/useRelativeTime'

interface PublicRoomListItemProps {
  room: {
    roomName: string
    startAt: string
    attendeesCount: number
    roomId: string
  }
}

export default function PublicRoomListItem({ room }: PublicRoomListItemProps) {
  const relativeTime = useRelativeTime(room.startAt)

  return (
    <>
      <div key={room.roomId} className="flex justify-between items-center px-3">
        <div className="space-y-2">
          <p className="text-lg font-semibold">
            {room.roomName} ({room.roomId})
          </p>
          <p>Ends in {relativeTime}</p>
        </div>
        <Button>Join</Button>
      </div>
      <Separator />
    </>
  )
}
