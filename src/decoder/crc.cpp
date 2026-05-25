#include "crc.h"

// Mode S CRC generator polynomial: x^24 + x^23 + x^10 + x^3 + 1
static const uint32_t MODES_GENERATOR = 0xFFF409U;

uint32_t modes_crc(const uint8_t* data, uint8_t len)
{
    uint32_t crc = 0;
    for (int i = 0; i < len; i++) {
        crc ^= (uint32_t)data[i] << 16;
        for (int b = 0; b < 8; b++) {
            if (crc & 0x800000U)
                crc = (crc << 1) ^ MODES_GENERATOR;
            else
                crc <<= 1;
        }
    }
    return crc & 0xFFFFFFU;
}

bool modes_crc_valid(const uint8_t* data, uint8_t len)
{
    return modes_crc(data, len) == 0;
}
