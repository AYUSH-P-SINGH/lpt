#pragma once
#include <cstdint>

// Search a buffer of magnitude samples for an ADS-B preamble
// Returns the sample index of the preamble start, or -1 if not found
int preamble_search(const float* mag, uint32_t len);
