import { io } from 'socket.io-client';
import { SETUP_URL } from './main';
import slugify from 'slugify';

export var roomMapping: Map<string, { title: string, type: string }[]>;
let roomMappingReady: () => void;
export const roomMappingPromise = new Promise<void>((resolve) => {
    roomMappingReady = resolve;
});

// Sets up a Socket.IO listener to receive room and device data from the server.
export function setupListener(): void {
    const socket = io(SETUP_URL);

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
            const slugifiedTitle = slugify(item.title, { lower: true });
            roomMapping.set(slugifiedTitle, []);
        }
    });

    data.forEach((item) => {
        if (item.roomId && item.type !== 'Room') {
            const originalRoomTitle = data.find(room => room.title === item.roomId)?.title;

            if (originalRoomTitle) {
                const slugifiedRoomTitle = slugify(originalRoomTitle, { lower: true });

                if (roomMapping.has(slugifiedRoomTitle)) {
                    roomMapping.get(slugifiedRoomTitle)?.push({
                        title: slugify(item.title, { lower: true }),
                        type: item.type,
                    });
                }
            }
        }
    });

    return roomMapping; // Return the completed room-to-devices map.
}
