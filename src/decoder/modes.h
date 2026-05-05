#pragma once
#include "../types.h"

// Parse raw bytes into a ModeSFrame
// Returns true if the frame is well-formed and passes CRC
bool modes_parse(const uint8_t* raw, uint8_t len, ModeSFrame* out);

// Extract downlink format from frame
uint8_t modes_df(const ModeSFrame* frame);

// Extract type code (for DF17 extended squitter)
uint8_t modes_tc(const ModeSFrame* frame);
