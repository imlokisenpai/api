// /api/now-playing.js
export default async function handler(req, res) {
  // Allow browser frontend to fetch
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Get access token using refresh token
    const token = await getSpotifyAccessToken();

    // Fetch currently playing track
    const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (r.status === 204 || r.status > 400) {
      return res.status(200).json({ playing: false });
    }

    const data = await r.json();

    // Return structured JSON
    res.status(200).json({
      playing: true,
      title: data.item.name,
      artist: data.item.artists.map(a => a.name).join(", "),
      albumArt: data.item.album.images[0].url,
      url: data.item.external_urls.spotify
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}

// Helper function to get Spotify access token from refresh token
async function getSpotifyAccessToken() {
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!refresh_token || !client_id || !client_secret) {
    throw new Error("Missing environment variables!");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);

  const auth = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const data = await r.json();

  if (!data.access_token) throw new Error("Failed to get access token: " + JSON.stringify(data));

  return data.access_token;
}
