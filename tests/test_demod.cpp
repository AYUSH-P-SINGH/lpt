#include <cstdio>
#include <cassert>
#include <cstdint>
#include "dsp/demod.h"

int main()
{
    // Build a synthetic magnitude buffer encoding bits: 1 0 1 1 0
    // Each bit = 4 samples; bit=1 means first half > second half.
    const int BITS = 5;
    float mag[BITS * 4];
    const uint8_t pattern[BITS] = {1, 0, 1, 1, 0};

    for (int i = 0; i < BITS; i++) {
        float hi = 1.0f, lo = 0.2f;
        mag[i*4+0] = pattern[i] ? hi : lo;
        mag[i*4+1] = pattern[i] ? hi : lo;
        mag[i*4+2] = pattern[i] ? lo : hi;
        mag[i*4+3] = pattern[i] ? lo : hi;
    }

    uint8_t dst[112] = {};
    int n = demod_ook(mag, BITS * 4, dst);

    assert(n == BITS);
    for (int i = 0; i < BITS; i++)
        assert(dst[i] == pattern[i]);

    printf("test_demod: all tests passed\n");
    return 0;
}
