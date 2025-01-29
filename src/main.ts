import { io } from 'socket.io-client';
import { subscribeToAllEndpoints } from "./eventHandler";
import { setupListener, roomMappingPromise, roomMapping } from "./roomMapping";

// Define API endpoint URLs
export const BASE_URL = 'http://localhost:8081';
export const SETUP_URL = 'http://localhost:3000/setup';
export const ENDOPOINTS_URL = 'http://localhost:3000/getThings'

// Initialize a WebSocket connection to the server
const socket = io('http://localhost:3000'); 
 
// Function to initialize the application when the server starts
async function initializeApplication() {
    console.log("Initializing application...");
    try {
        await setupListener(); // Set up event listeners for devices
        await roomMappingPromise; // Ensure room mapping data is loaded
        subscribeToAllEndpoints(); // Subscribe to all device event endpoints
        console.log("Application initialized.");
    } catch (error) {
        console.error("Error during application initialization:", error);
    }
}

// Listen for the `serverStarted` event and initialize the application
socket.on('serverStarted', async () => {
    await initializeApplication();
});

// Handle successful connection to the WebSocket server
socket.on('connect', () => {
    console.log("Connected to the server, waiting for 'serverStarted'...");
});

// Handle disconnection from the WebSocket server
socket.on('disconnect', () => {
    console.log("Disconnected from the server.");
});
