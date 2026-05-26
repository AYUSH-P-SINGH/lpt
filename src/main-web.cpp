// src/main-web.cpp — web-mode entry point (no SDL2)
#include <cstdio>
#include <csignal>
#include <thread>
#include <atomic>
#include <mutex>
#include <vector>
#include <chrono>
#include <climits>

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
#include "decoder/callsign.h"
#include "tracker/aircraft_table.h"
#include "web/server.h"

static const uint32_t ADSB_FREQ_HZ     = 1090000000U;
static const uint32_t ADSB_SAMPLE_RATE = 2000000U;
static const double   HOME_LAT         = 37.7749;
static const double   HOME_LON         = -122.4194;

static RingBuffer        g_ring;
static std::atomic<bool> g_running{true};
static std::mutex        g_table_mutex;

// copy iq_to_mag, now_ms, dsp_thread_fn, radio_cb verbatim from src/main.cpp

int main()
{
    printf("lpt-web — ADS-B Plane Tracker\n");
    printf("Tuning to %.0f MHz...\n", ADSB_FREQ_HZ / 1e6);

    rb_init(&g_ring);
    if (rtlsdr_init(ADSB_FREQ_HZ, ADSB_SAMPLE_RATE) < 0) return 1;

    signal(SIGINT,  [](int){ server_stop(); });
    signal(SIGTERM, [](int){ server_stop(); });

    std::thread radio_thread([]() { rtlsdr_start(radio_cb); });
    std::thread dsp_thread(dsp_thread_fn);

    ServerConfig cfg;
    cfg.center_lat     = HOME_LAT;
    cfg.center_lon     = HOME_LON;
    cfg.receiver_label = "HOME";
    printf("Listening at http://localhost:%d\n", cfg.port);
    server_run(cfg, g_table_mutex);   // blocks until SIGINT / SIGTERM

    g_running = false;
    rtlsdr_stop();
    radio_thread.join();
    dsp_thread.join();
    rtlsdr_close();
    return 0;
}