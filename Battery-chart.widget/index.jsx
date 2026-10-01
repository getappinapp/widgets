export const command = `
WINDOW_HOURS=10
FILE="./appinapp-battery-history.csv"

BATT=$(pmset -g batt)
PCT=$(echo "$BATT" | grep -Eo '[0-9]+%' | head -1 | tr -d '%')

if echo "$BATT" | grep -q "AC Power" && ! echo "$BATT" | grep -q "discharging"; then
  CHG=1
else
  CHG=0
fi

TS=$(date +%s)
touch "$FILE"
echo "$TS,$PCT,$CHG" >> "$FILE"

# Automatically prune entries older than WINDOW_HOURS
CUTOFF=$((TS - WINDOW_HOURS * 3600))
awk -F, -v cutoff="$CUTOFF" '$1 >= cutoff' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

TIME_REM=$(echo "$BATT" | grep -Eo "[0-9]+:[0-9]+")
PERCENT=\${PCT:-0}
TIME_REM=\${TIME_REM:-"0:00"}
IS_AC=$([ $CHG -eq 1 ] && echo "true" || echo "false")

HIST=$(awk -F',' '
BEGIN { count = 0 }
{
  if ($1 != "" && $2 != "") {
    if (count > 0) printf ",";
    printf "{\\"timestamp\\":%s,\\"level\\":%s,\\"isCharging\\":%s}", $1, $2, $3;
    count++;
  }
}' "$FILE")

cat <<EOF
{
  "percentage": $PERCENT,
  "timeRemaining": "$TIME_REM",
  "isAC": $IS_AC,
  "history": [$HIST]
}
EOF
`;

export const refreshFrequency = 60 * 1000;

