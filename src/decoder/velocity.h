#pragma once
#include <cstdint>

// Decode groundspeed (knots) and track angle (degrees) from a TC19 message
// Returns true on success
bool velocity_decode(const uint8_t* payload, float* speed_kt, float* heading_deg,
                     int32_t* vert_rate_fpm);
