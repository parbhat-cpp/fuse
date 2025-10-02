import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { UserType } from "src/user/entities/user.entity";

export class Room {
    @IsString()
    roomId?: string;

    @IsNotEmpty()
    @IsString()
    roomName: string;

    @IsNotEmpty()
    admin: UserType;

    @IsBoolean()
    isPublic: boolean;

    @IsNumber()
    attendeesCount?: number;

    @IsArray()
    attendees?: Array<UserType>;

    @IsArray()
    attendeesId?: Array<string>;

    @IsDate()
    createdAt?: Date;
    
    @IsDate()
    startAt?: Date;
}
