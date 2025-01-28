import { consumedThingMap, roomMapping, servient } from './roomMapping';
import { ENDOPOINTS_URL } from './main';
import { Helpers } from '@node-wot/core';

// Subscribes to all event endpoints.
export async function subscribeToAllEndpoints() {

    // Add endpoints for different events that the system needs to listen to.
    const client = servient.getClientFor(Helpers.extractScheme(ENDOPOINTS_URL));
    const getContent = await client.readResource({ href: ENDOPOINTS_URL });
    const things = JSON.parse((await getContent.toBuffer()).toString());

    // Subscribe to each endpoint in the list.
    for (const thing of things) {
        const getTD = await client.readResource({ href: thing.URI });
        const td = JSON.parse((await getTD.toBuffer()).toString());
        for (const event in td.events) {
            subscribeToEndpoint(thing.URI + '/events/' + event);
        }
    }
}

// Subscribes to a specific endpoint and handles events received from it.
async function subscribeToEndpoint(url: string): Promise<void> {
    try {
        const client = servient.getClientFor(Helpers.extractScheme(url));
        await client.subscribeResource(
            { op: ["subscribeevent"], href: url},
            async (content : any) => {
                handleEvent(content, url); // Handle the event when it arrives.
            },
            () => {
                console.error(`Error in subscription to ${url}`);
            },
            () => console.warn(`Subscription to ${url} completed.`)
        );
    } catch (error : any) {
        console.error(`Error subscribing to ${url}:`);
    }
}

// Handles incoming events based on their type (derived from the URL).
async function handleEvent(content : any, url : string) {

    const eventData = await content.toBuffer(); 
    const data = await eventData.toString("ascii");
    let arr = data.split('""').map((item : any) => item.replace(/"/g, ''));
    
    const eventName = extractEventNameFromURL(url);

    // Route the event to the appropriate handler based on the event name.
    switch (eventName) {
        case "peopleChanged":
            console.log("Handling 'peopleChanged' event");
            handlePeopleChangedEvent(data);
            break;

        case "maxHumidity":
            console.log("Handling 'maxHumidity' event in: ", data);
            handleMaxHumidityEvent(arr);
            break;

        case "minHumidity":
            console.log("Handling 'minHumidity' event in: ", data);
            handleMinHumidityEvent(arr);
            break;

        case "minTemperature":
            console.log("Handling 'minTemperature' event in: ", data);
            handleMinTemperatureEvent(arr);
            break;

        case "maxTemperature":
            console.log("Handling 'maxTemperature' event in: ", data);
            handleMaxTemperatureEvent(arr);
            break;

        default:
            console.warn(`Unknown event: ${arr}`);
            break;
    }
}

// Extracts the event name from the URL by taking the last part of the URL path.
function extractEventNameFromURL(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
}

// Turns a device off if it is currently on.
async function turnThingOn(title : string) : Promise<void>{
    try {
        const consumedThing = consumedThingMap.get(title)
        const response = await consumedThing?.readProperty('isOn');
        if (response) {
            const isOn = (await response.value())?.toString();
            if (isOn === 'false') {
                consumedThing?.invokeAction('toggle');
            }
        }  
    } catch (error) {
        console.error(`[Device ${title}] Error turning on the device`, error);
    }
}

// Turns a device on if it is currently off.
async function turnThingOff(title : string) : Promise<void>{ 
    try {
        const consumedThing = consumedThingMap.get(title)
        const response = await consumedThing?.readProperty('isOn');
        if (response) {
            const isOn = (await response.value())?.toString();
            if (isOn === 'true') {
                consumedThing?.invokeAction('toggle');
            }
        } 
    } catch (error) {
        console.error(`[Device ${title}] Error turning off the device`, error);
    }
}

// Set intensity level
async function setIntensity(title: string, intensity : string) {
    try {
        const consumedThing = consumedThingMap.get(title)
        consumedThing?.invokeAction('set'+intensity);
    } catch (error) {
        console.log("Error handling setIntensity");
    }
}

// Handles the "maxHumidity" event by turning off all humidifiers in the specified room.
async function handleMinHumidityEvent(rooms: string[]) {
    for (const roomId of rooms) {
        const devices = roomMapping.get(roomId);
        if (!devices) {
            console.log(`[Room ${roomId}] No device.`);
            return;
        }

        const humidifiers = devices?.filter(device => device.type === 'Humidifier') ?? [];
        for (const humidifier of humidifiers) {
            const title = humidifier.title;
            await turnThingOff(title);
        }
    }
}

// Handles the "maxHumidity" event by turning off all humidifiers in the specified room.
async function handleMaxHumidityEvent(rooms: string[]) {
    for (const roomId of rooms) {
        const devices = roomMapping.get(roomId);
        if (!devices) {
            console.log(`[Room ${roomId}] No device.`);
            return;
        }

        const humidifiers = devices?.filter(device => device.type === 'Humidifier') ?? [];
        for (const humidifier of humidifiers) {
            const title = humidifier.title;
            await turnThingOn(title);
        }  
    }
}

// Handles the "maxTemperature" event by turning off all radiators in the specified room.
async function handleMaxTemperatureEvent(rooms: string[]) {
    for (const roomId of rooms) {
        const devices = roomMapping.get(roomId);
        if (!devices) {
            console.log(`[Room ${roomId}] No device.`);
            return;
        }

        const radiators = devices?.filter(device => device.type === 'Radiator') ?? [];

        for (const radiator of radiators) {
            const title = radiator.title;
            await turnThingOff(title);
        } 
    }
}

// Handles the "minTemperature" event by turning on all radiators in the specified room.
async function handleMinTemperatureEvent(rooms: string[]) {
    for (const roomId of rooms) {
        const devices = roomMapping.get(roomId);
        if (!devices) {
            console.log(`[Room ${roomId}] No device.`);
            return;
        }

        const radiators = devices?.filter(device => device.type === 'Radiator') ?? [];

        for (const radiator of radiators) {
            const title = radiator.title;
            await turnThingOn(title);
        }
    }
    
}

// Handles the "peopleChanged" event by adjusting devices in the room based on the number of people present.
async function handlePeopleChangedEvent(data: any) {
    let jsonArray : any[];
    try {
        if (data.includes('}{')) {
            jsonArray = JSON.parse(`[${data.replace(/}{/g, '},{')}]`);
        } else {
            jsonArray = [JSON.parse(data)];
        }

        for (const room of jsonArray) {
            const devices = roomMapping.get(room.roomId);
            if (!devices) {
                console.log(`[Room ${room.roomId}] No device.`);
                return;
            }

            switch(room.people) {
                case "0":
                    for (const device of devices) {
                        const title = device.title;
                        await turnThingOff(title);
                    }
                    break;
                    
                case "1": 
                    const lamps = devices?.filter(device => device.type === 'DimmableLamp') ?? [];
                    for (const lamp of lamps) {
                        const title = lamp.title;
                        await turnThingOn(title);
                        await setIntensity(title, 'Low');
                    } 
                    break;
                default: 
                    const dimmableLamps = devices?.filter(device => device.type === 'DimmableLamp') ?? [];
                    for (const lamp of dimmableLamps) {
                        const title = lamp.title;
                        await turnThingOn(title);
                        await setIntensity(title, 'High');
                    }
                    break;
            }
        }  
    } catch (error) {
        console.log("Problem with parsing: ", data);
    }
    
}



