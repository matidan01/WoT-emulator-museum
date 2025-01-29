import { BASE_URL, SETUP_URL } from './main';
import slugify from 'slugify';
import Servient, { Helpers } from '@node-wot/core';
import HttpClientFactory from '@node-wot/binding-http/dist/http-client-factory';

export let roomMapping: Map<string, { title: string, type: string }[]>;
export let consumedThingMap : Map<string, WoT.ConsumedThing> = new Map();

// Promise to signal when room mapping is ready
let roomMappingReady: () => void;
export const roomMappingPromise = new Promise<void>((resolve) => {
    roomMappingReady = resolve;
});

// Initialize a WoT Servient
export const servient = new Servient();
servient.addClientFactory(new HttpClientFactory(null));

// Sets up a Socket.IO listener to receive room and device data from the server.
export async function setupListener(): Promise<void> {
    const form  = { href: `${SETUP_URL}`, contentType: "application/json" };

    try {  
        // Create an HTTP client and fetch data from the server
        const client = servient.getClientFor(Helpers.extractScheme(form.href));
        const response = await client.readResource(form);
        const body = await response.toBuffer();

        roomMapping = createRoomMapping(JSON.parse(body.toString("ascii")) as any);
        roomMappingReady();
    } catch (error) {
        console.error("Error while setting up listener:", error);
    }
}

// Function to create a room mapping from received data
function createRoomMapping(data: any[]): Map<string, { title: string, type: string }[]> {
    const newRoomMapping = new Map<string, { title: string, type: string }[]>();

    // Start the WoT Servient and process each device in the data
    servient.start().then(async (WoT) => {
        for (const things of data) {
            try {

                // Generate a slugified title and request its Thing Description (TD)
                const title = slugify(things.title, {lower: true});
                const td = await WoT.requestThingDescription(BASE_URL + "/" + title);
                let thing = await WoT.consume(td);
                
                // Store the consumed thing in the map if it exists
                if (thing !== undefined) {
                    consumedThingMap.set(title, thing);
                }
            } catch (err) {
                console.error(`Error processing thing ${things.title}`);
            }
        }
    }).catch((err) => { console.error(err); });

     // Initialize mapping for Museum rooms
    data.forEach((item) => {
        if (item.title.toString() == "Museum") {
            for (const room of item.rooms) {
                newRoomMapping.set(room.id, []);
            }
        }
    });

     // Populate room mappings with devices
    data.forEach((item) => {
        if (item.roomId && item.type !== 'Room' && typeof item.roomId === 'string') {
            const slugifiedRoomTitle = slugify(item.roomId, { lower: true });
            if (newRoomMapping.has(slugifiedRoomTitle)) {
                const title = typeof item.title === 'string' ? slugify(item.title, { lower: true }) : 'unknown';
                newRoomMapping.get(slugifiedRoomTitle)?.push({
                    title,
                    type: item.type,
                });
            }
        } 
    });

    return newRoomMapping; 
}
