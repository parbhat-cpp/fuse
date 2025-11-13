import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';
import type * as mediasoupTypes from 'mediasoup/types';
import config from 'src/config';
import { Logger } from '@nestjs/common';
import { Room } from './room';
import { Peer } from './peer';

@WebSocketGateway({
  namespace: "/vc",
  cors: {
    origin: "*",
  },
})
export class MediasoupGateway implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private roomList: Map<string, Room> = new Map();
  private userIdToSocketId: Map<string, string> = new Map();

  private workers: Array<mediasoupTypes.Worker> = [];
  private nextMediasoupWorkerIdx: number = 0;

  private logger = new Logger(MediasoupGateway.name);

  async afterInit(server: Server) {
    await this.createWorkers();
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const query = client.handshake.query;
    const roomId = query.roomId as string;
    const userId = query.userId as string;
    const name = query.name as string;

    if (!roomId || !userId || !name) {
      throw new WsException('Bad Request: Please provide both room id and user id');
    }

    client.data.roomId = roomId;
    client.data.userId = userId;
    client.data.name = name;

    this.userIdToSocketId.set(userId, client.id);

    if (!this.roomList.has(roomId)) {
      let worker = this.getMediasoupWorker();
      this.roomList.set(roomId, new Room(roomId, worker, client, this.userIdToSocketId));
    }

    this.roomList.get(roomId)?.addPeer(
      new Peer(
        this.userIdToSocketId.get(userId)!,
        userId,
        name,
      ),
    );
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const roomId = client.data.roomId;
    const userId = client.data.userId;

    this.roomList.get(roomId)?.removePeer(
      userId,
    );
    this.userIdToSocketId.delete(userId);
  }

  async createWorkers() {
    let { numWorkers } = config.mediasoup;

    for (let i = 0; i < numWorkers; i++) {
      let worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.worker.logLevel as mediasoupTypes.WorkerLogLevel,
        logTags: config.mediasoup.worker.logTags as mediasoupTypes.WorkerLogTag[],
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
      });

      worker.on('died', () => {
        this.logger.error(`worker died [pid:${worker.pid}]`);
        setTimeout(() => {
          process.exit(1);
        }, 2000);
      });

      this.workers.push(worker);
    }
  }

  getMediasoupWorker() {
    const worker = this.workers[this.nextMediasoupWorkerIdx];

    if (++this.nextMediasoupWorkerIdx === this.workers.length) this.nextMediasoupWorkerIdx = 0;

    return worker;
  }

  @SubscribeMessage('get-producers')
  async getProducers(@ConnectedSocket() client: Socket, @MessageBody() _: string) {
    const roomId = client.data.roomId;

    if (!this.roomList.get(roomId)) return;

    let producerList = this.roomList.get(roomId)?.getProducerListForPeer();
    client.emit('new-producers', producerList);
  }

  @SubscribeMessage('get-router-rtp-capabilities')
  getRouterRtpCapabilities(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      return this.roomList.get(client.data.roomId)?.getRtpCapabilities();
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('create-webrtc-transport')
  async createWebRtcTransport(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    try {
      const transport = await this.roomList.get(client.data.roomId)?.createWebRtcTransport(client.data.userId);

      if (!transport) return;

      return transport.params;
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('connect-transport')
  async connectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody() {
      dtlsParameters,
      transportId,
    }: {
      transportId: string;
      dtlsParameters: mediasoupTypes.DtlsParameters;
    },
  ) {
    const roomId = client.data.roomId;
    const userId = client.data.userId;

    if (!this.roomList.has(roomId)) return;

    await this.roomList.get(roomId)?.connectPeerTransport(userId, transportId, dtlsParameters);

    return 'success';
  }

  @SubscribeMessage('produce')
  async produce(
    @ConnectedSocket() client: Socket,
    @MessageBody() {
      kind,
      producerTransportId,
      rtpParameters,
    }: {
      kind: mediasoupTypes.MediaKind;
      rtpParameters: mediasoupTypes.RtpParameters;
      producerTransportId: string;
    },
  ) {
    if (!this.roomList.has(client.data.roomId)) {
      return { error: 'not in a room' };
    }

    let producerId = await this.roomList.get(client.data.roomId)?.produce(client.data.userId, producerTransportId, rtpParameters, kind);

    return { producerId };
  }

  @SubscribeMessage('consume')
  async consume(
    @ConnectedSocket() client: Socket,
    @MessageBody() {
      consumerTransportId,
      producerId,
      rtpCapabilities,
    }: {
      consumerTransportId: string;
      producerId: string;
      rtpCapabilities: mediasoupTypes.RtpCapabilities;
    },
  ) {
    const room = this.roomList.get(client.data.roomId);

    if (!room) return;

    let params = await room.consume(client.data.userId, consumerTransportId, producerId, rtpCapabilities);

    return params;
  }

  @SubscribeMessage('resume')
  async resume(@ConnectedSocket() client: Socket, @MessageBody() consumerId: string) {
    const peers = this.roomList.get(client.data.roomId)?.getPeers().values();
    let consumer: mediasoupTypes.Consumer;

    for (let peer of peers!) {
      if (peer.userId === client.data.userId && peer.consumers.has(consumerId)) {
        consumer = peer.consumers.get(consumerId)!;
        await consumer?.resume();
        break;
      }
    }

    return 'success';
  }

  @SubscribeMessage('get-room-info')
  getRoomInfo(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    return this.roomList.get(client.data.roomId)?.toJson();
  }

  @SubscribeMessage('disconnect')
  disconnect(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    if (!client.data.roomId) return;

    this.roomList.get(client.data.roomId)?.removePeer(client.data.userId);
  }

  @SubscribeMessage('producer-closed')
  producerClosed(@ConnectedSocket() client: Socket, @MessageBody() { producerId }: { producerId: string; }) {
    this.roomList.get(client.data.roomId)?.closeProducer(client.data.userId, producerId);
  }

  @SubscribeMessage('exit-room')
  async exitRoom(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    if (!this.roomList.has(client.data.roomId)) {
      return {
        error: 'not currently in a room',
      };
    }

    await this.roomList.get(client.data.roomId)?.removePeer(client.data.userId);

    if (this.roomList.get(client.data.roomId)?.getPeers().size === 0) {
      this.roomList.delete(client.data.roomId);
    }

    client.data.roomId = null;
    return 'successfully exited room';
  }
}
