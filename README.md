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

## Event Management

The **WoT-simulator-museum** module automatically handles events related to **temperature** and **humidity**. These events are emitted and processed independently, ensuring the museum environment dynamically adjusts based on changes in these factors.

However, to manage the number of **people** in the different rooms, POST requests are required to trigger the corresponding actions for adding or removing people. These requests must be sent to the following endpoints:

- **Add a person** to the "Gallery of Renaissance Art" room:
  ```http
  POST http://localhost:8081/gallery-of-renaissance-art/actions/addPerson
  ```
- **Add a person** to the "Modern Art Gallery" room:
  ```http
  POST http://localhost:8081/modern-art-gallery/actions/addPerson
  ```
- **Add a person** to the "Sculpture Hall" room:
  ```http
  POST http://localhost:8081/sculpture-hall/actions/addPerson
  ```
- **Add a person** to the "Impressionist Exhibit" room:
  ```http
  POST http://localhost:8081/impressionist-exhibit/actions/addPerson
  ```


- **Remove a person** to the "Gallery of Renaissance Art" room:
   ```http
  POST http://localhost:8081/gallery-of-renaissance-art/actions/removePerson
  ```
- **Remove a person** to the "Modern Art Gallery" room:
   ```http
  POST http://localhost:8081/modern-art-gallery/actions/removePerson
  ```
- **Remove a person** to the "Sculpture Hall" room:
   ```http
  POST http://localhost:8081/sculpture-hall/actions/removePerson
  ```
- **Remove a person** to the "Impressionist Exhibit" room:
   ```http
  POST http://localhost:8081/impressionist-exhibit/actions/removePerson
  ```