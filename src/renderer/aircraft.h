#pragma once
#include "../types.h"

// Draw a single aircraft icon, label, and trail on the current frame
void aircraft_draw(const Aircraft* ac);

// Draw velocity vector line from aircraft position
void aircraft_draw_vector(const Aircraft* ac);
