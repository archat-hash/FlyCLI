# Flight Controller Tuning Knowledge Base

This document serves as a reference for AI agents to analyze and recommend PID/Filter settings for various drone configurations.

## 1. Betaflight Tuning Defaults (Reference)
Most modern 5" drones perform well with Betaflight 4.4+ defaults, but specific frames require adjustments.

| Parameter | 5" Freestyle | 3" CineWhoop | 7" Long Range |
| --- | --- | --- | --- |
| **P-term (Pitch/Roll)** | 45-60 | 60-80 | 40-55 |
| **I-term (Pitch/Roll)** | 80-100 | 90-110 | 100-120 |
| **D-term (Pitch/Roll)** | 35-45 | 40-50 | 30-40 |
| **Feedforward** | 100-150 | 80-120 | 60-90 |

## 2. Filtering Strategy
Filters are critical for preventing motor overheating while maintaining flight feel.

### Gyro Lowpass Filters
- **Default**: `gyro_lowpass_type = PT1`, `gyro_lowpass_hz = 250`.
- **Aggressive (Clean Builds)**: Move slider to 1.5 - 2.0 (cutoffs at 400Hz+).
- **Conservative (Noisy/Old Motors)**: Move slider to 0.8 - 0.9 (cutoffs at 150-200Hz).

### D-Term Lowpass Filters
- D-term is the main source of heat.
- Always use `PT1` or `BIQUAD` depending on noise level.
- **Rule of Thumb**: If motors are hot, lower `dterm_lowpass_hz`.

## 3. Common Issues & Solutions

| Issue | Potential Cause | AI Recommendation |
| --- | --- | --- |
| **Propwash Oscillations** | Low D-term or Low Feedforward | Increase D-term (by 5) or FF (by 10). Check `dterm_filter_lpf2`. |
| **Mid-throttle oscillations** | Frame resonance | Adjust TPA (Throttle PID Attenuation). Default starts at 1350. |
| **Slow/Mushy Feel** | Low P-term or Low Rates | Increase P-term or adjust RC Rates. |
| **Washout (Hard turns)** | Low I-term or Anti-Gravity | Increase `iterm_relax` or `antigravity_gain`. |

## 4. Safety Limits (Hard Caps)
AI agents MUST NOT exceed these values without specific expert override:
- `p_pitch/roll` > 120
- `d_pitch/roll` > 70
- `gyro_lowpass_hz` < 80 (Too much latency)
- `dterm_lowpass_hz` > 500 (Risk of motor burnout)

---
*Last updated: 2026-05-23*
