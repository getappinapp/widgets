import { useState, useEffect, useRef } from "appinapp-react";
import arabic from "./arabic.ttf";

const pad = (n) => String(n).padStart(2, "0");
const format = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const BLUR_PX = 14;
const OFFSET_X = 0;
const OFFSET_Y = 0;
const PAD = 40;

const FONT_SIZE = 135;
const FONT_WEIGHT = 400;
const LETTER_SPACING = ".01em";

const WALLPAPER_CMD = `P=$(osascript -e 'tell application "System Events" to get picture of desktop 1'); sips -Z 1600 -s format jpeg "$P" --out /tmp/appinapp-wall.jpg >/dev/null 2>&1 && base64 -i /tmp/appinapp-wall.jpg | tr -d '\\n'`;

const styles = {
  grid: {
    display: "grid",
    fontFamily: "Arabic, sans-serif",
    fontSize: FONT_SIZE,
    fontWeight: FONT_WEIGHT,
    letterSpacing: LETTER_SPACING,
    lineHeight: 1,
    marginTop: 16,
    position: "relative",
  },
  layer: {
    gridArea: "1 / 1",
    whiteSpace: "nowrap",
    padding: PAD,
    margin: -PAD,
  },
  glass: {
    position: "absolute",
    top: -PAD,
    left: -PAD,
    right: -PAD,
    bottom: -PAD,
    overflow: "hidden",
    maskPosition: "0 0",
    WebkitMaskPosition: "0 0",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  },
  fill: {
    color: "#ffffff30",
    filter:
      "drop-shadow(0 2px 5px #00000040) drop-shadow(0 10px 26px #00000052)",
  },
  edge: {
    color: "#ffffff",
    opacity: 0.5,
    filter: "url(#arabic-glass-edges)",
  },
  probe: { display: "inline-block", width: 0, height: 0 },
};

const ArabicClock = ({ run }) => {
  const [now, setNow] = useState(() => new Date());
  const [mask, setMask] = useState({ url: "none", w: 0, h: 0 });
  const [wall, setWall] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const gridRef = useRef(null);
  const probeRef = useRef(null);
  const glassRef = useRef(null);

  const time = format(now);
  const date = now.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!run) return;
    let dead = false;
    run(WALLPAPER_CMD)
      .then((b64) => {
        const clean = (b64 || "").trim();
        if (!dead && clean.length > 100)
          setWall(`data:image/jpeg;base64,${clean}`);
      })
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const el = glassRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.round((window.screenX || 0) + r.left);
      const y = Math.round((window.screenY || 0) + r.top);
      setPos((p) => (p.x === x && p.y === y ? p : { x, y }));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    let cancelled = false;

    const draw = async () => {
      try {
        await document.fonts.load(`${FONT_WEIGHT} 100px "Arabic"`);
      } catch (e) {}
      if (cancelled || !gridRef.current || !probeRef.current) return;

      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;

      const pr = probeRef.current.getBoundingClientRect();
      const baseline = pr.bottom - r.top;
      const domWidth = pr.left - r.left;
      const dpr = window.devicePixelRatio || 1;

      const c = document.createElement("canvas");
      const cw = r.width + PAD * 2;
      const ch = r.height + PAD * 2;
      c.width = Math.ceil(cw * dpr);
      c.height = Math.ceil(ch * dpr);
      const ctx = c.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.font = `${FONT_WEIGHT} ${parseFloat(
        getComputedStyle(el).fontSize,
      )}px "Arabic"`;
      ctx.fillStyle = "#000";
      ctx.translate(PAD, PAD);
      const canvasWidth = ctx.measureText(time).width;
      if (canvasWidth) ctx.scale(domWidth / canvasWidth, 1);
      ctx.fillText(time, 0, baseline);

      setMask({ url: `url(${c.toDataURL()})`, w: cw, h: ch });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [time]);

  const sw = window.screen.width;
  const sh = window.screen.height;

  return (
    <div id="arabicClock" style={{ height: 150, width: 380 }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter
          id="arabic-glass-edges"
          x="-20%"
          y="-50%"
          width="140%"
          height="200%"
        >
          <feOffset in="SourceAlpha" dy="3" result="down" />
          <feComposite
            in="SourceGraphic"
            in2="down"
            operator="out"
            result="top"
          />
          <feOffset in="SourceAlpha" dy="-3" result="up" />
          <feComposite
            in="SourceGraphic"
            in2="up"
            operator="out"
            result="bottom"
          />
          <feMerge>
            <feMergeNode in="top" />
            <feMergeNode in="bottom" />
          </feMerge>
        </filter>
      </svg>

      <div className="date">{date}</div>

      <div ref={gridRef} style={styles.grid}>
        <span
          ref={glassRef}
          style={{
            ...styles.glass,
            maskImage: mask.url,
            WebkitMaskImage: mask.url,
            maskSize: `${mask.w}px ${mask.h}px`,
            WebkitMaskSize: `${mask.w}px ${mask.h}px`,
            ...(wall
              ? {}
              : {
                  backdropFilter: `blur(${BLUR_PX}px) saturate(1.2)`,
                  WebkitBackdropFilter: `blur(${BLUR_PX}px) saturate(1.2)`,
                }),
          }}
        >
          {wall && (
            <div
              style={{
                position: "absolute",
                left: -pos.x + OFFSET_X,
                top: -pos.y + OFFSET_Y,
                width: sw,
                height: sh,
                backgroundImage: `url(${wall})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: `blur(${BLUR_PX}px) saturate(1.2)`,
              }}
            />
          )}
        </span>

        <span style={{ ...styles.layer, ...styles.fill }}>
          {time}
          <i ref={probeRef} style={styles.probe} />
        </span>

        <span style={{ ...styles.layer, ...styles.edge }}>{time}</span>
      </div>
    </div>
  );
};

export default ArabicClock;

export const className = `
@font-face {
  font-family: "Arabic";
  src: url(${arabic});
}
#arabicClock {
  display: flex;
  flex-direction: column;
  align-items: center;
  -webkit-user-select: none;
}
#arabicClock .date {
  font-size: 16px;
  font-weight: 300;
  color: #ffffff80;
}
`;