const formatTime = (ts) => {
  if (!ts) return "";
  const date = new Date(ts * 1000);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getSmoothPath = (pts) => {
  if (pts.length < 2) return "";
  if (pts.length === 2)
    return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;

  let path = `M ${pts[0].x},${pts[0].y}`;
  const tension = 0.3;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;

    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
};

export default function BatteryChart({ output, error }) {
  if (error || !output) {
    return (
      <div style={styles.container}>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
          Loading...
        </div>
      </div>
    );
  }

  let data;
  try {
    data = typeof output === "string" ? JSON.parse(output) : output;
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw output:", output);
    return (
      <div style={styles.container}>
        <div style={{ color: "#FF453A", fontSize: "13px" }}>Data Error</div>
      </div>
    );
  }

  const {
    percentage = 0,
    timeRemaining = "0:00",
    isAC = false,
    history = [],
  } = data;

  let statusText = "On Battery";
  if (isAC) {
    if (percentage >= 98) {
      statusText = "Fully Charged";
    } else if (timeRemaining && timeRemaining !== "0:00") {
      const [hStr, mStr] = timeRemaining.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const parts = [];
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}m`);
      statusText = `${parts.join(" ")} until full`;
    } else {
      statusText = "Charging...";
    }
  } else {
    if (timeRemaining && timeRemaining !== "0:00") {
      const parts = timeRemaining.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      statusText = `Should last ${minutes > 30 ? hours + 1 : hours}h`;
    } else {
      statusText = "Calculating...";
    }
  }

  const nowTs = Math.floor(Date.now() / 1000);
  const displayHistory =
    history.length >= 2
      ? history
      : [
          { timestamp: nowTs - 60, level: percentage, isCharging: isAC },
          { timestamp: nowTs, level: percentage, isCharging: isAC },
        ];

  const svgWidth = 148;
  const svgHeight = 60;
  const paddingX = 8;
  const paddingTop = 8;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop * 2;

  const points = displayHistory.map((pt, idx) => ({
    ...pt,
    x: paddingX + (idx / Math.max(1, displayHistory.length - 1)) * chartWidth,
    y: paddingTop + (1 - (pt.level || 0) / 100) * chartHeight,
  }));

  const chunks = [];
  let currentChunk = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prevPt = points[i - 1];
    const currPt = points[i];

    if (currPt.isCharging === prevPt.isCharging) {
      currentChunk.push(currPt);
    } else {
      currentChunk.push(currPt);
      chunks.push({
        points: currentChunk,
        isCharging: prevPt.isCharging,
      });
      currentChunk = [currPt];
    }
  }
  if (currentChunk.length > 1) {
    chunks.push({
      points: currentChunk,
      isCharging: points[points.length - 1].isCharging,
    });
  }

  const y100 = paddingTop;
  const y0 = paddingTop + chartHeight;

  const startTime = formatTime(displayHistory[0]?.timestamp);
  const midTime = formatTime(
    displayHistory[Math.floor(displayHistory.length / 2)]?.timestamp,
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.percentage}>
          <p>{percentage}%</p>
          {isAC && (
            <svg
              height={33}
              width={32}
              fill="#ffdd00"
              style={{ rotate: "-10deg" }}
            >
              <g transform="matrix(1,0,0,1,-222,-111)">
                <g transform="matrix(0.965926,0.258819,-0.258819,0.965926,88.8612,-235.968)">
                  <path d="M240,299C240,298.562 239.715,298.175 239.297,298.045C238.878,297.915 238.424,298.073 238.176,298.433L228.176,313.433C227.966,313.739 227.942,314.137 228.115,314.466C228.288,314.794 228.629,315 229,315L236,315C236,315 236,325 236,325C236,325.438 236.285,325.825 236.703,325.955C237.122,326.085 237.576,325.927 237.824,325.567L247.824,310.567C248.034,310.261 248.058,309.863 247.885,309.534C247.712,309.206 247.371,309 247,309L240,309C240,309 240,299 240,299Z" />
                </g>
              </g>
            </svg>
          )}
        </div>
        <div style={styles.statusRow}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            style={{ flexShrink: 0 }}
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              fill="none"
              stroke="#ffffff33"
              strokeWidth="2"
            />
            <circle
              cx="7"
              cy="7"
              r="5.5"
              fill="none"
              stroke={isAC ? "#0A84FFcc" : "#30D158cc"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 2 * Math.PI * 5.5} ${2 * Math.PI * 5.5}`}
              transform="rotate(-90 7 7)"
            />
          </svg>
          <span
            style={{
              ...styles.statusText,
              color: "#ffffff80",
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      <div style={styles.chartContainer}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={styles.svg}
        >
          <defs>
            {/* Stroke gradients (left-to-right) */}
            <linearGradient
              id="batteryGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={svgWidth}
              y2="0"
            >
              <stop offset="0%" stopColor="#30D158" />
              <stop offset="100%" stopColor="#5FE878" />
            </linearGradient>

            <linearGradient
              id="chargingGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={svgWidth}
              y2="0"
            >
              <stop offset="0%" stopColor="#0A84FF" />
              <stop offset="100%" stopColor="#0073ff" />
            </linearGradient>

            <linearGradient
              id="batteryAreaGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={y100}
              x2="0"
              y2={y0}
            >
              <stop offset="0%" stopColor="#30D158" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#30D158" stopOpacity="0" />
            </linearGradient>

            <linearGradient
              id="chargingAreaGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={y100}
              x2="0"
              y2={y0}
            >
              <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            x1="0"
            y1={y100}
            x2={svgWidth}
            y2={y100}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="3 3"
          />
          <line
            x1="0"
            y1={y0}
            x2={svgWidth}
            y2={y0}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="3 3"
          />

          {chunks.map((chunk, idx) => {
            const linePath = getSmoothPath(chunk.points);
            const first = chunk.points[0];
            const last = chunk.points[chunk.points.length - 1];

            // Close the shape: line path -> down to baseline -> back to start -> close
            const areaPath = `${linePath} L ${last.x.toFixed(1)},${y0} L ${first.x.toFixed(1)},${y0} Z`;

            const strokeGradientId = chunk.isCharging
              ? "chargingGradient"
              : "batteryGradient";
            const areaGradientId = chunk.isCharging
              ? "chargingAreaGradient"
              : "batteryAreaGradient";

            return (
              <g key={idx}>
                <path
                  d={areaPath}
                  fill={`url(#${areaGradientId})`}
                  stroke="none"
                />

                <path
                  d={linePath}
                  fill="none"
                  stroke={`url(#${strokeGradientId})`}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>
        <div style={styles.labelColumn}>
          <span style={styles.text}>100%</span>
          <span style={styles.text}>0%</span>
        </div>
      </div>

      <div style={styles.footer}>
        <span>{startTime}</span>
        <span>{midTime}</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export const className = `
  top: 20px;
  right: 20px;
  user-select: none;
`;

const styles = {
  container: {
    position: "relative",
    width: 200,
    height: 180,
    backgroundColor: "#111111",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    color: "#FFFFFF",
    userSelect: "none",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  percentage: {
    fontSize: "34px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
  },
  statusText: {
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chartContainer: {
    position: "relative",
    width: "100%",
    height: "70px",
    flexShrink: 0,
    margin: "2px 0",
  },
  svg: {
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
    right: 40,
    bottom: 0,
    width: "80%",
    height: "100%",
  },
  labelColumn: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "36px",
    padding: "5px 0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  text: {
    fontSize: 9,
    margin: 0,
    color: "#ffffff66",
    lineHeight: 1,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    fontWeight: "500",
    width: "80%",
    color: "#ffffff66",
    flexShrink: 0,
  },
};

export const height = 180;
export const width = 200;
