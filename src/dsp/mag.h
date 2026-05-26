#pragma once
#include <cstdint>

// Convert interleaved uint8 IQ bytes to float magnitude array.
// iq_len is the number of IQ bytes (must be even); mag_out receives iq_len/2 values.
// Uses hypotf: mag[i] = hypotf(iq[2i]-127.5, iq[2i+1]-127.5)
// Fast approximation alternative: |I|+|Q| (lower latency, ~11% overestimate peak)
void iq_to_mag(const uint8_t* iq, uint32_t iq_len, float* mag_out);
