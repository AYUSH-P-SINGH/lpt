#include "crc.h"

// Mode S CRC generator polynomial: x^24 + x^23 + x^10 + x^3 + 1
static const uint32_t MODES_GENERATOR = 0xFFF409U;

uint32_t modes_crc(const uint8_t* data, uint8_t len)
{
    // TODO: implement CRC
    return 0;
}

bool modes_crc_valid(const uint8_t* data, uint8_t len)
{
    return modes_crc(data, len) == 0;
}
