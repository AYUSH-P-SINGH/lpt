# lpt — ADS-B Plane Tracker

Real-time aircraft tracking in C++ using an RTL-SDR dongle. Decodes ADS-B Mode S transmissions at 1090 MHz from scratch — no GNU Radio, no dump1090.

> README in progress. See GitHub Issues for current build status.

## Quick Build

```bash
mkdir build && cd build
cmake ..
make
./lpt
```

## Dependencies

- librtlsdr
- SDL2
- CMake 3.16+

## License

MIT

