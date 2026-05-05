#include "preamble.h"

// ADS-B preamble pattern (high/low in 0.5us units at 2MSPS):
// 1,0,1,0,0,0,0,1,0,1 over 16 samples
int preamble_search(const float* mag, uint32_t len)
{
    // TODO: implement preamble correlation
    return -1;
}
