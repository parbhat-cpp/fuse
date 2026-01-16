import {
  Query,
  Controller,
  Get,
  Req,
  ParseIntPipe,
  ParseBoolPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { RoomSearchService } from './room-search.service';

@Controller('room-search')
export class RoomSearchController {
  constructor(private readonly roomSearchService: RoomSearchService) {}

  @Get('public')
  async searchRooms(
    @Req() request: Request,
    @Query('q') query?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('nearby', new ParseBoolPipe({ optional: true })) nearBy?: boolean,
    @Query('lat', new ParseFloatPipe({ optional: true })) lat?: number,
    @Query('lng', new ParseFloatPipe({ optional: true })) lng?: number,
  ) {
    return this.roomSearchService.searchRooms(query, nearBy, lat, lng, page);
  }

  @Get('scheduled')
  async searchScheduledRooms(
    @Req() request: Request,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    const userId = request['user'].sub;
    return this.roomSearchService.searchScheduledRooms(userId, page);
  }
}
