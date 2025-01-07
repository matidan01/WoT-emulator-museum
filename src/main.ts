import { subscribeToAllEndpoints } from "./eventHandler";
import { roomMapping, roomMappingPromise, setupListener } from "./socket";

export const BASE_URL = 'http://localhost:8081';
export const SETUP_URL = 'http://localhost:3000';

// Start listening for room and device data 
setupListener();

// Wait for the roomMappingPromise to resolve, indicating that the room mapping is ready.
roomMappingPromise
    .then(() => {
        subscribeToAllEndpoints(roomMapping);
    })
    .catch((error) => {
        console.error('Error during room mapping initialization:', error);
    });