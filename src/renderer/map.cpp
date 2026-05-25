#include "map.h"

static SDL_Renderer* g_renderer = nullptr;
SDL_Renderer* map_renderer() { return g_renderer; }
int  map_init(int w, int h, double clat, double clon) { return 0; /* TODO */ }
void map_project(double lat, double lon, int* x, int* y) { /* TODO */ }
void map_draw_background() { /* TODO */ }
void map_draw_range_rings(float nm) { /* TODO */ }
bool map_present() { return true; /* TODO */ }
void map_close() { /* TODO */ }
