import { Test, TestingModule } from '@nestjs/testing';
import { RoomSearchService } from './room-search.service';

describe('RoomSearchService', () => {
  let service: RoomSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomSearchService],
    }).compile();

    service = module.get<RoomSearchService>(RoomSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
