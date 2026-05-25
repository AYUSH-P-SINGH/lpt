#include "velocity.h"

// payload[0..6] is the 7-byte ME field of a TC19 (airborne velocity) message
#include <cmath>

bool velocity_decode(const uint8_t* payload, float* speed_kt,
                     float* heading_deg, int32_t* vert_rate_fpm)
{
    uint8_t st = payload[0] & 0x07; // subtype
    if (st != 1 && st != 2) return false; // only ground speed subtypes

    // East-west velocity
    int ew_dir = (payload[1] >> 2) & 1;
    int ew_vel = ((payload[1] & 0x03) << 8) | payload[2];
    // North-south velocity
    int ns_dir = (payload[3] >> 7) & 1;
    int ns_vel = ((payload[3] & 0x7F) << 3) | (payload[4] >> 5);

    if (ew_vel == 0 || ns_vel == 0) return false;
    ew_vel--; ns_vel--;
    if (ew_dir) ew_vel = -ew_vel;
    if (ns_dir) ns_vel = -ns_vel;

    float spd = sqrtf((float)(ew_vel*ew_vel + ns_vel*ns_vel));
    float hdg = atan2f((float)ew_vel, (float)ns_vel) * 180.0f / 3.14159265f;
    if (hdg < 0) hdg += 360.0f;

    *speed_kt   = spd;
    *heading_deg = hdg;

    // Vertical rate (bits 36-45 of ME, 64 fpm resolution)
    int vr_src  = (payload[4] >> 3) & 1;
    int vr_sign = (payload[4] >> 2) & 1;
    int vr_val  = ((payload[4] & 0x03) << 7) | (payload[5] >> 1);
    (void)vr_src;
    if (vr_val == 0) {
        *vert_rate_fpm = 0;
    } else {
        vr_val--;
        *vert_rate_fpm = (vr_sign ? -1 : 1) * vr_val * 64;
    }
    return true;
}
