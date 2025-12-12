import { Test, TestingModule } from '@nestjs/testing';
import { RoomSchedulerService } from './room-scheduler.service';

describe('RoomSchedulerService', () => {
  let service: RoomSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomSchedulerService],
    }).compile();

    service = module.get<RoomSchedulerService>(RoomSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
