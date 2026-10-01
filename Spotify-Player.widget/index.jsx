const { useState, useEffect, useRef } = React;
import defaultImage from "./default.jpg";
const MARQUEE_GAP = 30;
const MARQUEE_SPEED = 40; // px/s
const MARQUEE_HOLD_MS = 3500; // pause at each end, in ms
const ANIMATION_MS = 220;

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${secondsStr}`;
};

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
      applyColorScheme("23,23,23", "255,255,255");
      return;
    }

    const palette = kMeans(samples, 6, 10);
    if (!palette.length) {
      applyColorScheme("23,23,23", "255,255,255");
      return;
    }

    const background = pickBackground(palette);
    let accent =
      pickAccent(palette, background) || getContrastColor(background);
    accent = ensureContrast(accent, background, 4.5);

    applyColorScheme(background.join(","), accent.join(","));
  } catch (error) {
    console.error("Error in getAverageRGB:", error);
    applyColorScheme("128,128,128", "255,255,255");
  }
}

const AnimatedTime = ({ value }) => {
  const rootRef = useRef(null);
  const previousValueRef = useRef(null);
  const timersRef = useRef(new Set());

  const str = Number.isNaN(Number(value))
    ? "0:00"
    : formatTime(value) || "0:00";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const previous = previousValueRef.current;
    previousValueRef.current = str;

    const hasSameStructure =
      previous !== null &&
      previous.length === str.length &&
      [...previous].every(
        (character, index) => /\d/.test(character) === /\d/.test(str[index]),
      );

    if (!hasSameStructure) {
      root.replaceChildren();

      for (const character of str) {
        if (!/\d/.test(character)) {
          const separator = document.createElement("span");
          separator.className = "d-separator";
          separator.textContent = character;
          root.appendChild(separator);
          continue;
        }

        const slot = document.createElement("span");
        slot.className = "d-slot";

        const digit = document.createElement("span");
        digit.className = "d-inner d-current d-idle";
        digit.textContent = character;

        slot.appendChild(digit);
        root.appendChild(slot);
      }

      return;
    }

    if (previous === str) return;

    for (let index = 0; index < str.length; index++) {
      const nextCharacter = str[index];

      if (!/\d/.test(nextCharacter)) continue;

      const slot = root.children[index];
      if (!slot?.classList.contains("d-slot")) continue;

      const current = slot.querySelector(".d-current");
      if (!current || current.textContent === nextCharacter) continue;

      // The old digit moves downward.
      current.classList.remove("d-current", "d-idle", "d-enter");
      current.classList.add("d-exit");

      // The new digit comes directly from above.
      // There is no reel, so 9 → 0 does not pass through 8…1.
      const next = document.createElement("span");
      next.className = "d-inner d-current d-enter";
      next.textContent = nextCharacter;
      slot.appendChild(next);

      const timer = window.setTimeout(() => {
        current.remove();

        // Avoid interfering if this digit changed again while animating.
        if (next.isConnected && next.classList.contains("d-current")) {
          next.className = "d-inner d-current d-idle";
        }

        timersRef.current.delete(timer);
      }, ANIMATION_MS);

      timersRef.current.add(timer);
    }
  }, [str]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current) {
        window.clearTimeout(timer);
      }

      timersRef.current.clear();
    };
  }, []);

  return <span ref={rootRef} className="d-time" aria-label={str} />;
};

const SpotifyPlayer = ({ run, output }) => {
  const [spotifyData, setSpotifyData] = useState({
    track_name: "Not Running",
    artist: "",
    album_art: "",
    is_playing: false,
    time_played: 0,
    total_time: 0,
  });
  const [perc, setPerc] = useState(0);
  const [seekHover, setSeekHover] = useState({
    visible: false,
    percent: 0,
    time: 0,
  });
  const [trackChanged, setTrackChanged] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const [marqueeScrolled, setMarqueeScrolled] = useState(false);
  const imageRef = useRef(null);
  const previousTrackRef = useRef(null);
  const prevCoverRef = useRef("");
  const trackNameRef = useRef(null);
  const trackTextRef = useRef(null);

  useEffect(() => {
    const processOutput = () => {
      if (output) {
        const parts = output.split("|");
        if (parts[0] === "Not Running") {
          setSpotifyData({
            track_name: "Not Running",
            artist: "",
            album_art: "",
            is_playing: false,
            time_played: 0,
            total_time: 0,
          });
        } else if (parts.length >= 6) {
          const [
            track_name,
            artist,
            album_art,
            is_playing_str,
            total_time,
            time_played,
          ] = parts;
          const is_playing = is_playing_str === "playing";

          const totalMs = parseInt(total_time, 10) || 0;
          const playedSecondsRaw = String(time_played).replace(",", ".");
          const playedSeconds = parseFloat(playedSecondsRaw) || 0;
          const playedMs = Math.round(playedSeconds * 1000);

          const parsedData = {
            track_name,
            artist,
            album_art,
            is_playing,
            total_time: totalMs,
            time_played: playedMs,
          };
          const smallArt = getSmallAlbumArt(parsedData.album_art);
          if (
            previousTrackRef.current &&
            previousTrackRef.current !== parsedData.track_name
          ) {
            setTrackChanged(true);
            setTimeout(() => setTrackChanged(false), 500);
          }
          if (prevCoverRef.current !== smallArt) {
            setIsImageLoading(true);
            prevCoverRef.current = smallArt;
            preloadImage(smallArt).then(() => {
              setSpotifyData({
                ...parsedData,
                album_art: smallArt,
              });
              setIsImageLoading(false);
            });
          } else {
            setSpotifyData({
              ...parsedData,
              album_art: smallArt,
            });
          }
          previousTrackRef.current = parsedData.track_name;
          if (
            typeof parsedData.time_played === "number" &&
            typeof parsedData.total_time === "number" &&
            parsedData.total_time > 0
          ) {
            setPerc(
              Math.floor(
                (parsedData.time_played / parsedData.total_time) * 100000,
              ),
            );
          } else {
            setPerc(0);
          }
        }
      }
    };

    processOutput();
  }, [output]);

  useEffect(() => {
    const container = trackNameRef.current;
    const textEl = trackTextRef.current?.children?.[0];
    if (!container || !textEl) return;

    setMarqueeScrolled(false);

    const id = requestAnimationFrame(() => {
      const containerWidth = container.clientWidth;
      const textWidth = textEl.getBoundingClientRect().width;
      setMarqueeDistance(
        textWidth > containerWidth ? textWidth + MARQUEE_GAP : 0,
      );
    });
    return () => cancelAnimationFrame(id);
  }, [spotifyData.track_name]);

  useEffect(() => {
    if (marqueeDistance <= 0) return;

    let cancelled = false;
    const timeouts = [];
    const schedule = (fn, ms) => {
      const t = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(t);
      return t;
    };

    const scrollMs = (marqueeDistance / MARQUEE_SPEED) * 1000;

    const runCycle = () => {
      if (cancelled) return;
      setMarqueeScrolled(false); // instant snap back to start, no transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          schedule(() => {
            setMarqueeScrolled(true); // begin the timed slide
            schedule(runCycle, scrollMs + MARQUEE_HOLD_MS);
          }, MARQUEE_HOLD_MS);
        });
      });
    };

    runCycle();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [marqueeDistance, spotifyData.track_name]);

  const handleImageLoad = (e) => {
    setIsImageLoading(false);
    getAverageRGB(e);
  };

  const handleSeek = async (event) => {
    if (!spotifyData.total_time || spotifyData.total_time <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );
    const targetSeconds = Math.round((ratio * spotifyData.total_time) / 1000);
    setSpotifyData((prev) => ({
      ...prev,
      time_played: targetSeconds * 1000,
    }));
    try {
      await run(
        `osascript -e 'tell application "Spotify" to set player position to ${targetSeconds}'`,
      );
    } catch (e) {}
    setTimeout(() => {
      setSeekHover((prev) => ({ ...prev, visible: false }));
    }, 1000);
  };

  const updateSeekHover = (event) => {
    if (!spotifyData.total_time || spotifyData.total_time <= 0) {
      setSeekHover((prev) => ({ ...prev, visible: false }));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );
    setSeekHover({
      visible: true,
      percent: ratio * 100,
      time: Math.round((ratio * spotifyData.total_time) / 1000),
    });
  };

  useEffect(() => {
    if (spotifyData.track_name === "Not Running") {
      document.documentElement.style.setProperty("--color", "255,255,255");
      document.documentElement.style.setProperty("--background", "23,23,23");
    }
  }, [spotifyData.track_name]);

  const playPause = async () => {
    try {
      await run(
        `osascript -e 'tell application "Spotify" to ${spotifyData.is_playing ? "pause" : "play"}'`,
      );
    } catch (e) {}
  };

  const nextTrack = async () => {
    try {
      await run(`osascript -e 'tell application "Spotify" to next track'`);
    } catch (e) {}
  };

  const prevTrack = async () => {
    try {
      await run(`osascript -e 'tell application "Spotify" to previous track'`);
    } catch (e) {}
  };

  return (
    <div
      className="spotify-mini-player"
      style={{
        position: "relative",
        fontFamily: "sans-serif",
        borderRadius: 18,
        height: height,
        width: width,
        display: "flex",
        alignItems: "center",
        color: `rgb(var(--color,255,255,255))`,
        backgroundColor: `rgb(var(--background,23,23,23))`,
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        userSelect: "none",
      }}
    >
      <div
        style={{
          height: 70,
          width: 70,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          key={spotifyData.album_art}
          ref={imageRef}
          style={{
            width: "auto",
            height: 70,
            transition: "filter 0.5s, opacity 0.5s",
            filter: trackChanged || isImageLoading ? "blur(10px)" : "none",
            opacity: trackChanged || isImageLoading ? 0.7 : 1,
          }}
          src={spotifyData.album_art || defaultImage}
          alt="Album Art"
          crossOrigin="anonymous"
          loading="eager"
          onLoad={handleImageLoad}
          onError={() => {}}
        />
        <div
          style={{
            position: "absolute",
            background:
              "linear-gradient(90deg, transparent, rgb(var(--background,23,23,23)))",
            zIndex: 10,
            top: 0,
            left: 0,
            height: "100%",
            width: "100%",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: 7,
          flex: 1,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            whiteSpace: "nowrap",
            paddingLeft: 10,
            paddingRight: 10,
            boxSizing: "border-box",
          }}
        >
          <div
            ref={trackNameRef}
            style={{
              overflow: "hidden",
              width: 80,
              whiteSpace: "nowrap",
              animation: trackChanged ? "fadeIn 0.5s ease-in-out" : "none",
            }}
          >
            <div
              ref={trackTextRef}
              style={{
                display: "flex",
                width: "max-content",
                gap: `${MARQUEE_GAP}px`,
                willChange: marqueeDistance > 0 ? "transform" : "auto",
                ...(marqueeDistance > 0
                  ? {
                      transform: marqueeScrolled
                        ? `translateX(-${marqueeDistance}px)`
                        : "translateX(0)",
                      transition: marqueeScrolled
                        ? `transform ${marqueeDistance / MARQUEE_SPEED}s linear`
                        : "none",
                    }
                  : { transform: "translateX(0)" }),
              }}
            >
              <span>{spotifyData.track_name || "Not Running"}</span>
              {marqueeDistance > 0 && <span>{spotifyData.track_name}</span>}
            </div>
          </div>
          <div
            style={{
              width: "40%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              style={{
                fill: "currentColor",
                transition: "transform 0.4s",
                cursor: "pointer",
                height: 15,
                width: 15,
              }}
              onClick={prevTrack}
            >
              <path
                style={{
                  cursor: "pointer",
                }}
                d="M459.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4L288 214.3l0 41.7 0 41.7L459.5 440.6zM256 352l0-96 0-128 0-32c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160C4.2 237.5 0 246.5 0 256s4.2 18.5 11.5 24.6l192 160c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-64z"
              />
            </svg>
            {!spotifyData.is_playing ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                style={{
                  fill: "currentColor",
                  transition: "transform 0.4s",
                  cursor: "pointer",
                  height: 17,
                  width: 17,
                }}
                onClick={playPause}
              >
                <path
                  style={{
                    cursor: "pointer",
                  }}
                  d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                style={{
                  fill: "currentColor",
                  transition: "transform 0.4s",
                  cursor: "pointer",
                  height: 17,
                  width: 17,
                  marginBottom: 1,
                }}
                onClick={playPause}
              >
                <path
                  style={{
                    cursor: "pointer",
                  }}
                  d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"
                />
              </svg>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              style={{
                fill: "currentColor",
                transition: "transform 0.4s",
                cursor: "pointer",
                height: 15,
                width: 15,
              }}
              onClick={nextTrack}
            >
              <path
                style={{
                  cursor: "pointer",
                }}
                d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416L0 96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4L224 214.3l0 41.7 0 41.7L52.5 440.6zM256 352l0-96 0-128 0-32c0-12.4 7.2-23.7 18.4-29s24.5-3.6 34.1 4.4l192 160c7.3 6.1 11.5 15.1 11.5 24.6s-4.2 18.5-11.5 24.6l-192 160c-9.5 7.9-22.8 9.7-34.1 4.4s-18.4-16.6-18.4-29l0-64z"
              />
            </svg>
          </div>
        </div>
        <div
          style={{
            width: 170,
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          <div
            style={{
              position: "relative",
              height: 7,
              width: "100%",
              borderRadius: 10,
              cursor: "none",
              backgroundColor: `rgba(var(--color,255,255,255), 0.3)`,
            }}
            onClick={handleSeek}
            onMouseEnter={updateSeekHover}
            onMouseMove={updateSeekHover}
            onMouseLeave={() =>
              setSeekHover((prev) => ({ ...prev, visible: false }))
            }
          >
            <div
              style={{
                position: "absolute",
                top: -6,
                left: `${seekHover.percent}%`,
                transform: "translateX(-50%)",
                padding: "2px 6px",
                borderRadius: 9999,
                backdropFilter: "blur(10px)",
                fontSize: 10,
                fontWeight: "bold",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                opacity: seekHover.visible ? 1 : 0,
                transition: "opacity 0.15s, transform 0.15s",
                zIndex: 99,
                color: `rgb(var(--background,23,23,23))`,
                backgroundColor: `rgb(var(--color,255,255,255))`,
              }}
            >
              {formatTime(seekHover.time)}
            </div>
            <div
              style={{
                overflow: "hidden",
                position: "relative",
                height: 7,
                width: "100%",
                borderRadius: 10,
                cursor: "none",
              }}
            >
              <div
                style={{
                  height: 7,
                  borderRadius: 10,
                  backgroundColor: `rgb(var(--color,255,255,255))`,
                  width: perc ? `${perc / 1000}%` : 0,
                  opacity: perc ? 1 : 0.3,
                  transition:
                    "width 0.3s ease-in-out, background 0.5s ease-in-out",
                }}
              />
            </div>
          </div>
          <span
            style={{
              whiteSpace: "nowrap",
            }}
          >
            <AnimatedTime value={spotifyData.time_played / 1000} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
export const className = `
 .spotify-mini-player * {
   font-family: var(--font-sans) /* ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
   "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" */ !important;
   font-weight: 600;
   user-select: none !important;
   -webkit-user-select: none !important;
   -webkit-touch-callout: none !important;
 }

