#include "server.h"
#include "../tracker/aircraft_table.h"
#include "../types.h"

#include <atomic>
#include <chrono>
#include <cstdio>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>

#include "httplib.h"

static std::atomic<bool>   s_running{false};
static httplib::Server*    s_svr    = nullptr;

// ── JSON serialisation ────────────────────────────────────────────────────────

struct JsonCtx {
    std::ostringstream& out;
    bool first = true;
};

static void aircraft_to_json(const Aircraft* ac, void* raw)
{
    auto* ctx = static_cast<JsonCtx*>(raw);
    if (!ctx->first) ctx->out << ",";
    ctx->first = false;

    char hex[7];
    snprintf(hex, sizeof(hex), "%06X", ac->icao);

    ctx->out << "{\"icao\":\"" << hex << "\""
             << ",\"cs\":\""   << ac->callsign << "\""
             << ",\"lat\":"    << ac->lat
             << ",\"lon\":"    << ac->lon
             << ",\"alt\":"    << ac->altitude_ft
             << ",\"spd\":"    << ac->groundspeed_kt
             << ",\"hdg\":"    << ac->heading_deg
             << ",\"vs\":"     << ac->vert_rate_fpm
             << ",\"msgsRx\":" << ac->msgs_rx
             << ",\"firstSeenMs\":" << ac->first_seen_ms
             << ",\"lastSeenMs\":"  << ac->last_seen_ms
             << ",\"trail\":[";

    int start = (ac->trail_len == TRAIL_MAX) ? ac->trail_head : 0;
    for (int i = 0; i < ac->trail_len; i++) {
        int idx = (start + i) % TRAIL_MAX;
        if (i > 0) ctx->out << ",";
        ctx->out << "{\"lat\":" << ac->trail[idx].lat
                 << ",\"lon\":" << ac->trail[idx].lon << "}";
    }
    ctx->out << "]}";
}

static std::string build_json(const ServerConfig& cfg,
                              std::mutex& table_mutex,
                              uint64_t uptime_s)
{
    std::ostringstream body;
    body << "{\"receiver\":{\"lat\":"  << cfg.center_lat
         << ",\"lon\":"               << cfg.center_lon
         << ",\"label\":\""           << cfg.receiver_label << "\"},"
         << "\"stats\":{\"uptimeSec\":" << uptime_s << "},"
         << "\"planes\":[";

    JsonCtx ctx{body};
    {
        std::lock_guard<std::mutex> lk(table_mutex);
        table_for_each(aircraft_to_json, &ctx);
    }
    body << "]}";
    return body.str();
}

// ── Public API ────────────────────────────────────────────────────────────────

void server_run(const ServerConfig& cfg, std::mutex& table_mutex)
{
    s_running = true;

    auto start_ms = (uint64_t)std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now().time_since_epoch()).count();

    httplib::Server svr;
    s_svr = &svr;

    // Serve static files from web_dir
    if (!svr.set_mount_point("/", cfg.web_dir)) {
        fprintf(stderr, "[server] web_dir '%s' not found — static files unavailable\n",
                cfg.web_dir.c_str());
    }

    // SSE stream: push aircraft JSON every second
    svr.Get("/events", [&](const httplib::Request&, httplib::Response& res) {
        res.set_chunked_content_provider(
            "text/event-stream",
            [&](size_t, httplib::DataSink& sink) -> bool {
                if (!s_running) return false;

                auto now_ms = (uint64_t)std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::steady_clock::now().time_since_epoch()).count();
                uint64_t uptime_s = (now_ms - start_ms) / 1000;

                std::string json = build_json(cfg, table_mutex, uptime_s);
                std::string msg  = "data: " + json + "\n\n";

                if (!sink.write(msg.c_str(), msg.size())) return false;

                std::this_thread::sleep_for(std::chrono::seconds(1));
                return true;
            }
        );
    });

    svr.listen("0.0.0.0", cfg.port);

    s_svr     = nullptr;
    s_running = false;
}

void server_stop()
{
    s_running = false;
    if (s_svr) s_svr->stop();
}
