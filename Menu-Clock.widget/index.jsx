import { useState, useEffect, useRef } from "appinapp-react";

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const pad = (n) => String(n).padStart(2, "0");

const COLLAPSED = { w: 70, h: 29 };
const EXPANDED = { w: 240, h: 108 };
const CLOSE_DELAY = 450;

const CalendarPill = ({ setHeight, setWidth }) => {
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const resizeChain = useRef(Promise.resolve());
  const queueResize = (fn) => {
    const run = resizeChain.current.then(fn, fn);
    resizeChain.current = run.catch(() => {});
    return run;
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const toggle = () => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
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

  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    days.push({ offset: i, date: d.getDate(), dow: d.getDay() });
  }

  const fade = { 0: 1, 1: 0.7, 2: 0.4, 3: 0.12 };

  return (
    <div className="cp-stage">
      <div
        className={"cp-pill" + (open ? " cp-open" : "")}
        style={{
          width: open ? EXPANDED.w : COLLAPSED.w,
          height: open ? EXPANDED.h : COLLAPSED.h,
        }}
        onClick={toggle}
        onMouseLeave={toggle}
      >
        <div className="cp-time">
          {pad(now.getHours())}:{pad(now.getMinutes())}
        </div>
        <div className="cp-week">
          {days.map((d) => {
            const today = d.offset === 0;
            const weekend = d.dow === 0 || d.dow === 6;
            return (
              <div
                key={d.offset}
                className={
                  "cp-day" +
                  (today ? " cp-today" : "") +
                  (weekend ? " cp-weekend" : "")
                }
                style={{
                  opacity: fade[Math.abs(d.offset)],
                  marginTop: today ? 0 : 2,
                }}
              >
                <span className="cp-label">
                  {today ? NAMES[d.dow] : LETTERS[d.dow]}
                </span>
                <span className="cp-num">{d.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarPill;

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
  }
  .cp-pill {
    background: #000;
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
    top: 5px;
    left: 0;
    right: 0;
    text-align: center;
    line-height: 19px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.5px;
    color: #f4ecd6;
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
  .cp-day {
    width: 27px;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #cfcfd4;
  }
  .cp-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: #8e8e93;
  }
  .cp-num {
    font-size: 18px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .cp-weekend .cp-label,
  .cp-weekend .cp-num {
    color: #ff6c64;
  }
  .cp-today .cp-label {
    color: #e5e5ea;
  }
  .cp-today .cp-num {
    color: #bfe9e1;
    font-size: 22px;
    font-weight: 600;
  }
  .cp-today.cp-weekend .cp-label,
  .cp-today.cp-weekend .cp-num {
    color: #ff6c64;
  }
`;
