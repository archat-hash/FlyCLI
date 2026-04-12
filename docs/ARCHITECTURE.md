# FlyCLI Solution Architecture

Цей документ описує архітектурне рішення FlyCLI з використанням практик **C4 Model** та **4+1 Architectural View Model**. Проєкт розроблений як High-Stability інструмент для автоматизованої діагностики та конфігурації польотних контролерів Betaflight.

---

## 1. System Context (C4 Level 1)
FlyCLI виступає посередником між AI/Pilot та апаратною частиною (Flight Controller). 

```mermaid
graph TD
    User([Pilot / AI Agent]) -- "CLI Commands" --> FlyCLI[FlyCLI Tool]
    FlyCLI -- "Serial/MSP Protocol" --> FC[Flight Controller]
    FC -- "Telemetry / CLI Data" --> FlyCLI
```

---

## 2. Logical View (Clean Architecture)
Ми використовуємо гексагональну архітектуру (Ports and Adapters) для забезпечення незалежності бізнес-логіки.

```mermaid
graph TD
    subgraph Delivery [Delivery Layer / Composition Root]
        CLI[src/interfaces/cli/*.js]
    end
    
    subgraph Application [Application Layer]
        UC[ExecuteCliUseCase]
    end
    
    subgraph Infrastructure [Infrastructure Layer]
        SFC[SerialFlightController]
    end
    
    subgraph Domain [Domain Layer]
        IFC((IFlightController))
        CP[CliParser]
    end

    CLI -- "Injects" --> SFC
    CLI -- "Initializes" --> UC
    UC -- "Uses" --> IFC
    SFC -- "Implements" --> IFC
    UC -- "Uses" --> CP
```

### Рівні (Layers):
- **Domain Layer**: Сутності та інтерфейси (`IFlightController`, `CliParser`).
- **Application Layer**: Use Cases, що реалізують конкретні бізнес-сценарії (`ExecuteCliUseCase`).
- **Infrastructure Layer**: Реалізація Serial-зв'язку та Port Scanning.
- **Delivery Layer (Composition Root)**: CLI інтерфейс у `src/interfaces/cli/`. Це єдине місце, де інфраструктура з'єднується з додатком (Dependency Injection).

---

## 3. State Machine (Command Lifecycle)
Процес виконання команди CLI проходить через кілька станів для гарантування стабільності та уникнення "висання" порту.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Connecting : execute()
    Connecting --> MspHandshake : connected
    MspHandshake --> CliMode : MSP ACK
    CliMode --> WaitingPrompt : Send command
    WaitingPrompt --> ProcessingOutput : Prompt found (RegEx)
    ProcessingOutput --> Idle : Success / Fail
    ProcessingOutput --> Rebooting : "save" command detected
    Rebooting --> [*] : Port Disconnected
    ProcessingOutput --> [*] : Global Timeout (15s)
```

---

## 4. Process View (Hardware Interaction)
FlyCLI реалізує стійку обробку асинхронних подій та фрагментованих даних.

```mermaid
sequenceDiagram
    participant CLI as interfaces/cli/execute.js
    participant UC as ExecuteCliUseCase
    participant SFC as SerialFlightController
    participant HW as Flight Controller

    CLI->>SFC: new SerialFlightController(...)
    CLI->>UC: new ExecuteCliUseCase(SFC, ...)
    CLI->>UC: execute("status")

    UC->>SFC: connect()
    SFC->>HW: MSP Handshake (API_VERSION)
    HW-->>SFC: ACK (0x65)

    UC->>SFC: sendRaw("status\n")
    HW-->>SFC: Data Chunks...
    HW-->>SFC: Final Prompt "# "

    SFC-->>UC: Full Response String
    UC-->>CLI: Parsed JSON/Text
    CLI->>User: Display Status Output
```

---

## 5. Development View (Standards & Tools)
Проєкт дотримується принципів високої якості коду для забезпечення AI-Ready статусу.

- **Linting**: Airbnb JavaScript Style Guide (Strict).
- **Module System**: ESM (ECMAScript Modules).
- **Testing Strategy**:
    - **Unit (Jest)**: Покриває всі значущі гілки поведінки, включаючи таймаути та розриви з'єднання.
    - **Integration (Jest)**: Контроль архітектурних шарів через **dependency-cruiser**.
    - **BDD (Cucumber)**: **34 сценарії** повної функціональної верифікації на реальному залізі (STM32F411).
- **Resilience**: захист таймаутами та механізмами очищення буферів (flush).

---

## 6. Physical View (Deployment)
FlyCLI розгортається як Node.js інструмент, що з'єднаний через USB.

```mermaid
graph LR
    subgraph Host [Host Machine]
        Node[Node.js Runtime]
        FlyCLI[FlyCLI App]
        Serial[System Serial APIs]
    end
    
    subgraph Device [Hardware]
        STM32[STM32 Chip]
        BF[Betaflight FW]
    end

    FlyCLI --> Node
    Node --> Serial
    Serial -- "USB / Serial VCP" --> STM32
    STM32 --> BF
```

---

## 7. Implementation Reality (Bottom-Up Challenges)

### 7.1. Фрагментація даних (Serial Chunks)
Реальність роботи з USB-VCP вимагає обробки чанків по 64/128 байт. `SerialFlightController` накопичує дані в `#buffer` до появи паттерну промпта.

### 7.2. Дебаунс (Fake Prompts)
В `ExecuteCliUseCase` додано затримку **300мс** після детекції промпта для збору "хвоста" даних, які могли затриматися в буфері.

### 7.3. Hardware Handshake
MSP Handshake при старті змушує прошивку ініціалізувати USB-стек, що критично для надійного входу в CLI режим на деяких платах (наприклад, STM32F411 Black Pill).

---

## Key Design Decisions (ADR Summary)
- **Prompt Detection**: Динамічна детекція через RegEx.
- **Echo Suppression**: Видалення відлуння команди.
- **Strict ESM**: Чистий JS без етапу транспайляції.
