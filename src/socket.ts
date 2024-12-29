import { io } from 'socket.io-client';

export var roomMapping: Map<string, { title: string, type: string }[]>;
let roomMappingReady: () => void;
export const roomMappingPromise = new Promise<void>((resolve) => {
    roomMappingReady = resolve;
});

// Sets up a Socket.IO listener to receive room and device data from the server.
export function setupListener(): void {
    const socket = io('http://localhost:3000');

    // Listen for the 'setup' event to receive room and device data.
    socket.on('setup', (data: any[]) => {
        try {
            roomMapping = createRoomMapping(data);
            console.log('Room and device mapping:', roomMapping);
            roomMappingReady();
        } catch (error) {
            console.error('Error while creating the room mapping:', error);
        }
    });

    // Log a message when successfully connected to the Socket.IO server.
    socket.on('connect', () => {
        console.log('Connected to the Socket.IO server');
    });
    
    // Log a message when disconnected from the Socket.IO server.
    socket.on('disconnect', () => {
        console.log('Disconnected to the Socket.IO server');
    });
}

// Creates a mapping of rooms to their respective devices based on the provided data.
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

    return roomMapping; // Return the completed room-to-devices map.
}
