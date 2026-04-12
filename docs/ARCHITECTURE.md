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
Ми використовуємо гексагональну архітектуру (Ports and Adapters) для забезпечення незалежності бізнес-логіки від особливостей реалізації послідовного порту.

```mermaid
classDiagram
    class IFlightController {
        <<interface>>
        +connect(port)
        +execute(command)
        +waitForDisconnect()
    }
    class SerialFlightController {
        <<infrastructure>>
        -SerialPort port
        -EventEmitter events
    }
    class ExecuteCliUseCase {
        <<application>>
        -IFlightController controller
        +execute(command)
    }
    IFlightController <|.. SerialFlightController
    ExecuteCliUseCase --> IFlightController
```

### Рівні (Layers):
- **Domain Layer**: Сутності та інтерфейси (`IFlightController`, `CliParser`).
- **Application Layer**: Use Cases, що реалізують конкретні бізнес-сценарії (`ExecuteCliUseCase`, `GetHealthCheckUseCase`).
- **Infrastructure Layer**: Реалізація Serial-зв'язку та Port Scanning.
- **Delivery Layer (Composition Root)**: CLI інтерфейс у `src/interfaces/cli/`.

---

## 2.1. Composition Root & Dependency Injection
Згідно з принципами Clean Architecture, ми використовуємо **Delivery Layer** як **Composition Root**. 

> [!IMPORTANT]
> Тільки файли в `src/interfaces/cli/` мають право імпортувати як `application`, так і `infrastructure`. Саме тут відбувається інстанціювання конкретних реалізацій (наприклад, `SerialFlightController`) та їх передача (Injection) в Use Cases.

Це дозволяє шару **Application** залишатися "стерильним" та не знати нічого про деталі реалізації заліза чи бібліотек логування.

---

## 3. Process View (Hardware Interaction)
Особлива увага приділена стабільності при роботі з залізом. FlyCLI реалізує стійку обробку асинхронних подій.

### Сценарій "Execute Command & Reboot":
Коли надсилається команда `save`, FlyCLI переходить у режим очікування розриву з'єднання (VCP disconnect), що є критичним для STM32-базованих систем.

```mermaid
sequenceDiagram
    participant App as ExecuteCliUseCase
    participant Controller as SerialFlightController
    participant Hardware as Chip (STM32)

    App->>Controller: execute("save")
    Controller->>Hardware: send("save\n")
    Note over Hardware: Rebooting...
    Hardware-->>Controller: VCP Disconnect
    Controller->>App: resolve("Rebooting...")
    App->>User: Success
```

---

## 4. Development View (Standards & Tools)
Проєкт дотримується принципів високої якості коду, що робить його AI-Ready та легким для підтримки.

- **Linting**: Airbnb JavaScript Style Guide (Strict).
- **Module System**: ESM (ECMAScript Modules).
- **Testing Strategy**:
    - **Unit (Jest)**: 100% покриття бізнес-логіки Use Case за допомогою моків. Тести знаходяться в `test/unit/`.
    - **Integration (Jest)**: Технічна верифікація інфраструктури (стабільність з'єднання, архітектурні правила). Перевіряє `no-app-to-infra` за допомогою **dependency-cruiser**. Тести в `test/integration/`.
    - **BDD (Cucumber)**: Реальна поведінкова верифікація на апаратному чіпі (STM32F411). Тести в `test/bdd/` — це основний доказ працездатності для кінцевого користувача.
- **Safety**: Кожна операція захищена таймаутами та механізмами очищення буферів (flush).

---

## 5. Physical View (Deployment)
FlyCLI розгортається як Node.js інструмент на хост-машині, що з'єднана з Flight Controller через USB-кабель (COM/TTY Port).

```mermaid
deployment
    node HostMachine [Host Machine (macOS/Linux)] {
        instance FlyCLI_App [Node.js Runtime]
    }
    node FlightController [STM32 Flight Controller] {
        instance Betaflight [Betaflight Firmware]
    }
    HostMachine -- "USB (Serial VCP)" --> FlightController
```

---

## 6. Implementation Reality (Bottom-Up Challenges)

На відміну від "ідеальної" схеми Clean Architecture, реальна робота з польотними контролерами через USB-VCP (Virtual COM Port) вимагає обробки специфічних апаратних нюансів.

### 6.1. Проблема фрагментації даних (Serial Chunks)
**Теорія:** Ми відправляємо команду і отримуємо відповідь.
**Реальність:** Дані від Betaflight приходять шматками (chunks) по 64 або 128 байт. Символ промпта `# ` може прийти в середині одного чанка або бути розірваним між двома.
**Рішення:** `SerialFlightController` реалізує внутрішню машину станів на базі `EventEmitter`, яка накопичує дані в `#buffer` до моменту повної відповідності регулярному виразу промпта.

### 6.2. Проблема фальшивих промптів та Debounce
**Теорія:** Поява `# ` означає кінець виводу.
**Реальність:** Betaflight може надіслати `# `, а через 10-20 мс дослати останні рядки логу (наприклад, у команді `diff`).
**Рішення:** В `ExecuteCliUseCase` додано примусову затримку (debounce) **300мс** після детекції промпта. Це гарантує, що ми зчитаємо весь хвіст даних, які могли затриматися в USB-буфері чіпа.

### 6.3. Hardware Handshake (MSP + CLI)
**Теорія:** Відкриваємо порт і пишемо `#`.
**Реальність:** Якщо чіп щойно підключений, він може ігнорувати перші символи в буфері UART.
**Рішення:** Ми спочатку виконуємо **MSP Handshake** (запит `API_VERSION`). Це змушує прошивку ініціалізувати USB-стек для передачі даних. Тільки після успішної MSP-відповіді ми намагаємося увійти в CLI режим.

---

## Key Design Decisions (ADR Summary)
- **Prompt Detection**: Використання регулярних виразів для детекції `#` або `CLI` банера замість фіксованих пауз.
- **Echo Suppression**: Автоматичне видалення відлуння команди з результатів парсингу для чистоти даних.
- **Resilient Parsing**: `CliParser` пріоритезує заголовки таблиць, що дозволяє AI коректно розпізнавати стани сенсорів та задач.
- **Strict ESM over TS**: Свідомий вибір чистого JavaScript (ESM) для спрощення запуску в обмежених AI-контейнерах без етапу транспайляції.
