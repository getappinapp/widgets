import { useState, useEffect, useRef } from "appinapp-react";

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const pad = (n) => String(n).padStart(2, "0");

const COLLAPSED = { w: 70, h: 29 };
const EXPANDED = { w: 240, h: 122 };
const CLOSE_DELAY = 450;

const ITEM_W = 27;
const VISIBLE = 7;
const RANGE = 60; // days available on each side of today

const MONTH_W = 80; // distance between month labels (smaller = closer)
const MONTH_BLEND = 1; // days of scroll over which the target slides, ending on the 1st
const MONTH_TAU = 110; // ms, easing time constant (bigger = softer/slower glide)
const MONTH_FADE = 0.65; // opacity lost per month of distance (bigger = darker sides)

const smoothstep = (x) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

const MenuClock = ({ setHeight, setWidth }) => {
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const pillRef = useRef(null);
  const closeRef = useRef(() => {});
  const scrollRef = useRef(null);
  const dayRefs = useRef([]);
  const monthTrackRef = useRef(null);
  const monthRefs = useRef([]);
  const monthStarts = useRef([]);
  const monthAnim = useRef({ mp: 0, target: 0, raf: 0, last: 0 });
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false });
  const resizeChain = useRef(Promise.resolve());
  const queueResize = (fn) => {
    const run = resizeChain.current.then(fn, fn);
    resizeChain.current = run.catch(() => {});
    return run;
  };

  const days = [];
  for (let i = -RANGE; i <= RANGE; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    days.push({
      offset: i,
      date: d.getDate(),
      dow: d.getDay(),
      month: d.getMonth(),
    });
  }

  // Distinct months in the range, with the index of their first day
  const months = [];
  days.forEach((d, i) => {
    if (i === 0 || d.month !== days[i - 1].month) {
      months.push({ name: MONTHS[d.month], start: i });
    }
  });
  monthStarts.current = months.map((m) => m.start);

  // ---- months: eased position, driven by requestAnimationFrame ----
  const renderMonths = (mp) => {
    if (monthTrackRef.current) {
      monthTrackRef.current.style.transform = `translateX(${-mp * MONTH_W}px)`;
    }
    monthRefs.current.forEach((node, k) => {
      if (!node) return;
      const dist = Math.abs(k - mp);
      node.style.opacity = Math.max(0, 1 - MONTH_FADE * dist);
    });
  };

  const tick = (ts) => {
    const s = monthAnim.current;
    const dt = Math.min(64, ts - (s.last || ts));
    s.last = ts;
    const k = 1 - Math.exp(-dt / MONTH_TAU);
    s.mp += (s.target - s.mp) * k;
    if (Math.abs(s.target - s.mp) < 0.001) {
      s.mp = s.target;
      s.raf = 0;
      s.last = 0;
      renderMonths(s.mp);
      return;
    }
    renderMonths(s.mp);
    s.raf = requestAnimationFrame(tick);
  };

  const monthTargetFor = (pos) => {
    // each boundary finishes exactly when the 1st of the month is centered
    let t = 0;
    const starts = monthStarts.current;
    for (let k = 1; k < starts.length; k++) {
      t += smoothstep((pos - (starts[k] - MONTH_BLEND)) / MONTH_BLEND);
    }
    return t;
  };

  // Writes styles directly from the fractional scroll position (no React state)
  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    const pos = el.scrollLeft / ITEM_W; // fractional index of the centered day

    dayRefs.current.forEach((node, i) => {
      if (!node) return;
      const dist = Math.abs(i - pos);
      const t = Math.max(0, 1 - dist); // 1 at center, 0 one day away
      node.style.opacity = Math.max(0, 1 - 0.293 * dist);
      node.style.transform = `translateY(${2 * (1 - t)}px)`;
      node.style.setProperty("--t", t);
    });

    const s = monthAnim.current;
    s.target = monthTargetFor(pos);
    if (!s.raf) s.raf = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const id = setInterval(() => {
      // only re-render when the displayed minute (or day) changes
      setNow((prev) => {
        const n = new Date();
        return n.getMinutes() === prev.getMinutes() &&
          n.getDate() === prev.getDate()
          ? prev
          : n;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // close when focus is lost: window blur, tab hidden, or pointer down outside the pill
  useEffect(() => {
    const onBlur = () => closeRef.current();
    const onPointerDownOutside = (e) => {
      if (pillRef.current && !pillRef.current.contains(e.target)) {
        closeRef.current();
      }
    };
    const onVisibility = () => {
      if (document.hidden) closeRef.current();
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("pointerdown", onPointerDownOutside);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("pointerdown", onPointerDownOutside);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // start centered on today, months placed without animation
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = RANGE * ITEM_W;
    update();
    const s = monthAnim.current;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.last = 0;
    s.mp = s.target;
    renderMonths(s.mp);
    return () => {
      if (monthAnim.current.raf) cancelAnimationFrame(monthAnim.current.raf);
    };
  }, []);

  const scrollToIndex = (i, animate = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * ITEM_W, behavior: animate ? "smooth" : "auto" });
  };

  // ---- month navigation: scrolling the months also scrolls the days ----
  const monthNav = useRef({ k: 0, until: 0, acc: 0, lastStep: 0 });
  const monthDrag = useRef({
    down: false,
    startX: 0,
    startK: 0,
    lastK: 0,
    moved: false,
  });

  // month currently shown (or the one we are already scrolling to)
  const currentMonthIndex = () => {
    const nav = monthNav.current;
    if (performance.now() < nav.until) return nav.k;
    const el = scrollRef.current;
    const idx = el ? Math.round(el.scrollLeft / ITEM_W) : RANGE;
    const starts = monthStarts.current;
    let k = 0;
    for (let j = 0; j < starts.length; j++) if (starts[j] <= idx) k = j;
    return k;
  };

  // scroll the days to the given month (today's month goes back to today)
  const goToMonth = (k) => {
    const starts = monthStarts.current;
    const next = Math.max(0, Math.min(starts.length - 1, k));
    const end = next + 1 < starts.length ? starts[next + 1] : Infinity;
    const index = starts[next] <= RANGE && RANGE < end ? RANGE : starts[next];
    monthNav.current.k = next;
    monthNav.current.until = performance.now() + 600;
    scrollToIndex(index);
  };

  const onMonthWheel = (e) => {
    const nav = monthNav.current;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    nav.acc += delta;
    const t = performance.now();
    if (Math.abs(nav.acc) < 30 || t - nav.lastStep < 180) return;
    goToMonth(currentMonthIndex() + (nav.acc > 0 ? 1 : -1));
    nav.acc = 0;
    nav.lastStep = t;
  };

  const onMonthPointerDown = (e) => {
    const k = currentMonthIndex();
    monthDrag.current = {
      down: true,
      startX: e.clientX,
      startK: k,
      lastK: k,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMonthPointerMove = (e) => {
    const d = monthDrag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    const last = monthStarts.current.length - 1;
    const k = Math.max(0, Math.min(last, d.startK + Math.round(-dx / MONTH_W)));
    if (k !== d.lastK) {
      d.lastK = k;
      goToMonth(k);
    }
  };
  const endMonthDrag = (e) => {
    const d = monthDrag.current;
    if (!d.down) return;
    d.down = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };
  // click on a month label jumps to it; never toggles the pill
  const onMonthClick = (e) => {
    e.stopPropagation();
    if (monthDrag.current.moved) {
      monthDrag.current.moved = false;
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = (e.clientX - rect.left - rect.width / 2) / MONTH_W;
    goToMonth(Math.round(monthAnim.current.mp + offset));
  };

  // mouse drag (touch uses native scrolling)
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollRef.current;
    drag.current = {
      down: true,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
    el.style.scrollSnapType = "none";
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    scrollRef.current.scrollLeft = d.startLeft - dx;
  };
  const endDrag = (e) => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    const el = scrollRef.current;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch (_) {}
    el.style.scrollSnapType = "";
    scrollToIndex(Math.round(el.scrollLeft / ITEM_W));
  };

  const closePill = () => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    scrollToIndex(RANGE); // back to today
    queueResize(async () => {
      try {
        await new Promise((r) => setTimeout(r, CLOSE_DELAY));
        if (openRef.current) return;
        await setWidth(COLLAPSED.w);
        await setHeight(COLLAPSED.h);
      } catch (e) {
        console.error(e);
      }
    });
  };
  closeRef.current = closePill; // always points at the latest version

  const toggle = () => {
    if (openRef.current) {
      closePill();
      return;
    }
    openRef.current = true;
    setOpen(true);
    queueResize(async () => {
      try {
        await setHeight(EXPANDED.h);
        await setWidth(EXPANDED.w);
      } catch (e) {
        console.error(e);
      }
    });
  };

  // a click anywhere on the pill toggles it, except the click that ends a drag
  const onPillClick = () => {
    if (drag.current.moved) {
      drag.current.moved = false;
      return;
    }
    toggle();
  };
  const onPillPointerDown = () => {
    drag.current.moved = false;
  };

  return (
    <div className="cp-stage">
      <div
        ref={pillRef}
        className={"cp-pill" + (open ? " cp-open" : "")}
        style={{
          width: open ? EXPANDED.w : COLLAPSED.w,
          height: open ? EXPANDED.h : COLLAPSED.h,
        }}
        onClick={onPillClick}
        onPointerDown={onPillPointerDown}
      >
        <div className="cp-time">
          {pad(now.getHours())}:{pad(now.getMinutes())}
        </div>

        <div className="cp-week">
          <div
            ref={scrollRef}
            className="cp-scroll"
            style={{ width: ITEM_W * VISIBLE }}
            onScroll={update}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="cp-track" style={{ padding: `0 ${ITEM_W * 3}px` }}>
              {days.map((d, i) => {
                const today = d.offset === 0;
                const weekend = d.dow === 0 || d.dow === 6;
                return (
                  <div
                    key={d.offset}
                    ref={(n) => (dayRefs.current[i] = n)}
                    className={
                      "cp-day" +
                      (today ? " cp-today" : "") +
                      (weekend ? " cp-weekend" : "")
                    }
                  >
                    <span className="cp-label">
                      <span className="cp-letter">{LETTERS[d.dow]}</span>
                      <span className="cp-name">{NAMES[d.dow]}</span>
                    </span>
                    <span className="cp-num">{d.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* months side by side, eased by the rAF loop */}
        <div
          className="cp-month"
          onWheel={onMonthWheel}
          onPointerDown={onMonthPointerDown}
          onPointerMove={onMonthPointerMove}
          onPointerUp={endMonthDrag}
          onPointerCancel={endMonthDrag}
          onClick={onMonthClick}
        >
          <div ref={monthTrackRef} className="cp-month-track">
            {months.map((m, k) => (
              <span
                key={m.name + m.start}
                ref={(n) => (monthRefs.current[k] = n)}
                className="cp-month-item"
                style={{ left: k * MONTH_W }}
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuClock;

export const className = `
  .cp-stage {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    box-sizing: border-box;
    font-family: -apple-system, "SF Pro Display", "Helvetica Neue", Inter, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .cp-stage *{
    -webkit-user-select: none;
    user-select: none;
  }
  .cp-pill {
    background: #000;
    border: 1px solid #222;
    border-radius: 22px;
    overflow: hidden;
    position: relative;
    transition: width 0.45s cubic-bezier(.2,.8,.2,1),
    height 0.45s cubic-bezier(.2,.8,.2,1),
    border-radius 0.45s cubic-bezier(.2,.8,.2,1);
  }
  .cp-pill.cp-open {
    border-radius: 30px;
  }
  .cp-time {
    position: absolute;
    top: 3.3px;
    left: 0;
    right: 0;
    text-align: center;
    line-height: 19px;
    font-size: 14px;
    font-weight: 500;
    color: #fafafa;
    font-variant-numeric: tabular-nums;
    transition: top 0.45s cubic-bezier(.2,.8,.2,1);
  }
  .cp-open .cp-time {
    top: 16px;
  }
  .cp-week {
    position: absolute;
    top: 46px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }
  .cp-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    touch-action: pan-x;
  }
  .cp-scroll::-webkit-scrollbar {
    display: none;
  }
  .cp-track {
    display: flex;
    align-items: flex-start;
    width: max-content;
    box-sizing: content-box;
  }
  .cp-day {
    flex: 0 0 27px;
    width: 27px;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #cfcfd4;
    scroll-snap-align: center;
    will-change: opacity, transform;
  }
  .cp-label {
    position: relative;
    display: block;
    height: 13px;
    line-height: 13px;
    width: 100%;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: #8e8e93;
  }
  .cp-letter,
  .cp-name {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .cp-letter { opacity: calc(1 - var(--t, 0)); }
  .cp-name   { opacity: var(--t, 0); }
  .cp-num {
    font-size: 14px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    transform: scale(calc(1 + var(--t, 0) * 0.143)); /* 14px -> 16px */
    transform-origin: center;
  }
  .cp-weekend .cp-label,
  .cp-weekend .cp-num {
    color: #ff6c64;
  }

  /* today: the only day with the highlight color */
  .cp-today .cp-label {
    color: #e5e5ea;
  }
  .cp-today .cp-num {
    color: #bfe9e1;
  }
  .cp-today.cp-weekend .cp-label,
  .cp-today.cp-weekend .cp-num {
    color: #ff6c64;
  }

  /* months strip under the week, with progressively darker edges */
  .cp-month {
    position: absolute;
    top: 92px;
    left: 0;
    right: 0;
    height: 16px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    touch-action: none;
    transition: opacity 0.3s ease;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 36%, #000 64%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, #000 36%, #000 64%, transparent 100%);
  }
  .cp-open .cp-month {
    opacity: 1;
    pointer-events: auto;
    transition-delay: 0.15s;
  }
  .cp-month-track {
    position: absolute;
    top: 0;
    left: 50%;
    height: 100%;
    will-change: transform;
  }
  .cp-month-item {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 12px;
    line-height: 16px;
    font-weight: 500;
    letter-spacing: 0.3px;
    color: #cfcfd4;
    will-change: opacity;
  }
`;
