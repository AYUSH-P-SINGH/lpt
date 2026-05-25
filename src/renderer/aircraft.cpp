#include "aircraft.h"
#include "map.h"
#include "SDL2/SDL.h"
#include <cstdio>
#include <cmath>

void aircraft_draw(const Aircraft* ac)
{
     /* TODO */ 
     if(!ac->position_valid) return; //If the position of the aircraft is not valid, we cannot draw it on the screen, so we return early.

    int x, y;
    map_project(ac->lat, ac->lon, &x, &y);

    //Draw Filled Circle with radius 4 in #00ff88
    SDL_SetRenderDrawColor(g_renderer, 0, 0xFF, 0x88, 0xFF);
    for(int dy = -4; dy <= 4; dy++)
    {
        for(int dx = -4; dx <= 4; dx++) 
        {
            if(dx*dx + dy*dy <= 16)
            { // Check if the point is within the circle
                SDL_RenderDrawPoint(g_renderer, x + dx, y + dy);
            }
        }
    }

    //Callsign label - 6px to the right of the dot
    if(ac->callsign)
    {
        SDL_Surface* text_surface = TTF_RenderText_Solid(g_font, ac->callsign, (SDL_Color){0, 0, 0});
        if(text_surface)
        {
            SDL_Texture* text_texture = SDL_CreateTextureFromSurface(g_renderer, text_surface);
            if(text_texture)
            {
                SDL_Rect dstrect = {x + 6, y - text_surface->h / 2, text_surface->w, text_surface->h};
                SDL_RenderCopy(g_renderer, text_texture, NULL, &dstrect);
                SDL_DestroyTexture(text_texture);
            }
            SDL_FreeSurface(text_surface);
        }
    }

    // Altitude below the callsign label, dimmer color
    SDL_SetRenderDrawColor(g_renderer, 0x88, 0x88, 0x88, 0xFF);    
}

void aircraft_draw_vector(const Aircraft* ac) 
{
     /* TODO */ 
    if(!ac->position_valid || ac->groundspeed_kt <= 0) return; //If the position of the aircraft is not valid or the groundspeed is less than or equal to 0, we cannot draw the vector, so we return early.

    int x, y;
    map_project(ac->lat, ac->lon, &x, &y);

    float len = fminf(ac->groundspeed_kt, 60.0f); // Cap at 60 px 
    float rad = ac->heading_deg * M_PI / 180.0f; // Convert heading to radians
    int x2 = x + (int)(len * sinf(rad)); // Calculate end point of the vector
    int y2 = y - (int)(len * cosf(rad)); // Calculate end point of the vector

    SDL_SetRenderDrawColor(g_renderer, 0x00, 0xFF, 0x88, 0x99); // Set color for the vector
    SDL_RenderDrawLine(g_renderer, x, y, x2, y2); // Draw the vector line from the aircraft position to the calculated end point
    
}
