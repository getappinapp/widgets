const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } =
  React;
const { Check, RotateCcw, Plus } = window.Lucide;
const Scritto = window.Scritto;

const TICK_MS = 100;
const HANDOVER_MS = 380;
const HOLD_TO_DELETE_MS = 2000;
const ARM_DELAY_MS = 500; // press must be held this long before delete arms
const HATCH = 9.9;
const TRACK_GAP = 2;
const TRACK_PAD = 3;
const MIN_CELL = 24;
const BASE_PX_PER_SEC = 0.03;
const FALLBACK_VIEW_W = 186; // section content width until measured
const CORNER = 22;
const CELL_CORNER = Math.max(4, Math.round(CORNER * 0.28));

const COLOR = {
  card: "#111111",
  muted: "#8a8a8f",
  accent: "#0a84ff",
  accentDeep: "#0064d8",
  track: "#0e2742",
  cell: "#173a5e",
  cellSoft: "#12314f",
  delete: "#ff6161",
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const mmss = (s) => {
  const t = Math.max(0, Math.ceil(s - 1e-6));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

const hms = (s) => {
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600);
  const head = h
    ? `${h}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}`
    : String(Math.floor(t / 60)).padStart(2, "0");
  return `${head}:${String(t % 60).padStart(2, "0")}`;
};

const spoken = (s) => {
  const t = Math.max(0, Math.ceil(s - 1e-6));
  const m = Math.floor(t / 60);
  return `${m ? `${m} min ` : ""}${t % 60} sec`;
};

function buildBlocks(plan) {
  let cursor = 0;
  const blocks = plan.map((b) => {
    const start = cursor;
    cursor += b.seconds;
    return { ...b, start, end: cursor };
  });
  return { blocks, total: cursor };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* -------------------------------------------------------------- component -- */

const SessionList = () => {
  const reduced = useReducedMotion();

  const [planItems, setPlanItems] = useState([
    { label: "Preparation", seconds: 25 * 60 },
  ]);
  const { blocks, total } = useMemo(() => buildBlocks(planItems), [planItems]);

  const [newLabel, setNewLabel] = useState("");
  const [newMinutes, setNewMinutes] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewW, setViewW] = useState(0); // measured strip viewport
  const [tipW, setTipW] = useState(0); // measured tooltip bubble width
  const [holdingIndex, setHoldingIndex] = useState(null); // press-and-hold delete target

  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);
  const [holding, setHolding] = useState(false); // clock rests on 00:00 during handover
  const [hoverIndex, setHoverIndex] = useState(null);
  const [pressedIndex, setPressedIndex] = useState(null);
  const [popScale, setPopScale] = useState(1);
  const [realTicks, setRealTicks] = useState(0); // drives the hatch scroll

  const lastFrame = useRef(
    typeof performance !== "undefined" ? performance.now() : 0,
  );
  const holdTimer = useRef(null);
  const restTimer = useRef(null);
  const prevIndexRef = useRef(0);
  const trackRef = useRef(null);
  const tipRef = useRef(null);
  const deleteTimer = useRef(null);
  const armTimer = useRef(null);
  const suppressClick = useRef(false);

  const liveIndex = useMemo(() => {
    for (let i = blocks.length - 1; i >= 0; i -= 1)
      if (elapsed >= blocks[i].start) return i;
    return 0;
  }, [blocks, elapsed]);

  const leftOnLive =
    blocks[liveIndex]?.end -
    clamp(elapsed, blocks[liveIndex].start, blocks[liveIndex].end);
  const progressInLive = clamp(
    (elapsed - blocks[liveIndex].start) / blocks[liveIndex].seconds,
    0,
    1,
  );

  /* the clock: one number (elapsed) drives everything else that's read back out */
  useEffect(() => {
    lastFrame.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1000, Math.max(0, now - lastFrame.current));
      lastFrame.current = now;
      if (!playing || finished) return;
      setRealTicks((n) => n + 1);
      setElapsed((prev) => Math.min(total, prev + dt / 1000));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [playing, finished, total]);

  /* a hidden tab must not fast-forward the session when it comes back */
  useEffect(() => {
    const onVisible = () => {
      lastFrame.current = performance.now();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  /* completion */
  useEffect(() => {
    if (elapsed >= total && !finished) {
      setFinished(true);
      setPlaying(false);
      clearTimeout(restTimer.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, total, finished]);

  /* a block hands over: clock rests on 00:00 for a beat before the next opens */
  useEffect(() => {
    if (liveIndex !== prevIndexRef.current && !finished) {
      prevIndexRef.current = liveIndex;
      setHolding(true);
      clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(
        () => setHolding(false),
        reduced ? 0 : HANDOVER_MS,
      );
    }
  }, [liveIndex, finished, reduced]);

  useEffect(
    () => () => {
      clearTimeout(holdTimer.current);
      clearTimeout(restTimer.current);
      clearTimeout(armTimer.current);
      clearTimeout(deleteTimer.current);
    },
    [],
  );

  const restart = useCallback(() => {
    clearTimeout(restTimer.current);
    clearTimeout(holdTimer.current);
    setHolding(false);
    setFinished(false);
    setPlaying(true);
    prevIndexRef.current = 0;
    setElapsed(0);
  }, []);

  /* a new task extends the plan; if the session had already finished, adding
     more work reopens it rather than leaving it stuck on the old total */
  const addTask = useCallback(() => {
    const label = newLabel.trim() || `Task ${planItems.length + 1}`;
    const minutes = clamp(Math.round(Number(newMinutes) || 1), 1, 60);
    setPlanItems((prev) => [
      ...prev,
      { label, seconds: Math.round(minutes * 60) },
    ]);
    setNewLabel("");
    setNewMinutes(5);
    setModalOpen(false);
    if (finished) {
      setFinished(false);
      setPlaying(true);
      clearTimeout(restTimer.current);
    }
  }, [finished, newLabel, newMinutes, planItems.length]);

  const openModal = useCallback(() => {
    setNewLabel("");
    setNewMinutes(5);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const cancelHold = useCallback(() => {
    clearTimeout(armTimer.current);
    clearTimeout(deleteTimer.current);
    setHoldingIndex(null);
  }, []);

  /* press-and-hold a block for 2s to delete it; elapsed shifts with the
     plan so the session continues where the remaining blocks now are */
  const deleteBlock = useCallback(
    (i) => {
      setHoldingIndex(null);
      setHoverIndex(null);
      setPressedIndex(null);
      if (blocks.length <= 1) return; // keep at least one block
      const target = blocks[i];
      if (!target) return;
      const nextPlan = planItems.filter((_, idx) => idx !== i);
      const { blocks: nextBlocks, total: nextTotal } = buildBlocks(nextPlan);
      const nextElapsed = Math.min(
        nextTotal,
        elapsed <= target.start
          ? elapsed
          : Math.max(target.start, elapsed - target.seconds),
      );
      let ni = 0;
      for (let k = nextBlocks.length - 1; k >= 0; k -= 1) {
        if (nextElapsed >= nextBlocks[k].start) {
          ni = k;
          break;
        }
      }
      prevIndexRef.current = ni;
      setPlanItems(nextPlan);
      setElapsed(nextElapsed);
    },
    [blocks, planItems, elapsed],
  );

  const bumpPop = useCallback(() => {
    setPopScale(1.25);
    setTimeout(() => setPopScale(1), 20);
  }, []);

  /* jump to the start of a block — the clock and playhead follow from `elapsed` */
  const goTo = useCallback(
    (i) => {
      clearTimeout(restTimer.current);
      clearTimeout(holdTimer.current);
      setHolding(false);
      const next = clamp(i, 0, blocks.length);
      if (next >= blocks.length) {
        setFinished(true);
        setPlaying(false);
        setElapsed(total);
        return;
      }
      setFinished(false);
      setPlaying(true);
      prevIndexRef.current = next;
      setElapsed(blocks[next].start);
    },
    [blocks, restart, total],
  );

  const togglePlay = useCallback(() => {
    if (finished) {
      restart();
      return;
    }
    setPlaying((p) => !p);
  }, [finished, restart]);

  const onCheckClick = () => {
    if (finished) {
      restart();
      return;
    }
    bumpPop();
    goTo(liveIndex + 1);
  };

  const onKeyDown = (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowRight") {
      goTo(liveIndex + 1);
    } else if (e.key === "ArrowLeft") {
      goTo(finished ? blocks.length - 1 : liveIndex - 1);
    }
  };

  const tipIndex = hoverIndex ?? liveIndex;
  const tipBlock = blocks[tipIndex];
  const hatchOffset = reduced ? 0 : ((realTicks * TICK_MS) / 1100) * HATCH;

  /* fixed-width cells on a horizontally scrolling strip: long timers widen
     the strip instead of squeezing the other cells. The scale fills the
     measured viewport so short plans fit exactly; longer ones overflow. */
  const viewport = viewW || FALLBACK_VIEW_W;
  const overhead = TRACK_PAD * 2 + MIN_CELL + TRACK_GAP * blocks.length;
  const pxPerSec = Math.max(BASE_PX_PER_SEC, (viewport - overhead) / total);
  const cellWidths = useMemo(
    () => blocks.map((b) => Math.max(MIN_CELL, b.seconds * pxPerSec)),
    [blocks, pxPerSec],
  );
  const contentW =
    TRACK_PAD * 2 +
    cellWidths.reduce((acc, w) => acc + w, 0) +
    MIN_CELL +
    TRACK_GAP * blocks.length;
  const headLeftPx =
    TRACK_PAD +
    cellWidths.slice(0, liveIndex).reduce((acc, w) => acc + w + TRACK_GAP, 0) +
    progressInLive * (cellWidths[liveIndex] ?? MIN_CELL);
  /* the tooltip lane scrolls with the cells, so the bubble is anchored in
     the same px mapping instead of % of total time */
  const tipRawPx =
    TRACK_PAD +
    cellWidths.slice(0, tipIndex).reduce((acc, w) => acc + w + TRACK_GAP, 0) +
    (cellWidths[tipIndex] ?? MIN_CELL) / 2;
  /* keep the bubble inside the strip: pushed left on the last cell,
     right on the first — the pills underneath never move */
  const tipHalf = tipW / 2;
  const tipLeftPx = clamp(
    tipRawPx,
    tipHalf,
    Math.max(tipHalf, contentW - tipHalf),
  );

  /* measure the bubble so the edge clamp knows its real half-width */
  useLayoutEffect(() => {
    if (tipRef.current) {
      const w = tipRef.current.offsetWidth;
      setTipW((prev) => (prev === w ? prev : w));
    }
  });

  /* keep the live cell in view when the handover moves to a new block */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const target = headLeftPx - el.clientWidth / 2;
    el.scrollTo({
      left: Math.max(0, target),
      behavior: reduced ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveIndex]);

  /* two-finger / wheel scroll drives the strip horizontally: a native
     (non-passive) listener so vertical deltas can be claimed */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.ctrlKey) return; // pinch-zoom, leave it alone
      if (el.scrollWidth <= el.clientWidth + 1) return; // nothing to scroll
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already horizontal
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      el.scrollLeft += e.deltaY * unit;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* measure the strip viewport once so short plans fit it exactly */
  useEffect(() => {
    if (trackRef.current) setViewW(trackRef.current.clientWidth);
  }, []);

  const clockText = holding || finished ? "00:00" : mmss(leftOnLive);

  const caption = finished
    ? `Session complete \u00b7 ${hms(total)} total`
    : !playing
      ? `Paused \u00b7 ${mmss(leftOnLive)} left on ${blocks[liveIndex].label.toLowerCase()}`
      : `Left for ${blocks[liveIndex].label.toLowerCase()}`;

  const transition = (rule) => (reduced ? "none" : rule);

  /* --- render -------------------------------------------------------------- */

  return (
    <div
      style={{
        position: "relative",
        width: 220,
        height: 190,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxSizing: "border-box",
        fontFamily:
          "Inter, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
        color: "#ffffff",
        textAlign: "left",
      }}
    >
      <section
        tabIndex={0}
        role="group"
        aria-label={`Session, ${blocks.length} blocks`}
        onKeyDown={onKeyDown}
        style={{
          position: "relative",
          display: "flex",
          flex: "1 1 auto",
          minHeight: 0,
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: 17,
          overflow: "hidden",
          background: COLOR.card,
          borderRadius: CORNER,
          border: "1px solid #1d1d1d",
          boxShadow: "0 20px 45px -24px rgba(0,0,0,0.75)",
          outline: "none",
          userSelect: "none",
          boxSizing: "border-box",
        }}
      >
        {/* --- header --- */}
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <Scritto
                value={clockText}
                style={{
                  fontSize: 35,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: COLOR.muted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: transition("opacity 0.2s ease"),
              }}
              aria-live="polite"
            >
              {caption}
            </p>
          </div>

          <button
            type="button"
            title={finished ? "Replay the session" : "Finish this block now"}
            aria-label={
              finished ? "Replay the session" : "Finish this block now"
            }
            className="cursor-pointer"
            onClick={onCheckClick}
            style={{
              marginTop: "4px",
              position: "relative",
              display: "grid",
              flex: "0 0 auto",
              placeItems: "center",
              width: 26,
              height: 26,
              borderRadius: 999,
              background: COLOR.accent,
              color: "#ffffff",
              border: 0,
              transform: `scale(${popScale})`,
              transition: transition(
                "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              ),
            }}
          >
            {finished ? (
              <RotateCcw size={13} strokeWidth={2.5} />
            ) : (
              <Check size={13} strokeWidth={2.5} />
            )}
          </button>
        </header>

        {/* --- track --- */}
        <div
          ref={trackRef}
          className="session-track"
          style={{
            position: "relative",
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`.session-track{scrollbar-width:none;-ms-overflow-style:none}.session-track::-webkit-scrollbar{display:none;width:0;height:0}`}</style>
          <div style={{ width: contentW }}>
            <div
              style={{
                position: "relative",
                height: 22,
                marginBottom: 6,
                pointerEvents: "none",
              }}
            >
              <div
                ref={tipRef}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: tipLeftPx,
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  maxWidth: 196,
                  height: 22,
                  padding: "0 8px 0 4px",
                  borderRadius: 8,
                  background: COLOR.accent,
                  whiteSpace: "nowrap",
                  opacity: finished ? 0.35 : 1,
                  transition: transition(
                    "left 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
                  ),
                }}
              >
                <span
                  style={{
                    display: "grid",
                    flex: "0 0 auto",
                    placeItems: "center",
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: COLOR.accentDeep,
                    fontSize: 8,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: "#ffffff",
                  }}
                >
                  {tipIndex + 1}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "#ffffff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tipBlock.label}
                </span>
                {hoverIndex !== null && hoverIndex !== liveIndex && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.7)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {mmss(tipBlock.seconds)}
                  </span>
                )}
                <span
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: "50%",
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: COLOR.accent,
                    transform: "translateX(-50%) rotate(45deg)",
                  }}
                />
              </div>
            </div>

            <div
              role="list"
              aria-label="Session blocks"
              style={{
                position: "relative",
                display: "flex",
                flexWrap: "nowrap",
                gap: TRACK_GAP,
                padding: TRACK_PAD,
                borderRadius: 8,
                background: COLOR.track,
              }}
            >
              {blocks.map((block, i) => {
                const done = finished || i < liveIndex;
                const live = !finished && i === liveIndex;
                const isHover = hoverIndex === i;
                const isPressed = pressedIndex === i;
                return (
                  <button
                    key={`${block.label}-${i}`}
                    type="button"
                    title={`${block.label} \u00b7 ${mmss(block.seconds)}`}
                    aria-label={`Block ${i + 1}, ${block.label}, ${spoken(block.seconds)}. Replay from here. Hold for 2 seconds to delete`}
                    aria-current={live ? "step" : "false"}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => {
                      setHoverIndex((h) => (h === i ? null : h));
                      cancelHold();
                    }}
                    onMouseDown={() => {
                      setPressedIndex(i);
                      clearTimeout(armTimer.current);
                      clearTimeout(deleteTimer.current);
                      armTimer.current = setTimeout(() => {
                        setHoldingIndex(i);
                        deleteTimer.current = setTimeout(() => {
                          suppressClick.current = true;
                          deleteBlock(i);
                        }, HOLD_TO_DELETE_MS);
                      }, ARM_DELAY_MS);
                    }}
                    onMouseUp={() => {
                      setPressedIndex((p) => (p === i ? null : p));
                      cancelHold();
                    }}
                    onClick={() => {
                      if (suppressClick.current) {
                        suppressClick.current = false;
                        return;
                      }
                      setHoverIndex(null);
                      goTo(i);
                    }}
                    style={{
                      position: "relative",
                      flex: "0 0 auto",
                      width: cellWidths[i],
                      height: 34,
                      overflow: "hidden",
                      border: 0,
                      padding: 0,
                      borderRadius: CELL_CORNER,
                      background: COLOR.cellSoft,
                      cursor: "pointer",
                      transform: `translateY(${isHover ? -0.5 : 0}px) scale(${isPressed ? 0.955 : 1})`,
                      transition: transition(
                        "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      ),
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: COLOR.cell,
                        opacity: done ? 1 : live ? 0.6 : 0,
                        transition: transition("opacity 0.35s ease"),
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: live ? 1 : 0,
                        backgroundImage:
                          "repeating-linear-gradient(-45deg, rgba(45,140,255,0.55) 0 2px, rgba(45,140,255,0) 2px 7px)",
                        backgroundSize: `${HATCH}px ${HATCH}px`,
                        backgroundPositionX: `${hatchOffset}px`,
                        transition: transition("opacity 0.35s ease"),
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: live ? 1 : 0,
                        boxShadow: `inset 0 0 0 2px ${COLOR.accent}`,
                        borderRadius: CELL_CORNER,
                        pointerEvents: "none",
                        transition: transition("opacity 0.35s ease"),
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: holdingIndex === i ? "100%" : "0%",
                        background: COLOR.delete,
                        opacity: holdingIndex === i ? 0.9 : 0,
                        pointerEvents: "none",
                        transition:
                          holdingIndex === i
                            ? "width 2s linear, opacity 0.15s ease"
                            : "width 0.15s ease, opacity 0.15s ease",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        opacity: done ? 1 : 0,
                        pointerEvents: "none",
                        transition: transition("opacity 0.35s ease"),
                      }}
                    >
                      <Check
                        size={10}
                        strokeWidth={2.5}
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          transform: `scale(${done ? 1 : 0.6})`,
                          transition: transition(
                            "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                          ),
                        }}
                      />
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                title={`Create new timer`}
                onClick={openModal}
                style={{
                  position: "relative",
                  flex: "0 0 auto",
                  width: MIN_CELL,
                  height: 34,
                  overflow: "hidden",
                  border: `1px dashed ${COLOR.accentDeep}`,
                  padding: 0,
                  borderRadius: CELL_CORNER,
                  cursor: "pointer",
                  transition: transition(
                    "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  ),
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                    transition: transition("opacity 0.35s ease"),
                  }}
                >
                  <Plus
                    size={10}
                    strokeWidth={2.5}
                    style={{
                      color: COLOR.muted,
                      transition: transition(
                        "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                      ),
                    }}
                  />
                </span>
              </button>
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  bottom: 3,
                  left: headLeftPx,
                  width: 2,
                  borderRadius: 999,
                  background: "#ffffff",
                  opacity: finished ? 0 : playing ? 1 : 0.35,
                  pointerEvents: "none",
                  transition: transition("left 0.1s linear, opacity 0.2s ease"),
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- add task modal --- */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add task"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
            if (e.key === "Enter") addTask();
          }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: CORNER,
            background: COLOR.card,
            boxSizing: "border-box",
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "88%",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 12,
              borderRadius: 14,
              background: "#1d1d1f",
              boxShadow: "0 20px 45px -12px rgba(0,0,0,0.8)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              New task
            </div>
            <input
              autoFocus
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Task name"
              aria-label="New task name"
              style={{
                width: "100%",
                minWidth: 0,
                padding: "7px 8px",
                borderRadius: 8,
                border: 0,
                outline: "none",
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                fontSize: 12,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="number"
                min={1}
                max={60}
                value={newMinutes}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = Number(raw);
                  // max={} only affects spinners/validation, not typed input
                  setNewMinutes(
                    raw === "" || Number.isNaN(n) ? raw : Math.min(60, n),
                  );
                }}
                aria-label="New task minutes"
                style={{
                  width: 56,
                  minWidth: 0,
                  padding: "7px 6px",
                  borderRadius: 8,
                  border: 0,
                  outline: "none",
                  background: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  fontSize: 12,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{ fontSize: 11, color: COLOR.muted, flex: "1 1 auto" }}
              >
                min
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  flex: "1 1 0px",
                  padding: "7px 0",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addTask}
                style={{
                  flex: "1 1 0px",
                  padding: "7px 0",
                  borderRadius: 999,
                  background: COLOR.accent,
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionList;
export const className = `
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer * {
    cursor: pointer;
}
`;
export const width = 220;
export const height = 190;
export const x = 370;
export const y = 40;
