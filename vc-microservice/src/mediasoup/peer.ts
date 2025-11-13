import { Injectable, Logger } from "@nestjs/common";
import type * as mediasoupTypes from "mediasoup/types";

@Injectable()
export class Peer {
    socketId: string;
    userId: string;
    name: string;
    transports: Map<string, mediasoupTypes.Transport> = new Map();
    consumers: Map<string, mediasoupTypes.Consumer> = new Map();
    producers: Map<string, mediasoupTypes.Producer> = new Map();

    private readonly logger = new Logger(Peer.name);

    constructor(socketId: string, userId: string, name: string) {
        this.socketId = socketId;
        this.userId = userId;
        this.name = name;
    }

    addTransport(transport: mediasoupTypes.Transport) {
        this.transports.set(transport.id, transport);
    }

    async connectTransport(transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters) {
        if (!this.transports.has(transportId)) return;

        await this.transports.get(transportId)?.connect({
            dtlsParameters: dtlsParameters,
        });
    }

    async createProducer(producerTransportId: string, rtpParameters: mediasoupTypes.RtpParameters, kind: mediasoupTypes.MediaKind): Promise<mediasoupTypes.Producer | null> {
        let producer = this.transports.get(producerTransportId);

        if (!producer) return null;

        const newProducer = await producer.produce({
            kind,
            rtpParameters,
        });

        this.producers.set(producer.id, newProducer);
        newProducer.on('transportclose',
            (() => {
                this.logger.warn(`producer transport closed [${newProducer.id}]`);
                newProducer.close();
                this.producers.delete(newProducer.id);
            }).bind(this),
        );

        return newProducer;
    }

    async createConsumer(consumerTransportId: string, producerId: string, rtpCapabilities: mediasoupTypes.RtpCapabilities) {
        let consumerTransport = this.transports.get(consumerTransportId);
        let consumer: mediasoupTypes.Consumer | undefined;

        try {
            consumer = await consumerTransport?.consume({
                producerId,
                rtpCapabilities,
                paused: false,
            });
        } catch (error) {
            this.logger.error(`unable to create consumer: ${error}`);
            return;
        }

        if (!consumer) return;

        if (consumer.type === 'simulcast') {
            await consumer.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 2,
            });
        }

        this.consumers.set(consumer.id, consumer);

        consumer.on('transportclose',
            (() => {
                this.logger.warn(`consumer transport closed [${consumer.id}]`);
                this.consumers.delete(consumer.id);
            }).bind(this),
        );

        return {
            consumer,
            params: {
                producerId,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.paused,
            },
        };
    }

    clearProducer(producerId: string) {
        try {
            this.producers.get(producerId)?.close();
        } catch (error) {
            this.logger.warn(`unable to close producer [${producerId}]`);
        }

        this.producers.delete(producerId);
    }

    getProducer(producerId: string) {
        return this.producers.get(producerId);
    }

    close() {
        this.transports.forEach((transport) => transport.close());
    }

    removeConsumer(consumerId: string) {
        this.consumers.delete(consumerId);
    }
}
