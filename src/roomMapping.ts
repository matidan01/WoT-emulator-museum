import { ENDOPOINTS_URL, SETUP_URL } from './main';
import slugify from 'slugify';
import Servient, { Helpers, ProtocolClient } from '@node-wot/core';
import HttpClientFactory from '@node-wot/binding-http/dist/http-client-factory';

export let roomMapping: Map<string, { title: string, type: string | unknown}[]>;
export let consumedThingMap : Map<string, WoT.ConsumedThing> = new Map();
export let URIdata : any[] = [];
export let client : ProtocolClient;

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
        client = servient.getClientFor(Helpers.extractScheme(form.href));
        const response = await client.readResource(form);
        const body = await response.toBuffer();

        roomMapping = await createRoomMapping(JSON.parse(body.toString("ascii")) as any);
        roomMappingReady();
    } catch (error) {
        console.error("Error while setting up listener:", error);
    }
}

// Function to create a room mapping from received data
async function createRoomMapping(data: any[]): Promise<Map<string, { title: string, type: string | unknown }[]>> {
    const newRoomMapping = new Map<string, { title: string, type: string | unknown }[]>();

    try {
        const WoT = await servient.start();

        const getContent = await client.readResource({ href: ENDOPOINTS_URL });
        URIdata = JSON.parse((await getContent.toBuffer()).toString());

        for (const things of URIdata) {
            try {
                const title = slugify(things.title, { lower: true });
                const td = await WoT.requestThingDescription(things.URI);
                const thing = await WoT.consume(td);

                if (thing !== undefined) {
                    consumedThingMap.set(title, thing);
                }
            } catch (err) {
                console.error(`Error processing thing ${things.title}:`, err);
            }
        }

        data.forEach((item) => {
            if (item.title.toString() === "Museum") {
                for (const room of item.rooms) {
                    newRoomMapping.set(room.id, []);
                }
            }
        });

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

    } catch (err) {
        console.error("Error in createRoomMapping:", err);
    }

    return newRoomMapping;
}
