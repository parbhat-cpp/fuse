import { MEDIASOUP_URL } from 'config';
import React, { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import * as mediasoupTypes from 'mediasoup-client/types';
import { Device } from 'mediasoup-client';
import toast from 'react-hot-toast';

interface MediasoupHookProps {
    userId: string;
    roomId: string;
    name: string;
};

type MediasoupSocket = Socket & { request: (type: string, data?: any) => Promise<any> };

const mediaType = {
    audio: 'audioType',
    video: 'videoType',
    screen: 'screenType'
};

const useMediasoup = (props: MediasoupHookProps) => {
    const [socket, setSocket] = useState<MediasoupSocket | null>(null);
    const producerTransportRef = useRef<mediasoupTypes.Transport>(null);
    const consumerTransportRef = useRef<mediasoupTypes.Transport>(null);
    // const [producerTransport, setProducerTransport] = useState<mediasoupTypes.Transport | null>(null);
    // const [consumerTransport, setConsumerTransport] = useState<mediasoupTypes.Transport | null>(null);
    const deviceRef = useRef<mediasoupTypes.Device>(null);
    // const [device, setDevice] = useState<mediasoupTypes.Device | null>(null);
    const [producerLabel, setProducerLabel] = useState<Map<string, string>>(new Map());
    const [consumers, setConsumers] = useState<Map<string, mediasoupTypes.Consumer>>(new Map());
    const [producers, setProducers] = useState<Map<string, mediasoupTypes.Producer>>(new Map());
    const localVideoStreamRef = useRef<MediaStream>(null);
    const localAudioStreamRef = useRef<MediaStream>(null);
    // const [localStream, setLocalStream] = useState<{ kind: string; stream: MediaStream; id: string }>();
    const [remoteStreams, setRemoteStreams] = useState<Array<{ kind: string; stream: MediaStream; id: string }>>([]);

    // mediasoup connection
    useEffect(() => {
        let socketIo: MediasoupSocket = io(`${MEDIASOUP_URL}/vc?userId=${props.userId}&roomId=${props.roomId}&name=${props.name}`, {
            transports: ["websocket"],
            autoConnect: true,
        }) as MediasoupSocket;

        socketIo.request = function request(type: string, data = {}) {
            return new Promise((resolve, reject) => {
                socketIo.emit(type, data, (data: any) => {
                    if (data.error) {
                        reject(data.error);
                    } else {
                        resolve(data);
                    }
                });
            });
        }

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        connectRoom();
        // produce(mediaType.video);
        // produce(mediaType.audio);

        socket.on("consumer-closed", ({ consumerId }) => {
            removeConsumer(consumerId);
        });

        socket.on("new-producers", async (data) => {
            for (let { producerId } of data) {
                await consume(producerId);
            }
        });

        socket.on("new-producer", async (data) => {
            for (let { producerId } of data) {
                await consume(producerId);
            }
        });

        socket.on("disconnect", () => {
            exit();
        });

        return () => {
            socket.off("consumer-closed");
            socket.off("new-producers");
            socket.off("new-producer");
            socket.off("disconnect");
        };
    }, [socket]);

    useEffect(() => {
        if (!producerTransportRef.current) return;

        // Listen for connection state
        const handleConnectionState = (state: mediasoupTypes.ConnectionState) => {
            if (state === 'connected') {
                produce(mediaType.video);
                produce(mediaType.audio);
            }
        };

        producerTransportRef.current.on('connectionstatechange', handleConnectionState);

        // If already connected, produce immediately
        if (producerTransportRef.current.connectionState === 'connected') {
            produce(mediaType.video);
            produce(mediaType.audio);
        }

        return () => {
            producerTransportRef.current?.off('connectionstatechange', handleConnectionState);
        };
    }, [producerTransportRef]);

    async function connectRoom() {
        try {
            const data = await socket?.request("get-router-rtp-capabilities");
            let loadedDevice = await loadDevice(data);
            deviceRef.current = loadedDevice!;
            await initTransports(loadedDevice!);
            socket?.emit('get-producers');
        } catch (error) {
            toast.error((error as Error).message);
        }
    }

    async function loadDevice(routerRtpCapabilities: mediasoupTypes.RtpCapabilities) {
        let loadedDevice: mediasoupTypes.Device | undefined = undefined;
        try {
            loadedDevice = new Device();
        } catch (error) {
            const err = error as Error;
            if (err.name === "UnsupportedError") {
                toast.error('Browser not supported');
            }
        }
        await loadedDevice?.load({
            routerRtpCapabilities,
        });
        return loadedDevice;
    }

    async function initTransports(device: mediasoupTypes.Device) {
        // init producer transport
        {
            const data = await socket?.request('create-webrtc-transport', {
                forceTcp: false,
                rtpCapabilities: device.rtpCapabilities,
            });

            if (data.error) return;

            let producer = device.createSendTransport(data);

            producer.on("connect",
                async function ({ dtlsParameters }, callback, errback) {
                    socket?.request("connect-transport", {
                        dtlsParameters,
                        transportId: data.id,
                    })
                        .then(callback)
                        .catch(errback);
                }
            );

            producer.on("produce",
                async function ({ kind, rtpParameters }, callback, errback) {
                    try {
                        const { producerId } = await socket?.request("produce", {
                            producerTransportId: producer.id,
                            kind,
                            rtpParameters,
                        });

                        callback({
                            id: producerId,
                        });
                    } catch (error) {
                        toast.error(error as string);
                        errback(error as Error);
                    }
                }
            );
            // setProducerTransport(producer);
            producerTransportRef.current = producer;
            produce(mediaType.video);
            produce(mediaType.audio);
        }

        // init consumer transport
        {
            const data = await socket?.request('create-webrtc-transport', {
                forceTcp: false,
            });

            if (data.error) return;

            const consumer = device.createRecvTransport(data);
            consumer.on("connect",
                function ({ dtlsParameters }, callback, errback) {
                    socket?.request("connect-transport", {
                        transportId: consumer.id,
                        dtlsParameters,
                    })
                        .then(callback)
                        .catch(errback);
                }
            );

            consumer.on('connectionstatechange',
                async function (state) {
                    switch (state) {
                        case 'connecting':
                            break

                        case 'connected':
                            //remoteVideo.srcObject = await stream;
                            await socket?.request('resume', consumer.id);
                            setRemoteStreams((prev) => {
                                let updatedRemoteStreams = prev;
                                updatedRemoteStreams.forEach(({ id, kind, stream }, index) => {
                                    if (consumer.id === id) {
                                        updatedRemoteStreams[index] = { ...updatedRemoteStreams[index], kind, stream };
                                    }
                                });
                                return updatedRemoteStreams;
                            });
                            break

                        case 'failed':
                            consumerTransportRef.current?.close();
                            break

                        default:
                            break
                    }
                }
            );

            consumerTransportRef.current = consumer;
            // setConsumerTransport(consumer);
        }
    }

    async function consume(producerId: string) {
        const existingConsumer = Array.from(consumers.values()).find(
            c => c.producerId === producerId
        );

        if (existingConsumer) {
            console.log('consumer exists');
            console.log(existingConsumer);
            return;
        }

        const consumerStream = await getConsumeStream(producerId);

        if (!consumerStream) {
            console.error('❌ getConsumeStream returned null/undefined');
            return;
        }

        const { consumer, kind, stream } = consumerStream;

        if (!consumer) return;

        if (consumer.paused) {
            console.log('⏸️ Consumer is paused, resuming...');

            try {
                // Resume locally first
                consumer.resume();
                console.log('✅ Consumer resumed locally');

                // Then notify server
                await socket?.request('resume', consumer.id);
                console.log('✅ Consumer resumed on server');
            } catch (error) {
                console.error('❌ Failed to resume consumer:', error);

                // Try alternative endpoint names
                try {
                    await socket?.request('resume-consumer', {
                        consumerId: consumer.id
                    });
                    console.log('✅ Consumer resumed (alt method)');
                } catch (err2) {
                    console.error('❌ All resume methods failed');
                }
            }
        } else {
            console.log('▶️ Consumer is already playing');
        }

        // Wait a moment for resume to take effect
        await new Promise(resolve => setTimeout(resolve, 100));

        if (kind === 'video') {
            setRemoteStreams((prev) => {
                if (prev.some(s => s.id === consumer.id)) {
                    return prev;
                }
                return [...prev, { kind: 'video', stream: stream, id: consumer.id }];
            });
        } else {
            setRemoteStreams((prev) => {
                if (prev.some(s => s.id === consumer.id)) {
                    return prev;
                }
                return [...prev, { kind: 'audio', stream: stream, id: consumer.id }];
            });
        }

        consumer.on('trackended',
            function () {
                removeConsumer(consumer.id);
            }
        );

        consumer.on('transportclose',
            function () {
                removeConsumer(consumer.id);
            }
        );

        setConsumers((prev) => {
            const newMap = new Map(prev);
            newMap.set(consumer.id, consumer);
            return newMap;
        });
    }

    async function getConsumeStream(producerId: string) {

        if (!deviceRef.current) return;

        const { rtpCapabilities } = deviceRef.current;

        const data = await socket?.request("consume", {
            rtpCapabilities,
            consumerTransportId: consumerTransportRef.current?.id,
            producerId,
        });

        const { id, kind, rtpParameters } = data;

        let codecOptions = {};
        const consumer = await consumerTransportRef.current?.consume({
            id,
            kind,
            producerId,
            rtpParameters,
        });

        const stream = new MediaStream();
        stream.addTrack(consumer?.track!);

        return {
            consumer,
            stream,
            kind,
        };
    }

    function removeConsumer(consumerId: string) {
        setRemoteStreams((prev) => prev.filter(remoteStream => remoteStream.id !== consumerId));
        setConsumers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(consumerId);
            return newMap;
        });
    }

    async function produce(type: string, deviceId = null) {
        let mediaConstraints = {}
        let audio = false
        let screen = false

        switch (type) {
            case mediaType.audio:
                mediaConstraints = {
                    audio: {
                        deviceId: deviceId,
                    },
                    video: false,
                };
                audio = true;
                break;
            case mediaType.video:
                mediaConstraints = {
                    audio: false,
                    video: {
                        width: {
                            min: 640,
                            ideal: 1920
                        },
                        height: {
                            min: 400,
                            ideal: 1080
                        },
                        deviceId: deviceId
                        /*aspectRatio: {
                                        ideal: 1.7777777778
                                    }*/
                    },
                };
                break;
            case mediaType.screen:
                mediaConstraints = false;
                screen = true;
                break;
            default:
                return;
        }

        if (producerLabel.has(type)) {
            console.log(`${producerLabel} ${type} exists`);

            return
        };

        let stream: MediaStream;

        try {
            stream = screen
                ? await navigator.mediaDevices.getDisplayMedia()
                : await navigator.mediaDevices.getUserMedia(mediaConstraints);

            const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            const params: Record<string, any> = { track };

            if (!track) {
                console.error('❌ No track found!');
                toast.error(`No ${audio ? 'audio' : 'video'} track available`);
                return;
            }

            console.log('Track details:', {
                id: track.id,
                kind: track.kind,
                label: track.label,
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState,
                settings: track.getSettings()
            });

            if (!audio) {
                const settings = track.getSettings();
                console.log('Video track settings:', settings);

                if (settings.width && settings.height) {
                    console.log(`✅ Video dimensions: ${settings.width}x${settings.height}`);
                } else {
                    console.error('❌ Video track has no dimensions!');
                    toast.error('Video track has no dimensions');
                    return;
                }
            }

            if (!audio && !screen) {
                params.encodings = [
                    {
                        rid: 'r0',
                        maxBitrate: 100000,
                        //scaleResolutionDownBy: 10.0,
                        scalabilityMode: 'S1T3'
                    },
                    {
                        rid: 'r1',
                        maxBitrate: 300000,
                        scalabilityMode: 'S1T3'
                    },
                    {
                        rid: 'r2',
                        maxBitrate: 900000,
                        scalabilityMode: 'S1T3'
                    }
                ];
                params.codecOptions = {
                    videoGoogleStartBitrate: 1000,
                };
            }
            const producer = await producerTransportRef.current?.produce(params);

            if (!producer) return;

            setProducers((prev) => {
                const newMap = new Map(prev);
                newMap.set(producer.id, producer);
                return newMap;
            });

            if (audio) {
                localAudioStreamRef.current = stream;
            } else {
                localVideoStreamRef.current = stream;
                console.log('Video stream stored in ref:', stream);
                console.log('Video stream active:', stream.active);
                console.log('Video stream tracks:', stream.getTracks());
            }

            producer.on('trackended', () => {
                closeProducer(type);
            });

            producer.on('transportclose', () => {
                // console.log('Producer transport close')
                // if (!audio) {
                //     elem.srcObject.getTracks().forEach(function (track) {
                //         track.stop()
                //     })
                //     elem.parentNode.removeChild(elem)
                // }
                setProducers((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(producer.id);
                    return newMap;
                });
            });

            setProducerLabel((prev) => {
                const newMap = new Map(prev);
                newMap.set(type, producer.id);
                return newMap;
            });

            // switch (type) {
            //     case mediaType.audio:
            //         this.event(_EVENTS.startAudio)
            //         break
            //     case mediaType.video:
            //         this.event(_EVENTS.startVideo)
            //         break
            //     case mediaType.screen:
            //         this.event(_EVENTS.startScreen)
            //         break
            //     default:
            //         return
            // }
        } catch (error) {
            console.error('❌ Error in produce:', error);
            toast.error(`Failed to produce ${type}: ${(error as Error).message}`);
        }
    }

    function closeProducer(type: string) {
        if (!producerLabel.has(type)) return;

        let producerId = producerLabel.get(type);
        socket?.emit("producer-closed", {
            producerId,
        });

        setProducers((prev) => {
            const newMap = new Map(prev);
            newMap.get(producerId!)?.close();
            newMap.delete(producerId!);
            return newMap;
        });

        setProducerLabel((prev) => {
            const newMap = new Map(prev);
            newMap.delete(type);
            return newMap;
        });

        // if (type !== mediaType.audio) {
        //     let elem = document.getElementById(producer_id)
        //     elem.srcObject.getTracks().forEach(function (track) {
        //         track.stop()
        //     })
        //     elem.parentNode.removeChild(elem)
        // }

        // switch (type) {
        //     case mediaType.audio:
        //         this.event(_EVENTS.stopAudio)
        //         break
        //     case mediaType.video:
        //         this.event(_EVENTS.stopVideo)
        //         break
        //     case mediaType.screen:
        //         this.event(_EVENTS.stopScreen)
        //         break
        //     default:
        //         return
        // }
    }

    function pauseProducer(type: string) {
        if (!producerLabel.has(type)) return;

        let producerId = producerLabel.get(type);
        setProducers((prev) => {
            prev.get(producerId!)?.pause();
            return prev;
        });
    }

    function resumeProducer(type: string) {
        if (!producerLabel.has(type)) return;

        let producerId = producerLabel.get(type);
        setProducers((prev) => {
            prev.get(producerId!)?.resume();
            return prev;
        });
    }

    function exit() {
        consumerTransportRef.current?.close();
        producerTransportRef.current?.close();

        // setProducerLabel(new Map());
        // setConsumers(new Map());
        // setProducers(new Map());
        // localVideoStreamRef.current = null;
        // localAudioStreamRef.current = null;
        // setRemoteStreams([]);
        // deviceRef.current = null;

        socket?.disconnect();
        socket?.request('exit-room');
    }


    return { localVideoStreamRef, localAudioStreamRef, remoteStreams, exit };
}

export default useMediasoup;
