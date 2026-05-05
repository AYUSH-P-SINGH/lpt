#include "cpr.h"

bool cpr_decode_global(uint32_t lat_even, uint32_t lon_even,
                       uint32_t lat_odd,  uint32_t lon_odd,
                       int last_odd, double* lat_out, double* lon_out)
{
    // TODO: implement global CPR decode
    return false;
}

bool cpr_decode_local(uint32_t lat_cpr, uint32_t lon_cpr, int odd,
                      double ref_lat, double ref_lon,
                      double* lat_out, double* lon_out)
{
    // TODO: implement local CPR decode
    return false;
}
