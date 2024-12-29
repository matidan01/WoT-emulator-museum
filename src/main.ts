import { subscribeToAllEndpoints } from "./peopleChangedHandler";
import { roomMapping, roomMappingPromise, setupListener } from "./socket";

// Start listening for room and device data 
setupListener();

// Wait for the roomMappingPromise to resolve, indicating that the room mapping is ready.
roomMappingPromise
    .then(() => {
        console.log('Room mapping is ready:', roomMapping);
        subscribeToAllEndpoints(roomMapping);
    })
    .catch((error) => {
        console.error('Error during room mapping initialization:', error);
    });