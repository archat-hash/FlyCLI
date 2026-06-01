# 5. Physical View

## Context
This view illustrates the deployment environment and the physical hardware connections required for FlyCLI and its interactive features to function.

## 5.1 Deployment & Hardware Topology
FlyCLI is deployed as a Node.js CLI tool running on the Host machine, communicating over USB Serial protocols to embedded devices.

```mermaid
graph TD
    subgraph Agent Host PC
        Agent[AI Agent Process (e.g. Antigravity)]
        Node[Node.js Runtime]
        FlyCLI[FlyCLI App]
        Serial[System Serial APIs]
        
        Agent -- "Spawns via Shell" --> FlyCLI
        FlyCLI --> Node
        Node --> Serial
    end
    
    subgraph Flight Controller Stack
        STM32[STM32 Chip]
        BF[Betaflight FW]
        RX[Radio Receiver]
        
        Serial -- "USB VCP (Serial)" --> STM32
        STM32 --> BF
        STM32 -- "CRSF / SBUS / FPort" --> RX
    end
    
    subgraph Pilot
        TX[Radio Transmitter]
        
        TX -- "2.4GHz / 868MHz / 915MHz" --> RX
    end
```

## 5.2 Physical Constraints
1. **USB Connectivity:** The Host PC must maintain an uninterrupted USB Virtual COM Port connection. Standard OS buffering rules apply.
2. **Radio Link Verification:** For RC calibration wizards, the Transmitter (TX) must be bound to the Receiver (RX), and the Receiver correctly wired to a Flight Controller UART. FlyCLI acts as a digital bridge crossing the air gap to verify this physical link.
