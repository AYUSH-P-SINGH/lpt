#include "modes.h"
#include "crc.h"
#include <cstring>

bool modes_parse(const uint8_t* raw, uint8_t len, ModeSFrame* out)
{
    // TODO: implement frame parsing
    return false;
}

uint8_t modes_df(const ModeSFrame* frame) { return (frame->data[0] >> 3) & 0x1F; }
uint8_t modes_tc(const ModeSFrame* frame) { return (frame->data[4] >> 3) & 0x1F; }
