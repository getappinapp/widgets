import { useState } from "react";

export const refreshFrequency = 1000;

export const height = 70;
export const width = 160;
export const x = 300;
export const y = 145;

const w = width-20;
const h = height-15;
const r = 6;
const stroke = 3;
const fontSize = 25;

const POMODORO_MINUTES = 25;
const TOTAL_SECONDS = POMODORO_MINUTES * 60;

let state = {
  running: false,
  startTime: null,
  remaining: TOTAL_SECONDS,
  interval: null,
};

const Timer = ({ run }) => {
  const [, forceRender] = useState(0);

  const format = (v) => String(v).padStart(2, "0");

  const reset = () => {
    clearInterval(state.interval);
    state.running = false;
    state.startTime = null;
    state.remaining = TOTAL_SECONDS;
    forceRender((n) => n + 1);
  };

  const tick = () => {
    if (!state.startTime) return;

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const remaining = TOTAL_SECONDS - elapsed;

    if (remaining <= 0) {
      reset();
      run("afplay ./end.mp3");
      return;
    }

    state.remaining = remaining;
    forceRender((n) => n + 1);
  };

  const startStop = () => {
    if (state.running) {
      clearInterval(state.interval);
      state.running = false;
      forceRender((n) => n + 1);
      return;
    }

    state.running = true;
    state.startTime = Date.now() - (TOTAL_SECONDS - state.remaining) * 1000;

    tick();
    state.interval = setInterval(tick, 1000);
  };

  const perimeter =
    2 * (w - stroke) + 2 * (h - stroke) - 8 * r + 2 * Math.PI * r;

  const progress = 1 - state.remaining / TOTAL_SECONDS;
  const dashOffset = perimeter * progress;

  const getColor = () => {
    if (window.vibeBG) return `rgb(${window.vibeBG})`;
    if (progress < 0.33) return "#4ade80";
    if (progress < 0.66) return "#facc15";
    return "#f87171";
  };

  const minutes = Math.floor(state.remaining / 60);
  const seconds = state.remaining % 60;

  return (
    <div id="pomodoro">
      <div className="timer" onClick={startStop} onDoubleClick={reset}>
        <svg width={w} height={h}>
          <rect
            x={stroke / 2}
            y={stroke / 2}
            width={w - stroke}
            height={h - stroke}
            rx={r}
            fill="transparent"
            stroke={state.running ? getColor() : "#ffffff14"}
            strokeWidth={stroke}
            strokeDasharray={perimeter}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.4s linear, stroke 0.3s ease",
            }}
          />
        </svg>

        <div className="time" style={{ opacity: state.running ? 1 : 0.5 }}>
          {format(minutes)}:{format(seconds)}
        </div>
      </div>
    </div>
  );
};

export default Timer;

export const className = `
#pomodoro {
  width: ${width}px;
  height: ${height}px;
  background: #0f0f0f;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: JetBrains Mono;
  color: white;
  border-radius: ${r + 5}px;
}

.timer {
  width: ${w}px;
  height: ${h}px;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.timer svg {
  position: absolute;
  inset: 0;
}

.time {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: ${fontSize}px;
  letter-spacing: 1px;
  transition: opacity 0.2s ease;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none !important;
}
`;