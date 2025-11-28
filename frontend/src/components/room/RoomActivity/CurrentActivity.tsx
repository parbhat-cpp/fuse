import React, { lazy } from 'react'
import { FaArrowLeft } from "react-icons/fa6";
import { currentRoomActivity } from '@/store/room';

const ReactPlayer = lazy(() => import('react-player'));
import {
    MediaController,
    MediaControlBar,
    MediaTimeRange,
    MediaTimeDisplay,
    MediaVolumeRange,
    MediaPlaybackRateButton,
    MediaPlayButton,
    MediaSeekBackwardButton,
    MediaSeekForwardButton,
    MediaMuteButton,
    MediaFullscreenButton,
} from "media-chrome/react";

const CurrentActivity = () => {
    const handleExitCurrentActivity = () => {
        currentRoomActivity.setState(undefined);
    }

    return (
        <div className='px-3 py-2'>
            <div>
                <button onClick={handleExitCurrentActivity} className='cursor-pointer'>
                    <FaArrowLeft size={24} />
                </button>
            </div>
            <MediaController
                style={{
                    width: "100%",
                    aspectRatio: "16/9",
                }}
            >
                <ReactPlayer
                    slot="media"
                    src="https://youtu.be/OEKnGHsjgzU?si=DUxNyhRd89Is7Zr9"
                    controls={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        // "--controls": "none",
                    }}
                ></ReactPlayer>
                <MediaControlBar>
                    <MediaPlayButton />
                    <MediaSeekBackwardButton seekOffset={10} />
                    <MediaSeekForwardButton seekOffset={10} />
                    <MediaTimeRange />
                    <MediaTimeDisplay showDuration />
                    <MediaMuteButton />
                    <MediaVolumeRange />
                    <MediaPlaybackRateButton />
                    <MediaFullscreenButton />
                </MediaControlBar>
            </MediaController>
        </div>
    )
}

export default CurrentActivity