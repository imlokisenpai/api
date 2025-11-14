import fetch from "node-fetch";

export default async function handler(req, res) {
  const token = await getSpotifyAccessToken();

  const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (r.status === 204 || r.status > 400) {
    return res.status(200).json({ playing: false });
  }

  const data = await r.json();

  res.status(200).json({
    playing: true,
    title: data.item.name,
    artist: data.item.artists.map(a => a.name).join(", "),
    albumArt: data.item.album.images[0].url,
    url: data.item.external_urls.spotify
  });
}

async function getSpotifyAccessToken() {
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);

  const auth = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
  ).toString("base64");

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const data = await r.json();
  return data.access_token;
}
