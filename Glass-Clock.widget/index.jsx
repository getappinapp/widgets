import { useState, useEffect } from "appinapp-react";
import font from "./sf-pro.otf";

const format = (d) =>
  (d.getHours() % 12 || 12) + ":" + String(d.getMinutes()).padStart(2, "0");

const styles = {
  root: {
    width: 442,
    height: 195,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    fontFamily: "SF Pro",
    containerType: "size",
    WebkitUserSelect: "none",
  },
  grid: {
    display: "grid",
    fontSize: "min(142cqh, 37cqw)",
    fontWeight: 600,
    lineHeight: 1,
    textBox: "trim-both cap alphabetic",
  },
  layer: {
    gridArea: "1 / 1",
    whiteSpace: "nowrap",
  },
  fill: {
    color: "#ffffff30",
    filter: "drop-shadow(0 8px 18px #00000047)",
  },
  edge: {
    color: "#ffffff",
    opacity: 0.5,
    filter: "url(#glass-edges)",
  },
};

const GlassClock = () => {
  const [time, setTime] = useState(format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={styles.root}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="glass-edges">
          <feOffset in="SourceAlpha" dy="2.5" result="down" />
          <feComposite
            in="SourceGraphic"
            in2="down"
            operator="out"
            result="top"
          />
          <feOffset in="SourceAlpha" dy="-2.5" result="up" />
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

      <div>
        <div style={styles.grid}>
          <span style={{ ...styles.layer, ...styles.fill }}>{time}</span>
          <span style={{ ...styles.layer, ...styles.edge }}>{time}</span>
        </div>
      </div>
    </div>
  );
};

export default GlassClock;

export const className = `
@font-face {
  font-family: SF Pro;
  src: url(${font});
}`;
