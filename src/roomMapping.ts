import { io } from 'socket.io-client';
import { SETUP_URL } from './main';
import slugify from 'slugify';
import { client } from './client';

export var roomMapping: Map<string, { title: string, type: string }[]>;

let roomMappingReady: () => void;
export const roomMappingPromise = new Promise<void>((resolve) => {
    roomMappingReady = resolve;
});

// Sets up a Socket.IO listener to receive room and device data from the server.
export async function setupListener(): Promise<void> {
    const form  = { href: `${SETUP_URL}`, contentType: "application/json" };

    try {  
        const response = await client.readResource(form);
        const body = await response.toBuffer();
        roomMapping = createRoomMapping(JSON.parse(body.toString("ascii")) as any);
        roomMappingReady();
    } catch (error) {
        console.error("Error while setting up listener:", error);
    }
}

function createRoomMapping(data: any[]): Map<string, { title: string, type: string }[]> {
    const roomMapping = new Map<string, { title: string, type: string }[]>();

    data.forEach((room : any) => {
        if (room.type == 'Room' && room.key && typeof room.key === 'string') {
            roomMapping.set(room.key, []);
            const slugifiedTitle = slugify(room.title, { lower: true });
        } 
    });

    data.forEach((item) => {
        if (item.roomId && item.type !== 'Room' && typeof item.roomId === 'string') {
            const slugifiedRoomTitle = slugify(item.roomId, { lower: true });
            if (roomMapping.has(slugifiedRoomTitle)) {
                const title = typeof item.title === 'string' ? slugify(item.title, { lower: true }) : 'unknown';
                roomMapping.get(slugifiedRoomTitle)?.push({
                    title,
                    type: item.type,
                });
            }
        } 
    });

    return roomMapping; 
}
