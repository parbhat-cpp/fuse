import { Injectable, Logger } from "@nestjs/common";
import type * as mediasoupTypes from "mediasoup/types";
import type { Socket } from "socket.io";
import { Peer } from "./peer";
import config from "src/config";

@Injectable()
export class Room {
    private roomId: string;
    private peers: Map<string, Peer> = new Map();
    private router: mediasoupTypes.Router;
    private io: Socket;
    private userIdToSocketId: Map<string, string>;

    private readonly logger = new Logger(Room.name);

    constructor(roomId: string, worker: mediasoupTypes.Worker, io: Socket, userIdToSocketId: Map<string, string>) {
        this.roomId = roomId;

        const mediaCodecs = config.mediasoup.router.mediaCodecs as mediasoupTypes.RouterRtpCodecCapability[];

        worker
            .createRouter({
                mediaCodecs,
            })
            .then(
                (
                    (router) => {
                        this.router = router;
                    }
                ).bind(this),
            );

        this.io = io;
        this.userIdToSocketId = userIdToSocketId;
        this.logger.debug(`router   \n${this.router}`);
    }

    addPeer(peer: Peer) {
        this.peers.set(peer.userId, peer);
    }

    getProducerListForPeer() {
        let producerList: { producerId: string; }[] = [];
        this.peers.forEach(peer => {
            peer.producers.forEach(producer => {
                producerList.push({
                    producerId: producer.id,
                });
            });
        });

        return producerList;
    }

    getRtpCapabilities() {
        return this.router.rtpCapabilities;
    }

    async createWebRtcTransport(userId: string) {
        const { initialAvailableOutgoingBitrate, maxIncomingBitrate, listenIps } = config.mediasoup.webRtcTransport;

        const transport = await this.router.createWebRtcTransport({
            listenIps,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate,
        });

        if (maxIncomingBitrate) {
            try {
                await transport.setMaxIncomingBitrate(maxIncomingBitrate);
            } catch (error) { }
        }

        transport.on(
            'dtlsstatechange',
            (
                (dtlsState) => {
                    if (dtlsState === 'closed') {
                        this.logger.log(`transport close: ${this.peers.get(userId)?.name}`);
                        transport.close();
                    }
                }
            ).bind(this),
        );

        transport.on('@close', () => {
            this.logger.log(`transport close ${this.peers.get(userId)?.name}`);
        });

        this.peers.get(userId)?.addTransport(transport);

        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            },
        };
    }

    async connectPeerTransport(userId: string, transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters) {
        if (!this.peers.has(userId)) return;

        await this.peers.get(userId)?.connectTransport(transportId, dtlsParameters);
    }

    async produce(userId: string, producerTransportId: string, rtpParameters: mediasoupTypes.RtpParameters, kind: mediasoupTypes.MediaKind) {
        return new Promise((async (resolve, reject) => {
            let producer = await this.peers.get(userId)?.createProducer(producerTransportId, rtpParameters, kind);
            resolve(producer?.id);
            this.broadcast(userId, 'new-producer', [
                {
                    producerId: producer?.id,
                    producerUserId: userId,
                },
            ]);
        }).bind(this),
        );
    }

    async consume(userId: string, consumerTransportId: string, producerId: string, rtpCapabilities: mediasoupTypes.RtpCapabilities) {
        if (!this.router.canConsume({ producerId, rtpCapabilities })) {
            return;
        }

        const peer = this.peers.get(userId);

        if (!peer) return;

        let consumer = await peer.createConsumer(consumerTransportId, producerId, rtpCapabilities);

        if (!consumer) return;
        consumer.consumer.on(
            'producerclose',
            (() => {
                this.peers.get(userId)?.removeConsumer(consumer.consumer.id);
                this.io.to(this.userIdToSocketId.get(userId)!).emit('consumer-closed', {
                    consumerId: consumer.consumer.id,
                });
            }).bind(this),
        );
        return consumer.params;
    }

    async removePeer(userId: string) {
        this.peers.get(userId)?.close();
        this.peers.delete(userId);
    }

    closeProducer(userId: string, producerId: string) {
        this.peers.get(userId)?.clearProducer(producerId);
    }

    broadcast(userId: string, name: string, data) {
        for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== userId)) {
            this.send(otherID, name, data);
        }
    }

    send(userId: string, name: string, data) {
        this.io.to(this.userIdToSocketId.get(userId)!).emit(name, data);
    }

    getPeers() {
        return this.peers;
    }

    toJson() {
        return {
            id: this.roomId,
            peers: JSON.stringify([...this.peers])
        }
    }

    isRoomEmpty() {
        if (!Object.keys(this.peers).length) return true;
        return false;
    }
}
