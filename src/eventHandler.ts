import axios from 'axios';
import { roomMapping } from './socket';
import slugify from "slugify"
import { BASE_URL } from './main';



// Generates a list of endpoint URLs based on the room mapping.
function generateEndpoints(map: Map<string, { title: string, type: string }[]>): string[] {
    const endpoints: string[] = [];
    map.forEach((_, roomId) => {
        const id = slugify(roomId, { lower: true });
        endpoints.push(`${BASE_URL}/${id}/events/peopleChanged`);
        endpoints.push(`${BASE_URL}/${id}/events/maxHumidity`);
        endpoints.push(`${BASE_URL}/${id}/events/minHumidity`);
        endpoints.push(`${BASE_URL}/${id}/events/minTemperature`);
        endpoints.push(`${BASE_URL}/${id}/events/maxTemperature`);
    });
    return endpoints;
}

// Subscribes to a specific event stream endpoint and handles incoming events.
async function subscribeToEndpoint(url: string) {
    while (true) {
        try {
            console.log(`Connecting to ${url}...`);

            const response = await axios.get(url, {
                responseType: 'stream',
                headers: {
                    Accept: 'text/event-stream',
                },
            });

            console.log(`Connected to ${url}. Listening for events...`);

            response.data.on('data', (chunk: Buffer) => {
                const data = chunk.toString().trim();
                console.log(`Event received from ${url}:`, data);
            
                const eventName = extractEventNameFromURL(url);
                const roomId = url.split('/')[3];
            
                switch (eventName) {
                    case "peopleChanged":
                        console.log("Handling 'peopleChanged' event");
                        handlePeopleChangedEvent(roomId, data);
                        break;
            
                    case "maxHumidity":
                        console.log("Handling 'maxHumidity' event");
                        handleMaxHumidityEvent(roomId);
                        break;
                    
                    case "minHumidity":
                        console.log("Handling 'maxHumidity' event");
                        handleMinHumidityEvent(roomId);
                        break;
            
                    case "minTemperature":
                        console.log("Handling 'minTemperature' event");
                        handleMinTemperatureEvent(roomId);
                        break;
            
                    case "maxTemperature":
                        console.log("Handling 'maxTemperature' event");
                        handleMaxTemperatureEvent(roomId);
                        break;
            
                    default:
                        console.warn(`Unknown event: ${eventName}`);
                        break;
                }
            });
            

            response.data.on('end', () => {
                console.warn(`Connection to ${url} closed. Reconnecting...`);
            });

            response.data.on('error', (error: any) => {
                console.error(`Error in event stream from ${url}:`, error.message);
                throw error;
            });

        } catch (error) {
            console.error(`Error connecting to ${url}:`, error);
            console.log(`Retrying connection to ${url} in 5 seconds...`);
            await delay(5000);
        }
    }
}

// Extracts the event name from the endpoint URL.
function extractEventNameFromURL(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1]; 
}

// Delays the execution for a specified number of milliseconds.
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Turns a device off if it is currently on.
async function turnThingOn(title : string) : Promise<void>{
    const isOnUrl = `${BASE_URL}/${slugify(title, {lower: true})}/properties/isOn`;
    const toggleUrl = `${BASE_URL}/${slugify(title, {lower: true})}/actions/toggle`; 

    try {
        const response = await axios.get(isOnUrl);
        const isOn = response.data;

        if (!isOn) {
            await axios.post(toggleUrl, null,{
                headers: {
                    'Content-Type': 'application/json' 
                }
            });
        } 
    } catch (error) {
        console.error(`[Device ${title}] Error turning on the device`, error);
    }
}

// Turns a device on if it is currently off.
async function turnThingOff(title : string) : Promise<void>{
    const isOnUrl = `${BASE_URL}/${slugify(title, {lower: true})}/properties/isOn`;
    const toggleUrl = `${BASE_URL}/${slugify(title, {lower: true})}/actions/toggle`; 

    try {
        const response = await axios.get(isOnUrl);
        const isOn = response.data;

        if (isOn) {
            await axios.post(toggleUrl, null,{
                headers: {
                    'Content-Type': 'application/json' 
                }
            });
        } 
    } catch (error) {
        console.error(`[Device ${title}] Error turning off the device`, error);
    }
}

// Set intensity level
async function setIntensity(title: string, intensity : string) {
    const intensityLevelUrl = `${BASE_URL}/${slugify(title, {lower: true})}/actions/set` + intensity;
    try {
        await axios.post(intensityLevelUrl, null, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.log("Errore handling DimmableLamp: ", error);
    }
}

// Handles the "maxHumidity" event by turning off all humidifiers in the specified room.
async function handleMinHumidityEvent(roomId: string) {
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

// Handles the "maxHumidity" event by turning off all humidifiers in the specified room.
async function handleMaxHumidityEvent(roomId: string) {
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

// Handles the "maxTemperature" event by turning off all radiators in the specified room.
async function handleMaxTemperatureEvent(roomId: string) {
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

// Handles the "minTemperature" event by turning on all radiators in the specified room.
async function handleMinTemperatureEvent(roomId: string) {
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

// Handles the "peopleChanged" event by adjusting devices in the room based on the number of people present.
async function handlePeopleChangedEvent(roomId: string, data: string) {
    const devices = roomMapping.get(roomId);
    
    if (!devices) {
        console.log(`[Room ${roomId}] No device.`);
        return;
    }

    switch(data) {
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

// Subscribes to all event endpoints generated from the room mapping.
export function subscribeToAllEndpoints(map: Map<string, { title: string, type: string }[]>) {
    const endpoints = generateEndpoints(map);
    endpoints.forEach(url => {
        subscribeToEndpoint(url);
    });
}

