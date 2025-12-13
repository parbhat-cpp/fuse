import { Test, TestingModule } from '@nestjs/testing';
import { RoomSearchController } from './room-search.controller';

describe('RoomSearchController', () => {
  let controller: RoomSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomSearchController],
    }).compile();

    controller = module.get<RoomSearchController>(RoomSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
