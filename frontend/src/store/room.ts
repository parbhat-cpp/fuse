import { Store } from "@tanstack/react-store";

export const roomData = new Store<Record<string, any> | undefined>(undefined);
