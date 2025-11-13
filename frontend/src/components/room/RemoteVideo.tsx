// import React, { useEffect, useRef } from 'react'

import { useEffect, useRef } from "react";

// const RemoteVideo = ({ id, kind, stream }: { stream: MediaStream; id: string; kind: string }) => {
//     const remoteStreamRef = useRef<HTMLVideoElement>(null);

//     useEffect(() => {
//         if (remoteStreamRef.current && stream) {
//             remoteStreamRef.current.id = id;
//             remoteStreamRef.current.srcObject = stream;
//             remoteStreamRef.current.play().catch(err => {
//                 console.error('Error playing video:', err);
//             });
//         }
//     }, [stream]);

//     return (
//         <video
//             ref={remoteStreamRef}
//             height={200}
//             width={350}
//             autoPlay
//             muted
//             playsInline
//         />
//     )
// }

// export default RemoteVideo;

interface RemoteVideoProps {
    remoteStream: { kind: string; stream: MediaStream; id: string };
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ remoteStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        console.log('RemoteVideo effect running for:', remoteStream.id, remoteStream.kind);

        if (remoteStream.kind === 'video' && videoRef.current) {
            const videoElement = videoRef.current;

            console.log('Attaching video stream to video element');
            console.log('Stream:', remoteStream.stream);
            console.log('Stream active:', remoteStream.stream.active);
            console.log('Stream tracks:', remoteStream.stream.getTracks());

            // ✅ Set srcObject
            videoElement.srcObject = remoteStream.stream;

            // ✅ Wait for loadedmetadata before playing
            const handleLoadedMetadata = () => {
                console.log('Video metadata loaded for:', remoteStream.id);
                console.log('Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);

                // Play the video
                const playPromise = videoElement.play();

                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('✅ Video playing:', remoteStream.id);
                        })
                        .catch((err: any) => {
                            console.error('❌ Video play failed:', remoteStream.id, err);
                            // If autoplay fails, video will play when user interacts
                        });
                }
            };

            // ✅ Add event listener
            videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

            // ✅ Cleanup function
            return () => {
                console.log('Cleaning up video element for:', remoteStream.id);
                videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
                videoElement.srcObject = null;
            };
        }

        if (remoteStream.kind === 'audio' && audioRef.current) {
            const audioElement = audioRef.current;

            console.log('Attaching audio stream to audio element');
            audioElement.srcObject = remoteStream.stream;

            const handleLoadedMetadata = () => {
                console.log('Audio metadata loaded for:', remoteStream.id);

                const playPromise = audioElement.play();

                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('✅ Audio playing:', remoteStream.id);
                        })
                        .catch(err => {
                            console.error('❌ Audio play failed:', remoteStream.id, err);
                        });
                }
            };

            audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

            return () => {
                console.log('Cleaning up audio element for:', remoteStream.id);
                audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audioElement.srcObject = null;
            };
        }
    }, [remoteStream.stream, remoteStream.id, remoteStream.kind]);

    if (remoteStream.kind === 'video') {
        return (
            <div style={{ margin: 10 }}>
                <p>Video Stream: {remoteStream.id}</p>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        width: 300,
                        height: 200,
                        border: '2px solid green',
                        backgroundColor: 'black'
                    }}
                />
            </div>
        );
    }

    if (remoteStream.kind === 'audio') {
        return (
            <div style={{ margin: 10 }}>
                <p>Audio Stream: {remoteStream.id}</p>
                <audio
                    ref={audioRef}
                    autoPlay
                />
            </div>
        );
    }

    return null;
};

export default RemoteVideo;
