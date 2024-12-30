# WoT-simulator-museum

## Overview
This project is part of a larger system designed to simulate a museum environment. It interacts with both a **backend** and a **frontend** to provide a realistic simulation of various components within a museum. The backend sends events, and this project, which handles various museum elements (thigs) like rooms, radiators, humidifiers and dimmable lamps, responds to those events in real time.

To fully utilize this system, the following components must work together:
- **[WoT-simulator](https://github.com/matidan01/WoT-simulator.git)**: Manages the simulation and emits events.
- **[Frontend](https://github.com/matidan01/wot-sim-frontend.git)**: Provides a user interface for interacting with the simulation.
- **WoT-simulator-museum**: This module, which responds to the events emitted by the backend.

The **WoT-simulator-museum** module is responsible for managing the state of the museum's environmental elements (e.g., temperature, humidity) and responding to changes initiated by the backend.


### 1. Clone the Repository
If you don’t already have the project locally, clone it.

### 2. Install Dependencies  
Run the following command in the project directory to install all required dependencies:  
```bash
npm i
```

### 3. Start the Project
```bash
npx ts-node src/main.ts
```