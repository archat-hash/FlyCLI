# 2. Logical View

## Context
This view outlines the primary abstractions, components, and the clean architecture that drives the business logic of FlyCLI. We use hexagonal architecture (Ports and Adapters) to ensure business logic independence.

## 2.1 Hexagonal Architecture (Global System)

```mermaid
graph TD
    subgraph Delivery [Delivery Layer / Composition Root]
        CLI[src/interfaces/cli/*.js]
    end
    
    subgraph Application [Application Layer]
        UC[ExecuteCliUseCase]
        WIZ[RxCalibrationMachine]
    end
    
    subgraph Infrastructure [Infrastructure Layer]
        SFC[SerialFlightController]
        MSP[MspProtocol]
    end
    
    subgraph Domain [Domain Layer]
        IFC((IFlightController))
        CP[CliParser]
    end

    CLI -- "Injects" --> SFC
    CLI -- "Initializes" --> UC
    CLI -- "Initializes" --> WIZ
    UC -- "Uses" --> IFC
    WIZ -- "Uses" --> MSP
    SFC -- "Implements" --> IFC
    UC -- "Uses" --> CP
```

### Layers:
- **Domain Layer**: Entities and interfaces (`IFlightController`, `CliParser`).
- **Application Layer**: Use Cases that implement specific scenarios (`ExecuteCliUseCase`, `RxCalibrationMachine`).
- **Infrastructure Layer**: Implementation of Serial communication (`SerialFlightController`) and binary protocol parsing (`MspProtocol`).
- **Delivery Layer**: CLI interfaces in `src/interfaces/cli/`. This is the only place where infrastructure connects with the application.

## 2.2 Interactive RC State Machine (Feature Logic)
The `RxCalibrationMachine` governs the RC wizard lifecycle.

```mermaid
stateDiagram-v2
    [*] --> INIT: Execution Started
    INIT --> CONNECTING: Open Port
    CONNECTING --> POLLING: Port Opened Successfully
    CONNECTING --> ERROR: Port Failure
    
    state POLLING {
        [*] --> READ_MSP
        READ_MSP --> RENDER_UI
        RENDER_UI --> CHECK_LIMITS
        CHECK_LIMITS --> READ_MSP: Sticks haven't reached min/max
    }
    
    POLLING --> ANALYZING: All 4 axes hit edges (or Timeout)
    ANALYZING --> SUCCESS: Data Valid
    ANALYZING --> TIMEOUT: Data Invalid / Incomplete
    
    SUCCESS --> DONE: Prepare JSON
    TIMEOUT --> DONE: Prepare Error JSON
    ERROR --> DONE
    
    DONE --> [*]: process.exit(0/1)
```
