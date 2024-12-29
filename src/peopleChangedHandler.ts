import axios from 'axios';
import { roomMapping } from './socket';

function generateEndpoints(map: Map<string, { title: string, type: string }[]>): string[] {
    const endpoints: string[] = [];
    map.forEach((_, roomId) => {
        endpoints.push(`http://localhost:8081/${roomId.toLowerCase()}/events/peopleChanged`);
        endpoints.push(`http://localhost:8081/${roomId.toLowerCase()}/events/maxHumidity`);
        endpoints.push(`http://localhost:8081/${roomId.toLowerCase()}/events/minTemperature`);
        endpoints.push(`http://localhost:8081/${roomId.toLowerCase()}/events/maxTemperature`);
    });
    return endpoints;
}


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

function extractEventNameFromURL(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1]; 
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function turnThingOn(title : string) : Promise<void>{
    const isOnUrl = `http://localhost:8081/${title.toLowerCase()}/properties/isOn`;
    const toggleUrl = `http://localhost:8081/${title.toLowerCase()}/actions/toggle`; 

    try {
        const response = await axios.get(isOnUrl);
        const isOn = response.data;

        if (!isOn) {
            console.log(`[Device ${title}] Acceso. Spegnimento in corso...`);
            await axios.post(toggleUrl, null,{
                headers: {
                    'Content-Type': 'application/json' 
                }
            });
            console.log(`[Device ${title}] Spento con successo.`);
        } else {
            console.log(`[Device ${title}] Già spento.`);
        }
    } catch (error) {
        console.error(`[Device ${title}] Errore nel controllo/spegnimento con URL ${toggleUrl}`, error);
    }
}

async function turnThingOff(title : string) : Promise<void>{
    const isOnUrl = `http://localhost:8081/${title.toLowerCase()}/properties/isOn`;
    const toggleUrl = `http://localhost:8081/${title.toLowerCase()}/actions/toggle`; 

    try {
        const response = await axios.get(isOnUrl);
        const isOn = response.data;

        if (isOn) {
            console.log(`[Device ${title}] Acceso. Spegnimento in corso...`);
            await axios.post(toggleUrl, null,{
                headers: {
                    'Content-Type': 'application/json' 
                }
            });
            console.log(`[Device ${title}] Spento con successo.`);
        } else {
            console.log(`[Device ${title}] Già spento.`);
        }
    } catch (error) {
        console.error(`[Device ${title}] Errore nel controllo/spegnimento con URL ${toggleUrl}`, error);
    }
}

async function handleMaxHumidityEvent(roomId: string) {
    const devices = roomMapping.get(roomId);
    if (!devices) {
        console.log(`[Room ${roomId}] Nessun dispositivo trovato.`);
        return;
    }

    const humidifiers = devices?.filter(device => device.type === 'Humidifier') ?? [];
    for (const humidifier of humidifiers) {
        const title = humidifier.title;
        await turnThingOff(title);
    }

}

async function handleMaxTemperatureEvent(roomId: string) {
    const devices = roomMapping.get(roomId);
    if (!devices) {
        console.log(`[Room ${roomId}] Nessun dispositivo trovato.`);
        return;
    }

    const radiators = devices?.filter(device => device.type === 'Radiator') ?? [];

    for (const radiator of radiators) {
        const title = radiator.title;
        await turnThingOff(title);
    }
}

async function handleMinTemperatureEvent(roomId: string) {
    const devices = roomMapping.get(roomId);
    if (!devices) {
        console.log(`[Room ${roomId}] Nessun dispositivo trovato.`);
        return;
    }

    const radiators = devices?.filter(device => device.type === 'Radiator') ?? [];

    for (const radiator of radiators) {
        const title = radiator.title;
        await turnThingOn(title);
    }
}

async function handlePeopleChangedEvent(roomId: string, data: string) {
    console.log(`[Room ${roomId}] Data: ${data}`);
    const devices = roomMapping.get(roomId);
    
    if (!devices) {
        console.log(`[Room ${roomId}] Nessun dispositivo trovato.`);
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
                const intensityLevelUrl = `http://localhost:8081/${title.toLowerCase()}/actions/setLow`;

                try {
                    await turnThingOn(title);

                    await axios.post(intensityLevelUrl, null, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                } catch (error) {
                    console.log("Errore nella gestione delle dimmableLamp: ", error);
                }
            } 
            break;
        default: 
            const dimmableLamps = devices?.filter(device => device.type === 'DimmableLamp') ?? [];
            for (const lamp of dimmableLamps) {
                const title = lamp.title;
                const intensityLevelUrl = `http://localhost:8081/${title.toLowerCase()}/actions/setHigh`;

                try {
                    await turnThingOn(title);

                    await axios.post(intensityLevelUrl, null, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                } catch (error) {
                    console.log("Errore nella gestione delle dimmableLamp: ", error);
                }

            }
            break;
    }
}

export function subscribeToAllEndpoints(map: Map<string, { title: string, type: string }[]>) {
    const endpoints = generateEndpoints(map);
    endpoints.forEach(url => {
        subscribeToEndpoint(url);
    });
}

