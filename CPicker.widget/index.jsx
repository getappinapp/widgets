import { useState, useRef, useEffect, useCallback } from "react";

// Guard the global so a late/missing Lucide doesn't crash at import time.
const Pipette =
  (typeof window !== "undefined" && window.Lucide && window.Lucide.Pipette) ||
  (({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
    </svg>
  ));

const hexToHsl = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
};

const BTN_SIZE = 28;
const POPOVER_W = 100;
const POPOVER_H = 24;
const POPOVER_GAP = 2;
const OPEN_HEIGHT = BTN_SIZE + POPOVER_GAP + POPOVER_H; // 54

// Clipboard write with a fallback for webviews where the async API is blocked.
const writeClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
};

const CPicker = ({ setHeight, setWidth }) => {
  const [hex, setHex] = useState(null);
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const timer = useRef(null);
  const pickingRef = useRef(false); // synchronous guard against double-clicks
  const openRef = useRef(false);
  const rootRef = useRef(null);

  // setHeight/setWidth are async. Queue resizes so they run one at a time, in
  // order, and a slow "open" resize can never land after a later "close" one.
  const resizeQueue = useRef(Promise.resolve());
  const resize = useCallback(
    (w, h) => {
      resizeQueue.current = resizeQueue.current.then(async () => {
        try {
          await setHeight(h);
          await setWidth(w);
        } catch (err) {
          console.error("CPicker resize failed:", err);
        }
      });
      return resizeQueue.current;
    },
    [setHeight, setWidth]
  );

  const closePopover = useCallback(async () => {
    clearTimeout(timer.current);
    openRef.current = false;
    // Hide the content first, then shrink the window around the button.
    setOpen(false);
    setCopied(false);
    setCopyFailed(false);
    await resize(BTN_SIZE, BTN_SIZE);
  }, [resize]);

  const showPopover = useCallback(
    async (color) => {
      clearTimeout(timer.current); // don't let a pending close kill the new pick
      setHex(color);
      setCopied(false);
      setCopyFailed(false);
      // Only resize on the closed -> open transition (onChange can fire repeatedly).
      if (!openRef.current) {
        openRef.current = true;
        // Grow the window first so the popover isn't clipped when it appears.
        await resize(POPOVER_W, OPEN_HEIGHT);
        // If it was closed while the resize was in flight, stay closed.
        if (openRef.current) setOpen(true);
      }
    },
    [resize]
  );

  // Clear the timer on unmount.
  useEffect(() => () => clearTimeout(timer.current), []);

  // Dismiss on Escape or click outside while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closePopover();
    };
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) closePopover();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, closePopover]);

  // Chromium only: native one-click eyedropper
  const onInputClick = async (e) => {
    if (!window.EyeDropper) return; // let WKWebView open the color panel
    e.preventDefault();
    if (pickingRef.current) return;
    try {
      pickingRef.current = true;
      setPicking(true);
      const result = await new window.EyeDropper().open();
      await showPopover(result.sRGBHex.toLowerCase());
    } catch (err) {
      // cancelled
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  };

  const copy = async () => {
    if (!hex || copied) return;
    const ok = await writeClipboard(hex);
    clearTimeout(timer.current);
    if (ok) {
      setCopied(true);
      timer.current = setTimeout(closePopover, 600);
    } else {
      setCopyFailed(true);
      timer.current = setTimeout(() => setCopyFailed(false), 1200);
    }
  };

  // whitish tint for the icon, blackish shade for the background
  let iconColor = "white";
  let bgColor = "black";
  let borderColor = "#ffffff20";
  if (hex) {
    const { h, s } = hexToHsl(hex);
    iconColor = `hsl(${h}, ${Math.min(s, 80)}%, 92%)`;
    bgColor = `hsl(${h}, ${Math.min(s, 60)}%, 10%)`;
    borderColor = `hsl(${h}, ${Math.min(s, 60)}%, 25%)`;
  }

  return (
    <div
      ref={rootRef}
      style={{ width: "fit-content", background: "transparent" }}
    >
      <div
        id="btn"
        style={{
          position: "relative",
          width: BTN_SIZE,
          height: BTN_SIZE,
          boxSizing: "border-box",
          background: bgColor,
          color: picking ? "#007aff" : iconColor,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${borderColor}`,
          overflow: "hidden",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        <Pipette size={16} />
        <input
          type="color"
          value={hex || "#007aff"}
          onClick={onInputClick}
          onChange={(e) => showPopover(e.target.value.toLowerCase())}
          aria-label="Pick a color"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            border: 0,
            padding: 0,
          }}
        />
      </div>

      {open && hex && (
        <div
          id="popover"
          onClick={copy}
          title="Click to copy"
          style={{
            marginTop: POPOVER_GAP,
            width: POPOVER_W,
            height: POPOVER_H,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 8px",
            background: bgColor,
            color: "white",
            borderRadius: 6,
            border: `1px solid ${borderColor}`,
            fontFamily: "monospace",
            fontSize: 11,
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              flex: "none",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: hex,
              border: "1px solid #ffffff40",
            }}
          />
          {copied ? "copied ✓" : copyFailed ? "copy failed" : hex}
        </div>
      )}
    </div>
  );
};

export default CPicker;