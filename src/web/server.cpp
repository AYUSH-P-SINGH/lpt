GET	/	Serve web/index.html
GET	/<file>	Serve any file from web_dir
GET	/events	SSE stream — push aircraft JSON ~1/sec
POST	/select/:icao	Mark an aircraft as selected

{
  "receiver": { "lat": 37.62, "lon": -122.38, "label": "HOME" },
  "stats": { "msgsTotal": 0, "msgsLastSec": 0, "uptimeSec": 0 },
  "planes": [
    {
      "icao": "A1B2C3", "cs": "UAL245",
      "lat": 37.10, "lon": -122.85,
      "alt": 28400, "spd": 412, "hdg": 75, "vs": 1800,
      "msgsRx": 45,
      "firstSeenMs": 1716700000000,
      "lastSeenMs":  1716700060000,
      "trail": [{"lat": 37.09, "lon": -122.84}]
    }
  ]
}