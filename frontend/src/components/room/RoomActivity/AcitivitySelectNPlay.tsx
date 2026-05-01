import { useStore } from '@tanstack/react-store'
import React, { lazy, useEffect } from 'react'
import { currentRoomActivity, roomActivities, roomData } from '@/store/room'
import { useSocket } from '@/socket'
import toast from 'react-hot-toast'

const CurrentActivity = lazy(() => import('./CurrentActivity'))

const AcitivitySelectNPlay = ({ activityId }: { activityId?: string }) => {
  const currentActivityId = useStore(currentRoomActivity, (s) => s?.id)

  const socket = useSocket('room')

  const handleSelectActivity = (id: string) => {
    socket?.emit('sync-activity', {
      roomId: roomData.state?.roomId,
      activityId: id,
    })
  }

  useEffect(() => {
    socket?.on('load-activity', (data) => {
      toast.success(`Activity changed to ${data.id}`)
      currentRoomActivity.setState({ ...data.activityData, id: data.id })
    })

    return () => {
      socket?.off('load-activity')
    }
  }, [socket])

  useEffect(() => {
    if (activityId) {
      currentRoomActivity.setState((s) => ({ ...s, id: activityId }));
    }
  }, [])

  return (
    <div className="px-3 py-2">
      {!currentActivityId ? (
        <>
          {/* Selector */}
          <h4>Select an Activity</h4>
          <div className="grid md:grid-cols-4 grid-cols-2 md:gap-10 gap-3 p-1">
            {roomActivities.state &&
              roomActivities.state.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() =>
                    handleSelectActivity(
                      activity.id,
                    )
                  }
                  className="flex flex-col items-center rounded-md p-1 border-[1px] border-r-2 border-b-2 hover:border-[1px] cursor-pointer border-primary-button transition transform duration-300 ease-in-out"
                >
                  <img
                    src={activity.logo}
                    alt={activity.key}
                    height={120}
                    width={120}
                  />
                  <strong>{activity.name}</strong>
                </div>
              ))}
          </div>
        </>
      ) : (
        <CurrentActivity />
      )}
    </div>
  )
}

export default AcitivitySelectNPlay
