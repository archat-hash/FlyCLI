# Покрокові Тест-Плани (TestLink Style)

Цей документ містить тест-плани, розроблені QA. Усі тест-кейси мають 100% покриття бізнес-вимог з `USE_CASES.md`.

---

## Epic 1: MSP Infrastructure & Base CLI

### Test Case 1.1: Успішне сканування портів
**Pre-conditions:** Flight Controller підключений.
1. **Крок:** Виконати `flycli scan`
   *Очікуваний результат:* У `stdout` виводиться список портів. Один з портів має мітку `[FC Candidate]` на базі vendorId.

### Test Case 1.2: Відсутність пристроїв під час сканування
**Pre-conditions:** Всі USB-пристрої відключені.
1. **Крок:** Виконати `flycli scan`
   *Очікуваний результат:* Виводиться повідомлення "No serial ports found". Програма завершується з кодом `0`.

### Test Case 1.3: Успішний Handshake та CLI команда
**Pre-conditions:** Flight Controller підключений.
1. **Крок:** Виконати `flycli execute <port> 115200 status`
   *Очікуваний результат:* Підключення встановлено. Програма надсилає MSP `API_VERSION`, чекає відповідь, надсилає `status`. У `stdout` виводиться інформація про статус дрона (без луни команди `status`).

### Test Case 1.4: Таймаут під час Handshake
**Pre-conditions:** Підключено USB-пристрій, який не підтримує MSP (наприклад, Arduino зі стандартним скетчем).
1. **Крок:** Виконати `flycli execute <port> 115200 status`
   *Очікуваний результат:* Через 2 секунди програма завершується з помилкою `TimeoutError: MSP Handshake failed`.

---

## Epic 2: Interactive Human-in-the-Loop Wizards

### Test Case 2.1: Успішне калібрування всіх осей
**Pre-conditions:** Flight Controller підключений. Пульт забінджений.
1. **Крок:** Виконати `flycli wizard rx <port> --json`
   *Очікуваний результат:* З'являються прогрес-бари в `stderr`.
2. **Крок:** Порухати всі 4 стіки (Roll, Pitch, Yaw, Throttle) в крайнощі (<1100, >1900).
   *Очікуваний результат:* Процес завершується. У `stdout` виводиться валідний JSON зі статусом `success`.

### Test Case 2.2: Таймаут калібрування (Бездіяльність)
**Pre-conditions:** Flight Controller підключений.
1. **Крок:** Виконати `flycli wizard rx <port> --json`
2. **Крок:** Не чіпати пульт протягом 15 секунд.
   *Очікуваний результат:* Процес автоматично переривається. У `stdout` JSON зі статусом `timeout`.

---

## Epic 3: AI Software Factory & Auditability

### Test Case 3.1: Збереження контексту команди
**Pre-conditions:** Папка `~/.flycli/agent_logs` порожня.
1. **Крок:** Виконати `flycli health --json`
   *Очікуваний результат:* Команда успішно відпрацювала.
2. **Крок:** Відкрити `~/.flycli/agent_logs/workflow_current.jsonl`
   *Очікуваний результат:* Створено файл. Останній рядок містить JSON об'єкт `EventMessage` зі збереженим stdout команди health.

---

## Epic 4: AI-Assisted CAD Integration

### Test Case 4.1: Lazy-старт FreeCAD
**Pre-conditions:** Процес `FreeCADCmd` не запущений в ОС. Сервер MCP запущений.
1. **Крок:** Перевірити список процесів ОС (Task Manager / `ps`).
   *Очікуваний результат:* FreeCAD відсутній.
2. **Крок:** Надіслати запит `mcp_cad_command` через клієнт.
   *Очікуваний результат:* Процес FreeCAD запускається. Команда успішно виконується, повертає результат клієнту.
