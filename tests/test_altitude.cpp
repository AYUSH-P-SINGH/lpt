#include <cassert>
#include <cstdio>
#include <climits>
#include "decoder/altitude.h"

int main()
{
    // Q-bit path: 10000 ft  (raw=912, n=448, 448*25-1200=10000)
    assert(altitude_decode_gillham(912) == 10000);

    // Q-bit path: 0 ft  (raw=112, n=48, 48*25-1200=0)
    assert(altitude_decode_gillham(112) == 0);

    // Q-bit path: -1025 ft  (raw=30, n=7, 7*25-1200=-1025)
    assert(altitude_decode_gillham(30) == -1025);

    // Q-bit path: -1200 ft  (raw=16, n=0, 0*25-1200=-1200)
    assert(altitude_decode_gillham(16) == -1200);

    // Gillham Gray-code path: raw=0 → D100==0 → invalid
    assert(altitude_decode_gillham(0) == INT32_MIN);

    printf("test_altitude: all tests passed\n");
    return 0;
}
