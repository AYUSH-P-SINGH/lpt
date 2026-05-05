#pragma once
#include <cstdint>

// Raw IQ sample from RTL-SDR
struct IQSample {
    int16_t i;
    int16_t q;
};

// Decoded Mode S frame
struct ModeSFrame {
    uint8_t  data[14];      // raw payload bytes
    uint8_t  len;           // 7 (short) or 14 (long squitter)
    uint32_t icao;          // 24-bit ICAO aircraft address
    uint64_t timestamp_ms;  // time of reception
};

// Tracked aircraft state
struct Aircraft {
    uint32_t icao;              // unique 24-bit identifier
    char     callsign[9];       // 8 chars + null terminator
    double   lat;               // decimal degrees
    double   lon;               // decimal degrees
    int32_t  altitude_ft;       // pressure altitude in feet
    float    groundspeed_kt;    // knots
    float    heading_deg;       // 0-360 degrees
    uint64_t last_seen_ms;      // timestamp of last received message
    bool     position_valid;    // true once CPR decode has succeeded
};
