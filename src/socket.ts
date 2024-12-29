import { io } from 'socket.io-client';

export var roomMapping: Map<string, { title: string, type: string }[]>;
let roomMappingReady: () => void;
export const roomMappingPromise = new Promise<void>((resolve) => {
    roomMappingReady = resolve;
});

export function setupListener(): void {
    const socket = io('http://localhost:3000');

    socket.on('setup', (data: any[]) => {
        try {
            roomMapping = createRoomMapping(data);
            console.log('Room and device mapping:', roomMapping);
            roomMappingReady();
        } catch (error) {
            console.error('Error while creating the room mapping:', error);
        }
    });

    socket.on('connect', () => {
        console.log('Connected to the Socket.IO server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected to the Socket.IO server');
    });
}

function createRoomMapping(data: any[]): Map<string, { title: string, type: string }[]> {
    const roomMapping = new Map<string, { title: string, type: string }[]>();

    data.forEach((item) => {
        if (item.type === 'Room') {
            roomMapping.set(item.title, []);
        }
    });

    data.forEach((item) => {
        if (item.roomId && item.type !== 'Room') {
            const roomName = typeof item.roomId === 'string' 
                ? item.roomId 
                : data.find(room => room.roomId === item.roomId)?.title;
            
            if (roomName && roomMapping.has(roomName)) {
                roomMapping.get(roomName)?.push({ title: item.title, type: item.type });
            }
        }
    });

    return roomMapping;
}
