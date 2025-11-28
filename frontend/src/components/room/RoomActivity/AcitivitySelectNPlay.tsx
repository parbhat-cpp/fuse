import { currentRoomActivity, roomActivities } from '@/store/room'
import { useStore } from '@tanstack/react-store';
import React, { lazy } from 'react'

const CurrentActivity = lazy(() => import('./CurrentActivity'));

const AcitivitySelectNPlay = () => {
    const activityId = useStore(currentRoomActivity, (s) => s?.id);

    const handleSelectActivity = (id: string, name: string, logo: string) => {
        currentRoomActivity.setState({ id, name, logo });
    }

    return (
        <div className='px-3 py-2'>
            {
                !activityId ?
                    <>
                        {/* Selector */}
                        <h4>Select an Activity</h4>
                        <div className='grid md:grid-cols-4 grid-cols-2 md:gap-10 gap-3 p-1'>
                            {
                                roomActivities.state && roomActivities.state.map((activity) => (
                                    <div
                                        key={activity.id}
                                        onClick={() => handleSelectActivity(activity.id, activity.name, activity.logo)}
                                        className='flex flex-col items-center rounded-md p-1 border-[1px] border-r-2 border-b-2 hover:border-[1px] cursor-pointer border-primary-button transition transform duration-300 ease-in-out'>
                                        <img src={activity.logo} alt={activity.key} height={120} width={120} />
                                        <strong>{activity.name}</strong>
                                    </div>
                                ))
                            }
                        </div>
                    </>
                    : <CurrentActivity />
            }
        </div>
    )
}

export default AcitivitySelectNPlay