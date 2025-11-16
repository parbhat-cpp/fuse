// import { useEffect, useRef } from "react";

import { useEffect, useRef } from "react";

interface RemoteVideoProps {
    remoteStream: { kind: string; stream: MediaStream; id: string };
}

// const RemoteVideo: React.FC<RemoteVideoProps> = ({ remoteStream }) => {
//     const videoRef = useRef<HTMLVideoElement>(null);
//     const audioRef = useRef<HTMLAudioElement>(null);

//     useEffect(() => {
//         console.log('RemoteVideo effect running for:', remoteStream.id, remoteStream.kind);

//         if (remoteStream.kind === 'video' && videoRef.current) {
//             const videoElement = videoRef.current;

//             console.log('Attaching video stream to video element');
//             console.log('Stream:', remoteStream.stream);
//             console.log('Stream active:', remoteStream.stream.active);
//             console.log('Stream tracks:', remoteStream.stream.getTracks());

//             // ✅ Set srcObject
//             videoElement.srcObject = remoteStream.stream;

//             // ✅ Wait for loadedmetadata before playing
//             const handleLoadedMetadata = () => {
//                 console.log('Video metadata loaded for:', remoteStream.id);
//                 console.log('Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);

//                 // Play the video
//                 const playPromise = videoElement.play();

//                 if (playPromise !== undefined) {
//                     playPromise
//                         .then(() => {
//                             console.log('✅ Video playing:', remoteStream.id);
//                         })
//                         .catch((err: any) => {
//                             console.error('❌ Video play failed:', remoteStream.id, err);
//                             // If autoplay fails, video will play when user interacts
//                         });
//                 }
//             };

//             // ✅ Add event listener
//             videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

//             // ✅ Cleanup function
//             return () => {
//                 console.log('Cleaning up video element for:', remoteStream.id);
//                 videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
//                 videoElement.srcObject = null;
//             };
//         }

//         if (remoteStream.kind === 'audio' && audioRef.current) {
//             const audioElement = audioRef.current;

//             console.log('Attaching audio stream to audio element');
//             audioElement.srcObject = remoteStream.stream;

//             const handleLoadedMetadata = () => {
//                 console.log('Audio metadata loaded for:', remoteStream.id);

//                 const playPromise = audioElement.play();

//                 if (playPromise !== undefined) {
//                     playPromise
//                         .then(() => {
//                             console.log('✅ Audio playing:', remoteStream.id);
//                         })
//                         .catch(err => {
//                             console.error('❌ Audio play failed:', remoteStream.id, err);
//                         });
//                 }
//             };

//             audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

//             return () => {
//                 console.log('Cleaning up audio element for:', remoteStream.id);
//                 audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
//                 audioElement.srcObject = null;
//             };
//         }
//     }, [remoteStream.stream, remoteStream.id, remoteStream.kind]);

//     if (remoteStream.kind === 'video') {
//         return (
//             <div style={{ margin: 10 }}>
//                 <p>Video Stream: {remoteStream.id}</p>
//                 <video
//                     id={remoteStream.id}
//                     ref={videoRef}
//                     autoPlay
//                     playsInline
//                     style={{
//                         width: 300,
//                         height: 200,
//                         border: '2px solid green',
//                         backgroundColor: 'black'
//                     }}
//                 />
//             </div>
//         );
//     }

//     if (remoteStream.kind === 'audio') {
//         return (
//             <div style={{ margin: 10 }}>
//                 <p>Audio Stream: {remoteStream.id}</p>
//                 <audio
//                     ref={audioRef}
//                     autoPlay
//                 />
//             </div>
//         );
//     }

//     return null;
// };

// export default RemoteVideo;

const RemoteVideo: React.FC<RemoteVideoProps> = ({ remoteStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        console.log('=== REMOTE VIDEO COMPONENT ===');
        console.log('Remote stream ID:', remoteStream.id);
        console.log('Remote stream kind:', remoteStream.kind);
        console.log('Remote stream object:', remoteStream.stream);
        console.log('Stream active:', remoteStream.stream.active);
        console.log('Stream ID:', remoteStream.stream.id);
        console.log('All tracks:', remoteStream.stream.getTracks());
        console.log('Video tracks:', remoteStream.stream.getVideoTracks());
        console.log('Audio tracks:', remoteStream.stream.getAudioTracks());

        if (remoteStream.stream.getTracks().length > 0) {
            const track = remoteStream.stream.getTracks()[0];
            console.log('Track details:', {
                id: track.id,
                kind: track.kind,
                label: track.label,
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState,
                settings: track.getSettings()
            });
        }

        if (remoteStream.kind === 'video' && videoRef.current) {
            const videoElement = videoRef.current;

            console.log('Attaching stream to video element');
            videoElement.srcObject = remoteStream.stream;

            videoElement.onloadedmetadata = () => {
                console.log('✅ Video metadata loaded');
                console.log('Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
                console.log('Video readyState:', videoElement.readyState);

                videoElement.play()
                    .then(() => {
                        console.log('✅ Video is playing');
                        console.log('Video paused:', videoElement.paused);
                        console.log('Video ended:', videoElement.ended);
                        console.log('Video currentTime:', videoElement.currentTime);
                    })
                    .catch(err => {
                        console.error('❌ Play failed:', err);
                    });
            };

            videoElement.onerror = (e) => {
                console.error('❌ Video error:', e);
            };

            videoElement.onplaying = () => {
                console.log('✅ Video playing event fired');
            };

            videoElement.onstalled = () => {
                console.warn('⚠️ Video stalled');
            };

            videoElement.onsuspend = () => {
                console.warn('⚠️ Video suspended');
            };

            videoElement.onwaiting = () => {
                console.warn('⚠️ Video waiting for data');
            };

            return () => {
                console.log('Cleaning up video element');
                videoElement.srcObject = null;
            };
        }
    }, [remoteStream]);

    if (remoteStream.kind === 'video') {
        return (
            <div style={{ margin: 10, border: '2px solid blue', padding: 10 }}>
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
            <div style={{ margin: 10, border: '2px solid orange', padding: 10 }}>
                <p>Audio Stream: {remoteStream.id}</p>
                <audio
                    autoPlay
                    ref={(el) => {
                        if (el) {
                            el.srcObject = remoteStream.stream;
                        }
                    }}
                />
            </div>
        );
    }

    return null;
};

export default RemoteVideo;
