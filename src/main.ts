import { io } from 'socket.io-client';
import { subscribeToAllEndpoints } from "./eventHandler";
import { setupListener, roomMappingPromise, roomMapping } from "./roomMapping";

export const BASE_URL = 'http://localhost:8081';
export const SETUP_URL = 'http://localhost:3000/setup';
export const RUNNING_URL = 'http://localhost:3000/status';

const socket = io('http://localhost:3000'); 
 
async function initializeApplication() {
    console.log("Initializing application...");
    try {
        await setupListener(); 
        await roomMappingPromise; 
        subscribeToAllEndpoints(); 
        console.log("Application initialized.");
    } catch (error) {
        console.error("Error during application initialization:", error);
    }
}

// Listener per `serverStarted`
socket.on('serverStarted', async () => {
    await initializeApplication();
});

socket.on('connect', () => {
    console.log("Connected to the server, waiting for 'serverStarted'...");
});

socket.on('disconnect', () => {
    console.log("Disconnected from the server.");
});
