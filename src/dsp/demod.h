#pragma once
#include <cstdint>
#include "../types.h"

// Demodulate OOK bits from magnitude samples starting after a detected preamble
// dst must be at least 112 bytes. Returns number of bits decoded.
int demod_ook(const float* mag, uint32_t len, uint8_t* dst);
