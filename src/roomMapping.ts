import { BASE_URL, SETUP_URL } from './main';
import slugify from 'slugify';
import Servient, { Helpers } from '@node-wot/core';
import HttpClientFactory from '@node-wot/binding-http/dist/http-client-factory';

export let roomMapping: Map<string, { title: string, type: string }[]>;
export let consumedThingMap : Map<string, WoT.ConsumedThing> = new Map();

let roomMappingReady: () => void;
export const roomMappingPromise = new Promise<void>((resolve) => {
    roomMappingReady = resolve;
});

export const servient = new Servient();
servient.addClientFactory(new HttpClientFactory(null));

// Sets up a Socket.IO listener to receive room and device data from the server.
export async function setupListener(): Promise<void> {
    const form  = { href: `${SETUP_URL}`, contentType: "application/json" };

    try {  
        const client = servient.getClientFor(Helpers.extractScheme(form.href));
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

    servient.start().then(async (WoT) => {
        for (const things of data) {
            try {
                if (things.type !== 'Room') {
                    const title = slugify(things.title, {lower: true})
                    const td = await WoT.requestThingDescription(BASE_URL + "/" + title);
                    let thing = await WoT.consume(td);
                    if (thing !== undefined) {
                        consumedThingMap.set(title, thing);
                    }
                }
            } catch (err) {
                console.error(`Error processing thing ${things.title}`);
            }
        }
    }).catch((err) => { console.error(err); });
    
    

    data.forEach((room : any) => {
        if (room.type == 'Room' && room.id && typeof room.id === 'string') {
            roomMapping.set(room.id, []);
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
