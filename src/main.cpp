#include <cstdio>
#include <cstdint>
#include <thread>
#include <atomic>

#include "types.h"
#include "radio/rtlsdr.h"
#include "radio/ring_buffer.h"
#include "dsp/preamble.h"
#include "dsp/demod.h"
#include "decoder/modes.h"
#include "decoder/crc.h"
#include "decoder/cpr.h"
#include "decoder/altitude.h"
#include "decoder/velocity.h"
#include "renderer/map.h"
#include "renderer/aircraft.h"

static const uint32_t ADSB_FREQ_HZ       = 1090000000U;
static const uint32_t ADSB_SAMPLE_RATE   = 2000000U;

static RingBuffer g_ring;
static std::atomic<bool> g_running{true};

int main()
{
    printf("ADS-B Plane Tracker\n");
    printf("Tuning to %.0f MHz...\n", ADSB_FREQ_HZ / 1e6);

    rb_init(&g_ring);

    if (rtlsdr_init(ADSB_FREQ_HZ, ADSB_SAMPLE_RATE) < 0)
        return 1;

    // TODO: start DSP thread, render loop
    // This stub just confirms the pipeline compiles

    rtlsdr_close();
    return 0;
}
