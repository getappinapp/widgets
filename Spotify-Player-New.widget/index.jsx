const { useState, useEffect, useRef } = React;
import defaultImage from "./default.jpg";

const getSmallAlbumArt = (url) => {
  if (!url) return url;
  return url.replace("ab67616d0000b273", "ab67616d00004851");
};

const preloadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  });
};

function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relLuminance([r, g, b]) {
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function contrastRatio(a, b) {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return [h * 60, s, l];
}

function getContrastColor(rgb) {
  return relLuminance(rgb) > 0.5 ? [0, 0, 0] : [255, 255, 255];
}

function ensureContrast(fg, bg, target = 4.5) {
  if (contrastRatio(fg, bg) >= target) return fg;
  const bgLight = relLuminance(bg) > 0.5;
  const dir = bgLight ? -1 : 1;
  for (let step = 1; step <= 20; step++) {
    const amt = step * 14 * dir;
    const cand = fg.map((c) => Math.min(255, Math.max(0, c + amt)));
    if (contrastRatio(cand, bg) >= target) return cand;
  }
  return bgLight ? [0, 0, 0] : [255, 255, 255];
}

function colorDist2(a, b) {
  return 2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function kMeansPlusPlusInit(samples, k) {
  const centroids = [
    samples[Math.floor(Math.random() * samples.length)].slice(),
  ];
  while (centroids.length < k) {
    const distances = samples.map((s) =>
      Math.min(...centroids.map((c) => colorDist2(s, c))),
    );
    const sum = distances.reduce((a, b) => a + b, 0);
    if (sum === 0) {
      centroids.push(
        samples[Math.floor(Math.random() * samples.length)].slice(),
      );
      continue;
    }
    let r = Math.random() * sum;
    let idx = 0;
    for (; idx < distances.length; idx++) {
      r -= distances[idx];
      if (r <= 0) break;
    }
    centroids.push(samples[Math.min(idx, samples.length - 1)].slice());
  }
  return centroids;
}

function kMeans(samples, k = 6, iters = 10) {
  if (!samples.length) return [];
  k = Math.min(k, samples.length);
  let centroids = kMeansPlusPlusInit(samples, k);
  let assign = new Array(samples.length).fill(0);

  for (let it = 0; it < iters; it++) {
    let changed = false;
    for (let i = 0; i < samples.length; i++) {
      let bestK = 0,
        bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = colorDist2(samples[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          bestK = c;
        }
      }
      if (assign[i] !== bestK) changed = true;
      assign[i] = bestK;
    }
    if (!changed && it > 0) break;

    const sums = centroids.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < samples.length; i++) {
      const s = sums[assign[i]];
      s[0] += samples[i][0];
      s[1] += samples[i][1];
      s[2] += samples[i][2];
      s[3]++;
    }
    centroids = centroids.map((c, i) =>
      sums[i][3] > 0
        ? [
            Math.round(sums[i][0] / sums[i][3]),
            Math.round(sums[i][1] / sums[i][3]),
            Math.round(sums[i][2] / sums[i][3]),
          ]
        : c,
    );
  }

  const weights = centroids.map(() => 0);
  for (let i = 0; i < samples.length; i++) weights[assign[i]]++;

  return centroids
    .map((rgb, i) => ({ rgb, weight: weights[i] / samples.length }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

function samplePixels(ctx, size) {
  const { data: pixels } = ctx.getImageData(0, 0, size, size);
  const samples = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i],
      g = pixels[i + 1],
      b = pixels[i + 2],
      a = pixels[i + 3];
    if (a < 200) continue;
    if (r < 12 && g < 12 && b < 12) continue;
    if (r > 248 && g > 248 && b > 248) continue;
    samples.push([r, g, b]);
  }
  return samples;
}

function pickBackground(palette) {
  const candidates = palette.filter(({ rgb, weight }) => {
    const [, , l] = rgbToHsl(rgb);
    return weight > 0.04 && l > 0.06 && l < 0.94;
  });
  return (candidates[0] || palette[0]).rgb;
}

function pickAccent(palette, background) {
  let best = null;
  let bestScore = -Infinity;
  for (const { rgb, weight } of palette) {
    if (rgb === background) continue;
    const cr = contrastRatio(rgb, background);
    if (cr < 1.5) continue;
    const [, s] = rgbToHsl(rgb);
    const score = cr * 1.5 + s * 4 + weight * 2;
    if (score > bestScore) {
      bestScore = score;
      best = rgb;
    }
  }
  return best;
}

function applyColorScheme(background, color) {
  if (!background) return;
  document.documentElement.style.setProperty("--color", color);
  document.documentElement.style.setProperty("--background", background);
}

export function getAverageRGB(e) {
  try {
    const img = e.target;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const size = 100;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);

    const samples = samplePixels(ctx, size);
    if (!samples.length) {
      applyColorScheme("17,17,17", "250,250,250");
      return;
    }

    const palette = kMeans(samples, 6, 10);
    if (!palette.length) {
      applyColorScheme("17,17,17", "250,250,250");
      return;
    }

    const background = pickBackground(palette);
    let accent =
      pickAccent(palette, background) || getContrastColor(background);
    accent = ensureContrast(accent, background, 4.5);

    applyColorScheme(background.join(","), accent.join(","));
  } catch (error) {
    console.error("Error in getAverageRGB:", error);
    applyColorScheme("17,17,17", "250,250,250");
  }
}

const SpotifyLogo = ({ size = 34 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 30 30"
      style={{ fill: "rgb(var(--color,255,255,255))" }}
    >
      <path d="M15,3C8.4,3,3,8.4,3,15s5.4,12,12,12s12-5.4,12-12S21.6,3,15,3z M19.731,21c-0.22,0-0.33-0.11-0.55-0.22 c-1.65-0.991-3.74-1.54-5.94-1.54c-1.21,0-2.53,0.22-3.63,0.44c-0.22,0-0.44,0.11-0.55,0.11c-0.44,0-0.77-0.33-0.77-0.77 s0.22-0.77,0.66-0.77c1.43-0.33,2.861-0.55,4.401-0.55c2.53,0,4.84,0.66,6.82,1.76c0.22,0.22,0.44,0.33,0.44,0.77 C20.39,20.78,20.06,21,19.731,21z M20.94,17.921c-0.22,0-0.44-0.11-0.66-0.22c-1.87-1.21-4.511-1.87-7.37-1.87 c-1.43,0-2.751,0.22-3.74,0.44c-0.22,0.11-0.33,0.11-0.55,0.11c-0.55,0-0.881-0.44-0.881-0.881c0-0.55,0.22-0.77,0.77-0.991 c1.32-0.33,2.641-0.66,4.511-0.66c3.08,0,5.94,0.77,8.361,2.2c0.33,0.22,0.55,0.55,0.55,0.881 C21.82,17.48,21.491,17.921,20.94,17.921z M22.37,14.4c-0.22,0-0.33-0.11-0.66-0.22c-2.2-1.21-5.39-1.98-8.47-1.98 c-1.54,0-3.19,0.22-4.621,0.55c-0.22,0-0.33,0.11-0.66,0.11c-0.66,0.111-1.1-0.44-1.1-1.099s0.33-0.991,0.77-1.1 C9.39,10.22,11.26,10,13.24,10c3.41,0,6.93,0.77,9.681,2.2c0.33,0.22,0.66,0.55,0.66,1.1C23.471,13.96,23.03,14.4,22.37,14.4z" />
    </svg>
  </div>
);

const SpotifyPlayer = ({ run, output }) => {
  const [spotifyData, setSpotifyData] = useState({
    track_name: "Not Running",
    artist: "Not Avaible",
    album_art: "",
  });
  const [isImageLoading, setIsImageLoading] = useState(false);
  const imageRef = useRef(null);
  const prevCoverRef = useRef("");

  useEffect(() => {
    if (!output) return;
    const parts = output.split("|");

    if (parts[0] === "Not Running" || parts.length < 3) {
      setSpotifyData({
        track_name: "Not Running",
        artist: "",
        album_art: "",
      });
      return;
    }

    const [track_name, artist, album_art] = parts;
    const smallArt = getSmallAlbumArt(album_art);

    if (prevCoverRef.current !== smallArt) {
      setIsImageLoading(true);
      prevCoverRef.current = smallArt;
      preloadImage(smallArt).then(() => {
        setSpotifyData({ track_name, artist, album_art: smallArt });
        setIsImageLoading(false);
      });
    } else {
      setSpotifyData({ track_name, artist, album_art: smallArt });
    }
  }, [output]);

  useEffect(() => {
    if (spotifyData.track_name === "Not Running") {
      document.documentElement.style.setProperty("--color", "250,250,250");
      document.documentElement.style.setProperty("--background", "17,17,17");
    }
  }, [spotifyData.track_name]);

  const handleImageLoad = (e) => {
    setIsImageLoading(false);
    getAverageRGB(e);
  };

  return (
    <div
      style={{
        position: "relative",
        fontFamily: "sans-serif",
        borderRadius: 26,
        height: "230px",
        width: "250px",
        boxSizing: "border-box",
        padding: 22,
        display: "flex",
        flexDirection: "column",
        color: `rgb(var(--color,250,250,250))`,
        backgroundColor: `rgb(var(--background,17,17,17))`,
        overflow: "hidden",
        userSelect: "none",
      }}
      className="spotify-music-player"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "48%",
            aspectRatio: "1",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 8px 18px #0000002c",
            backgroundColor: "#00000033",
            isolation: "isolate",
          }}
        >
          <img
            key={spotifyData.album_art}
            ref={imageRef}
            src={spotifyData.album_art || defaultImage}
            alt="Album Art"
            crossOrigin="anonymous"
            loading="eager"
            onLoad={handleImageLoad}
            onError={() => {}}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 10,
              objectFit: "cover",
              display: "block",
              transition: "filter 0.5s, opacity 0.5s",
              filter: isImageLoading ? "blur(10px)" : "none",
              opacity: isImageLoading ? 0.7 : 1,
            }}
          />
        </div>
        <SpotifyLogo size={36} />
      </div>

      <div style={{ flex: 1, minHeight: 14 }} />

      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginBottom: 8,
          width: "90%",
        }}
      >
        {spotifyData.track_name}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            opacity: 0.55,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            marginRight: 10,
          }}
        >
          {spotifyData.artist || "Not Avaible"}
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;

export const className = `
 .spotify-music-player * {
   font-family: Arial Rounded MT Bold;
   font-weight: 800;
   user-select: none !important;
   -webkit-user-select: none !important;
   -webkit-touch-callout: none !important;
 }
`;

export const width = 250;
export const height = 230;
export const command = `
#!/bin/bash

spotify="Not Running"

if pgrep -x "Spotify" > /dev/null
then
  spotify=$(osascript -e '
    tell application "Spotify"
      if player state is playing or player state is paused then
        set trackName to name of current track
        set artistName to artist of current track
        set albumUrl to artwork url of current track
        return trackName & "|" & artistName & "|" & albumUrl
      else
        return "Not Running"
      end if
    end tell
  ')
fi

echo "$spotify"`;
export const refreshFrequency = 1000;
