#include <cassert>
#include <cstdio>
#include <cmath>
#include "decoder/velocity.h"

static bool approx(float a, float b, float tol=1.0f) { return fabsf(a-b) < tol; }

int main()
{
    float spd, hdg; int32_t vr;

    // 100 kt due east → heading ≈ 90°
    { uint8_t me[] = {0x99,0x00,0x65,0x00,0x20,0x00,0x00};
      assert(velocity_decode(me,&spd,&hdg,&vr));
      assert(approx(spd,100.f)); assert(approx(hdg,90.f)); }

    // 100 kt due north → heading ≈ 0°
    { uint8_t me[] = {0x99,0x00,0x01,0x0C,0xA0,0x00,0x00};
      assert(velocity_decode(me,&spd,&hdg,&vr));
      assert(approx(spd,100.f)); assert(approx(hdg,0.f)); }

    // Subtype 3 → false
    { uint8_t me[] = {0x9B,0x00,0x65,0x00,0x20,0x00,0x00};
      assert(!velocity_decode(me,&spd,&hdg,&vr)); }

    // Zero EW → false
    { uint8_t me[] = {0x99,0x00,0x00,0x0C,0xA0,0x00,0x00};
      assert(!velocity_decode(me,&spd,&hdg,&vr)); }

    // Climbing 512 fpm
    { uint8_t me[] = {0x99,0x00,0x65,0x00,0x20,0x12,0x00};
      assert(velocity_decode(me,&spd,&hdg,&vr));
      assert(vr == 512); }

    // Descending 1024 fpm
    { uint8_t me[] = {0x99,0x00,0x65,0x00,0x24,0x22,0x00};
      assert(velocity_decode(me,&spd,&hdg,&vr));
      assert(vr == -1024); }

    printf("test_velocity: all tests passed\n");
    return 0;
}
