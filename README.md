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

- librtlsdr
- SDL2
- CMake 3.16+

## License

MIT

