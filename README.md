# lpt — ADS-B Plane Tracker

Real-time aircraft tracking in C++ using an RTL-SDR dongle. Decodes ADS-B Mode S transmissions at 1090 MHz from scratch — no GNU Radio, no dump1090.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/GageLawton/lpt/actions/workflows/ci.yml/badge.svg)](https://github.com/GageLawton/lpt/actions/workflows/ci.yml)

---

## Overview

lpt listens on 1090 MHz with a cheap RTL-SDR USB dongle and builds a live map of aircraft overhead. Every stage of the receive chain is implemented from scratch in C++17:

```
RTL-SDR hardware
      │  raw IQ bytes (uint8, 2 MSPS)
      ▼
 IQ → magnitude        (dsp/mag)
      │  float amplitude samples
      ▼
 Preamble detector      (dsp/preamble)
      │  frame start offset
      ▼
 OOK demodulator        (dsp/demod)
      │  bit stream (112 bits / frame)
      ▼
 Mode S parser + CRC    (decoder/modes, decoder/crc)
      │  ModeSFrame  (ICAO, raw payload)
      ▼
 Payload decoders
  ├─ CPR → lat/lon      (decoder/cpr)
  ├─ Altitude           (decoder/altitude)
  ├─ Velocity           (decoder/velocity)
  └─ Callsign           (decoder/callsign)
      │  Aircraft state
      ▼
 Aircraft state table   (tracker/aircraft_table)
      │  live fleet
      ▼
 SDL2 map renderer      (renderer/map, renderer/aircraft)
```

---

## Dependencies

| Library | Purpose | Install |
|---------|---------|---------|
| librtlsdr | RTL-SDR device driver | `apt install librtlsdr-dev` |
| SDL2 | Window and 2-D rendering | `apt install libsdl2-dev` |
| CMake 3.16+ | Build system | `apt install cmake` |
| C++17 compiler | e.g. GCC 9+ or Clang 9+ | `apt install g++` |

> **No hardware?** The decoder and DSP unit tests build and run with only CMake and a C++ compiler — librtlsdr and SDL2 are optional for that path.

---

## Build

```bash
# Install dependencies (Debian/Ubuntu)
sudo apt-get install -y cmake g++ librtlsdr-dev libsdl2-dev

# Configure and build
cmake -B build
cmake --build build --parallel

# Run (RTL-SDR dongle required)
./build/lpt
```

### Tests only (no hardware required)

```bash
cmake -B build
cmake --build build --parallel
ctest --test-dir build --output-on-failure
```

---

## Running

Plug in your RTL-SDR dongle, then:

```
./build/lpt
```

Expected startup output:

```
ADS-B Plane Tracker
Tuning to 1090 MHz...
[rtlsdr] Tuned to 1090.0 MHz @ 2.0 MSPS
```

An SDL2 window opens showing a dark map centred on your location. Aircraft appear as green dots within ~30 seconds if there is traffic overhead. Each dot shows the callsign and altitude; a short line indicates heading and ground speed.

Press the window's close button or `Ctrl-C` to exit cleanly.

---

## Project Structure

```
lpt/
├── src/
│   ├── types.h               # Shared structs: IQSample, ModeSFrame, Aircraft
│   ├── radio/
│   │   ├── rtlsdr.{h,cpp}    # RTL-SDR device wrapper
│   │   └── ring_buffer.{h,cpp}  # SPSC ring buffer (producer: radio, consumer: DSP)
│   ├── dsp/
│   │   ├── mag.{h,cpp}       # IQ → float magnitude
│   │   ├── preamble.{h,cpp}  # ADS-B preamble correlator
│   │   └── demod.{h,cpp}     # OOK bit demodulator
│   ├── decoder/
│   │   ├── crc.{h,cpp}       # Mode S CRC-24
│   │   ├── modes.{h,cpp}     # Frame parser (DF17/18)
│   │   ├── cpr.{h,cpp}       # Compact Position Reporting decode
│   │   ├── altitude.{h,cpp}  # Gillham altitude decode
│   │   ├── velocity.{h,cpp}  # TC19 ground speed decode
│   │   └── callsign.{h,cpp}  # TC1-4 identification decode
│   ├── tracker/
│   │   └── aircraft_table.{h,cpp}  # Live aircraft state table
│   └── renderer/
│       ├── map.{h,cpp}       # SDL2 window, projection, grid, range rings
│       └── aircraft.{h,cpp}  # Aircraft dot, label, velocity vector
├── tests/
│   ├── test_crc.cpp
│   ├── test_cpr.cpp
│   ├── test_demod.cpp
│   └── ...
└── CMakeLists.txt
```

---

## Contributing

Contributions are welcome. All open tasks are tracked as [GitHub Issues](https://github.com/GageLawton/lpt/issues) — each is scoped to roughly 15 minutes of work.

**Branch naming:** `issue/<number>-short-description`

**Workflow:**
1. Pick an issue and leave a comment so others know it is in progress
2. Fork or branch from `main`
3. Implement, making sure `ctest` still passes
4. Open a pull request referencing the issue (e.g. `Closes #4`)

Please keep commits focused — one logical change per commit.

---

## License

MIT — see [LICENSE](LICENSE) for details.
