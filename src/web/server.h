#pragma once
#include <mutex>
#include <string>

struct ServerConfig {
    int         port           = 8080;
    std::string web_dir        = "web";   // relative to working directory
    double      center_lat     = 0.0;
    double      center_lon     = 0.0;
    std::string receiver_label = "HOME";
};

// Start the HTTP server — blocks until server_stop() is called.
// table_mutex must guard the aircraft table in main-web.cpp.
void server_run(const ServerConfig& cfg, std::mutex& table_mutex);

// Signal server_run() to return cleanly.
void server_stop();