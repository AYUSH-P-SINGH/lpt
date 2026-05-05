#pragma once
#include <cstdint>

// Decode Gillham (Gray coded) altitude field from a Mode S frame
// Returns altitude in feet, or INT32_MIN on invalid input
int32_t altitude_decode_gillham(uint16_t raw);
