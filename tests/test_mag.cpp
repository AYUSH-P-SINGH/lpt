#include <cassert>
#include <cstdio>
#include <cmath>
#include "dsp/mag.h"

int main()
{
    float out[4];

    // Test 1: all-high IQ (255,255) → large magnitude ~180.3
    {
        uint8_t iq[] = {255, 255, 255, 255};
        iq_to_mag(iq, 4, out);
        assert(out[0] > 100.0f);
        assert(out[1] > 100.0f);
    }

    // Test 2: DC-centred IQ (128,128) → small magnitude ~0.707
    {
        uint8_t iq[] = {128, 128};
        iq_to_mag(iq, 2, out);
        assert(out[0] < 2.0f);
    }

    // Test 3: length check — 6 IQ bytes → 3 output samples
    {
        uint8_t iq[] = {255, 0, 0, 255, 128, 128};
        iq_to_mag(iq, 6, out);
        // sample 0: I=127.5, Q=-127.5 → mag≈180.3
        assert(out[0] > 100.0f);
        // sample 1: I=-127.5, Q=127.5 → mag≈180.3
        assert(out[1] > 100.0f);
        // sample 2: I=0.5, Q=0.5 → mag≈0.707
        assert(out[2] < 2.0f);
    }

    // Test 4: zero IQ (0,0) → magnitude = hypotf(-127.5,-127.5) ≈ 180.3 (not ~0)
    {
        uint8_t iq[] = {0, 0};
        iq_to_mag(iq, 2, out);
        assert(out[0] > 100.0f);
    }

    // Test 5: iq_len=0 → no output written (no crash)
    {
        iq_to_mag(nullptr, 0, out);
    }

    printf("test_mag: all tests passed\n");
    return 0;
}
