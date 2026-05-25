#include <cassert>
#include <cstdio>
#include <cstring>
#include "decoder/callsign.h"

int main()
{
    // Example message from real capture: "N12345"
    uint8_t me[7] = {0x08, 0x2C, 0xCD, 0x8C, 0x32, 0xCB, 0x20};
    char cs[9];
    assert(callsign_decode(me, cs));
    assert(strcmp(cs, "KLM1023") == 0);

    const uint8_t me_bad[7] = {0x00};
    assert(!callsign_decode(me_bad, cs));

    // TC=5 → out of range
    const uint8_t me_tc5[7] = {0x28};
    assert(!callsign_decode(me_tc5, cs));

    // All spaces → null-terminator at index 0
    const uint8_t me_spaces[7] = {0x08, 0x82, 0x08, 0x20, 0x82, 0x08, 0x20};
    assert(callsign_decode(me_spaces, cs));
    assert(cs[0] == '\0');

    printf("test_callsign: all tests passed\n");
    return 0;
}