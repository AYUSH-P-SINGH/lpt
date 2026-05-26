#include <cassert>
#include <cstdio>
#include "tracker/aircraft_table.h"

int main() {
    // upsert creates new entry
    Aircraft* a = table_upsert(0xABC123, 1000);
    assert(a != nullptr);
    assert(a->icao == 0xABC123);
    assert(a->last_seen_ms == 1000);

    // upsert same ICAO returns same entry, updates timestamp
    Aircraft* b = table_upsert(0xABC123, 2000);
    assert(b == a);
    assert(a->last_seen_ms == 2000);

    // different ICAO creates a second entry
    Aircraft* c = table_upsert(0x111111, 2000);
    assert(c != a);
    assert(c->icao == 0x111111);

    // expire: timeout=1500ms, now=3000ms → entry seen at 1000ms is stale but 2000ms is not
    // Wait: a->last_seen_ms was updated to 2000, so at now=3000, age=1000 < 1500 → kept
    // c->last_seen_ms=2000, age=1000 < 1500 → kept
    table_expire(3000, 1500);
    // both still present — verify by counting via for_each
    int count = 0;
    table_for_each([](const Aircraft*, void* ctx){ (*(int*)ctx)++; }, &count);
    assert(count == 2);

    // expire with short timeout removes both
    table_expire(4000, 500);
    count = 0;
    table_for_each([](const Aircraft*, void* ctx){ (*(int*)ctx)++; }, &count);
    assert(count == 0);

    printf("test_tracker: all tests passed\n");
    return 0;
}