.d-time {
  display: inline-flex;
  align-items: baseline;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.d-slot {
  position: relative;
  display: inline-block;
  width: 0.6em;
  height: 1.1em;
  overflow: hidden;
  vertical-align: middle;
  transform: translateY(3px) !important;
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 18%,
    black 82%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 18%,
    black 82%,
    transparent 100%
  );
}

.d-separator {
  display: inline-block;
  height: 1.1em;
  line-height: 1.1em;
  text-align: center;
  vertical-align: middle;
}

.d-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  will-change: transform, filter, opacity;
}

.d-idle {
  transform: translateY(0);
  filter: blur(0);
  opacity: 1;
}

.d-exit {
  animation: digit-exit 220ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

.d-enter {
  animation: digit-enter 220ms cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes digit-exit {
  from {
    transform: translateY(0);
    filter: blur(0);
    opacity: 1;
  }

  to {
    transform: translateY(55%);
    filter: blur(0.08em);
    opacity: 0;
  }
}

@keyframes digit-enter {
  from {
    transform: translateY(-55%);
    filter: blur(0.08em);
    opacity: 0;
  }
  to{
    transform: translateY(0);
    filter: blur(0);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .d-enter,
  .d-exit {
    animation-duration: 1ms;
    filter: none;
  }
}

@keyframes marquee-scroll {
  0%, 8% {
    transform: translateX(0);
  }
  92%, 100% {
    transform: translateX(calc(-1 * var(--marquee-distance)));
  }
}
`;

export const command = `spotify="Not Running"
if pgrep -x "Spotify" > /dev/null
then
spotify=$(osascript -e '
  tell application "Spotify"
    if player state is playing or player state is paused then
      set trackName to name of current track
      set artistName to artist of current track
      set albumUrl to artwork url of current track
      set playerState to player state as string
      set trackDuration to duration of current track
      set trackPosition to player position
      return trackName & "|" & artistName & "|" & albumUrl & "|" & playerState & "|" & trackDuration & "|" & trackPosition
    else
      return "No track playing"
    end if
  end tell
')
fi

# Output the track info
echo "$spotify"`;
export const width = 250;
export const height = 70;
export const x = 1220;
export const y = 886;
export const refreshFrequency = 500;
