#include "aircraft_table.h"
#include <unordered_map>
#include <cstring>

static std::unordered_map<uint32_t, Aircraft> s_table;

Aircraft* table_upsert(uint32_t icao, uint64_t now_ms)
{
    auto it = s_table.find(icao);
    if (it == s_table.end()) {
        Aircraft ac{};
        ac.icao = icao;
        ac.last_seen_ms = now_ms;
        s_table[icao] = ac;
    } else {
        it->second.last_seen_ms = now_ms;
    }
    return &s_table[icao];
}

void table_expire(uint64_t now_ms, uint64_t timeout_ms)
{
    for (auto it = s_table.begin(); it != s_table.end(); ) {
        if (now_ms - it->second.last_seen_ms > timeout_ms) {
            it = s_table.erase(it);
        } else {
            ++it;
        }
    }
}

void table_for_each(void (*cb)(const Aircraft*, void*), void* ctx)
{
    for (const auto& kv : s_table) {
        cb(&kv.second, ctx);
    }
}
