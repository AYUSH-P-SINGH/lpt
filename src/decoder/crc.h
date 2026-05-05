#pragma once
#include <cstdint>

// Compute Mode S 24-bit CRC over len bytes
uint32_t modes_crc(const uint8_t* data, uint8_t len);

// Returns true if the frame passes CRC validation
bool modes_crc_valid(const uint8_t* data, uint8_t len);
