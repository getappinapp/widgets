const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

const arc = (cx, cy, r, from, to) => {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

const C = 512;
const R = 450;
const SW = 90;
const START = 211.3;
const SPAN = 297.3;

const WIFI_TOP =
  "M511.978 357C423.593 357 335.209 393.438 271.768 452.759C268.189 456.012 268.081 461.543 271.443 465.121L300.398 495.378C303.76 498.957 309.399 499.065 312.978 495.703C338.246 472.279 367.093 453.626 398.976 440.396C434.763 425.43 472.828 417.947 512.086 417.947C551.344 417.947 589.409 425.538 625.196 440.396C657.079 453.735 685.926 472.279 711.194 495.703C714.773 499.065 720.412 498.957 723.774 495.378L752.73 465.121C756.091 461.651 755.983 456.12 752.404 452.759C688.746 393.438 600.362 357 511.978 357Z";

const WIFI_BOTTOM =
  "M357.115 553.832L388.131 584.522C391.492 587.776 396.806 587.993 400.277 584.848C430.967 557.628 470.333 542.662 511.868 542.662C553.404 542.662 592.77 557.519 623.46 584.848C626.93 587.993 632.244 587.776 635.606 584.522L666.622 553.832C670.201 550.253 670.092 544.505 666.297 541.144C625.629 504.38 571.297 481.932 511.76 481.932C452.223 481.932 397.891 504.38 357.223 541.144C353.645 544.505 353.536 550.253 357.115 553.832ZM511.977 604.477C486.6 604.477 463.61 615.104 447.559 632.13C444.306 635.601 444.415 640.915 447.776 644.277L505.687 701.428C509.157 704.898 514.796 704.898 518.267 701.428L576.177 644.277C579.539 640.915 579.648 635.601 576.394 632.13C560.344 615.213 537.353 604.477 511.977 604.477Z";

const DuoIndicator = ({ output, error }) => {
  const [batt, charging, wifiOn, net] = (output || "").trim().split("|");
  const level = Math.max(0, Math.min(100, parseInt(batt, 10)));
  const hasBattery = !error && !isNaN(level);
  const isCharging = charging === "1";
  const wifiPowered = wifiOn === "1";
  const isOnline = net === "1";
  const isCaptive = net === "2";

  const pct = hasBattery ? level / 100 : 0;
  const end = START + SPAN * pct;

  let ringColor = "var(--duo-fg)";
  if (isCharging) ringColor = "#6bff90";
  else if (hasBattery && level <= 20) ringColor = "#ff635b";
  else if (hasBattery && level <= 30) ringColor = "#ffde5b";

  // online: full opacity, captive portal: amber, offline: dimmed
  const onlineOpacity = isOnline ? 1 : isCaptive ? 0.8 : 0.45;
  const wifiColor = isCaptive ? "#ffde5b" : "var(--duo-fg)";

  return (
    <div
      className="duo-wrap"
      title={`${hasBattery ? `Battery ${level}%` : "Battery n/a"} · ${
        isOnline ? "Online" : isCaptive ? "Network intercepted" : "Offline"
      }`}
    >
      <svg
        viewBox="0 0 1024 1024"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ring track (Duo's bright arc + dim tail) */}
        <path
          d={arc(C, C, R, START, START + SPAN)}
          stroke="var(--duo-track)"
          strokeWidth={SW}
          strokeLinecap="round"
        />
        {/* ring progress */}
        {pct > 0.005 && (
          <path
            d={arc(C, C, R, START, end)}
            stroke={ringColor}
            strokeWidth={SW}
            strokeLinecap="round"
            style={{ transition: "all .6s ease" }}
          />
        )}

        {/* Duo wifi glyph */}
        <g
          fill={wifiColor}
          opacity={onlineOpacity}
          style={{ transition: "opacity .4s ease" }}
        >
          <path d={WIFI_TOP} />
          <path d={WIFI_BOTTOM} />
        </g>

        {/* wifi off slash */}
        {!wifiPowered && (
          <line
            x1="330"
            y1="340"
            x2="700"
            y2="720"
            stroke="var(--duo-fg)"
            strokeWidth="50"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

export default DuoIndicator;

export const className = `
.duo-wrap {
  width: 100%;
  height: 100%;
  --duo-fg: #fff;
  --duo-track: #ffffff3d; /* 24% white, same as Duo's dim arc */
}
`;

export const command = `W=$(networksetup -listallhardwareports | awk '/Wi-Fi/{getline; print $2}'); [ -z "$W" ] && W=en0;
B=$(pmset -g batt);
BAT=$(echo "$B" | grep -Eo '[0-9]+%' | head -1 | tr -d %);
AC=$(echo "$B" | grep -q 'AC Power' && echo 1 || echo 0);
WIFI=$(networksetup -getairportpower "$W" | grep -q On && echo 1 || echo 0);
H=$(scutil --nwi | awk '/REACH : flags/{print; exit}' | grep -Eo '0x[0-9a-fA-F]+');
H=\${H:-0x0};
if [ $((H & 2)) -ne 0 ] && [ $((H & 4)) -eq 0 ]; then STATE=1;
elif [ $((H & 2)) -ne 0 ]; then STATE=2;
else STATE=0; fi;
echo "$BAT|$AC|$WIFI|$STATE`;
