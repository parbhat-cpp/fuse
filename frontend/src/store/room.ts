import { Store } from "@tanstack/react-store";

export const roomData = new Store<Record<string, any> | undefined>(undefined);
export const roomActivities = new Store<Array<Record<string, any>>>([]);
export const currentRoomActivity =
    new Store<
        {
            id: string;
            name: string;
            logo: string;
        } |
        undefined
    >(undefined);
