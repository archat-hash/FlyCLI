# 🛠 Betaflight CLI: Functionality Reverse-Engineering

This document contains a complete list of commands built into your flight controller's firmware, obtained directly through **FlyCLI**. Each command is explained to understand the system's capabilities.

---

## ⚙️ Setup and Configuration

| Command | Description |
| --- | --- |
| `get` / `set` | Get or change the value of any configuration variable. The primary way to configure. |
| `save` | Save changes to memory and reboot the controller. |
| `defaults` | Reset all settings to factory (Betaflight defaults). |
| `diff` | Display only those settings that differ from the standard ones. |
| `dump` | Full dump of all controller settings. |
| `feature` | Enable/disable global functions (e.g., GPS, OSD, AIRMODE). |
| `profile` | Switch between setting profiles (PIDs, filters). |
| `rateprofile` | Switch between rate profiles (drone rotation speed). |
| `aux` | Configure flight modes on radio switches (ARM, ANGLE, HORIZON, etc.). |
| `vtx` / `vtxtable` | Video transmitter control: frequencies, power, and channel grid. |
| `simplified_tuning` | Apply "simplified" tuning presets. |

---

## 🔍 Diagnostics and Monitoring

| Command | Description |
| --- | --- |
| `status` | Current system state: CPU load, voltage, temperature, I2C errors, uptime. |
| `tasks` | Monitoring of system processes and their execution frequency (PID loop, sensors). |
| `version` | Detailed information about the firmware version and target board. |
| `sd_info` | SD card state (if present) for Blackbox logs. |
| `flash_info` | Information about built-in flash memory for logs. |
| `dshot_telemetry_info` | Telemetry status from electronic speed controllers (ESC). |
| `vtx_info` | Diagnostics of the connected video transmitter. |

---

## 🔌 Low-Level Hardware Work

| Command | Description |
| --- | --- |
| `resource` | Resource mapping: assigning functions (UART, Motor, LED) to physical pins of the processor. |
| `timer` / `dma` | Timer and Direct Memory Access configuration (critical for DShot and LED operation). |
| `mcu_id` | Unique identifier of your microcontroller. |
| `motor` | Control motors individually (rotation direction testing). |
| `mixer` / `mmix` | Motor mixer configuration: how thrust is distributed among them depending on the frame. |
| `smix` | Servo mixer configuration (for planes or tricopters). |

---

## 🚀 Special Modes and Services

| Command | Description |
| --- | --- |
| `bl` | Immediate switch to **Bootloader** mode (for flashing via DFU). |
| `msc` | Switch the controller to USB mass storage mode (for reading the SD card). |
| `gpspassthrough` | Passing data from the GPS module directly to your computer via USB. |
| `serialpassthrough` | Passing data from any UART port to USB (useful for peripheral configuration). |
| `escprog` | Passing communication for flashing regulators (BLHeliPassthrough). |
| `bind_rx` | Start binding mode for integrated receivers (SPI or SRXL2). |
| `play_sound` | Play sound signals via the beeper. |

---

### Note for AI Agent:
This command list is the basis for automated diagnostics. If you want to check hardware health, start with `status` and `resource show`. To change behavior, use `get/set` and necessarily `save`.
