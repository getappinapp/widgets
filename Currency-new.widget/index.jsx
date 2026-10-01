export const command = `./rates.sh`;
export const refreshFrequency = 60 * 1000 * 60 * 24;

const Currency = ({ output, error }) => {
  const styles = {
    wrapper: {
      color: "white",
      fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
      userSelect: "none",
      cursor: "default",
      fontWeight: 300,
      borderRadius: 10,
      width: 245,
      height: 80,
      background: "#111",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 7px 0 10px",
      position: "relative",
      overflow: "hidden",
    },
    infoSection: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    currencyPair: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      color: "#ffffff90",
      textTransform: "uppercase",
    },
    dateBadge: {
      fontSize: 9,
      color: "#ffffff70",
    },
    rateDisplay: {
      display: "flex",
      alignItems: "baseline",
      gap: 5,
    },
    rateValue: {
      fontSize: 17,
      fontWeight: 400,
      color: "#ffffff",
      lineHeight: 1,
      letterSpacing: -0.5,
    },
    currencyLabel: {
      fontSize: 11,
      color: "#ffffff90",
      fontWeight: 400,
      letterSpacing: 0.3,
    },
    metricsRow: {
      display: "flex",
      alignItems: "center",
      justifyItem: "center",
      gap: 5,
    },
    metricLabel: {
      fontSize: 10,
      color: "#ffffff90",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    metricValue: {
      fontSize: 10,
      color: "#ffffffcc",
      fontWeight: 400,
    },
    chartSection: {
      background: "#141414",
      border: "1px solid #222",
      width: 115,
      height: 65,
      borderRadius: 5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    chartGrid: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      height: "100%",
    },
    chartBar: (color, height, translateY) => ({
      width: 5,
      height,
      borderRadius: 2.5,
      background: color,
      opacity: 0.85,
      transform: `translateY(${translateY}px)`,
      transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      position: "relative",
    }),
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      gap: 10,
    },
    spinner: {
      width: 28,
      height: 28,
      position: "relative",
    },
    spinnerRing: (delay, color) => ({
      position: "absolute",
      width: "100%",
      height: "100%",
      border: "2px solid transparent",
      borderTopColor: color,
      borderLeftolor: color,
      borderRadius: "50%",
      animation: `spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite`,
      animationDelay: delay,
    }),
    errorText: {
      fontSize: 10,
      color: "rgba(239, 68, 68, 0.85)",
      letterSpacing: 0.3,
    },
  };

  if (
    !output ||
    !output.includes(":") ||
    output.split("!!").every((pair) => pair.includes("N/A"))
  ) {
    return (
      <div style={styles.wrapper}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}>
            <div style={styles.spinnerRing("0s", "#ffffff")} />
            <div style={styles.spinnerRing("0.35s", "#ffffff")} />
            <div style={styles.spinnerRing("0.65s", "#ffffff")} />
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
        </div>
      </div>
    );
  }

  try {
    const pairs = output.split("!!");
    const rateData = pairs
      .map((pair) => {
        const [date, rate, diff] = pair.split(":");
        if (rate === "N/A" || !rate) return null;
        return { date, rate: parseFloat(rate), diff: parseFloat(diff) || 0 };
      })
      .filter(Boolean);

    if (rateData.length === 0) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.loadingContainer}>
            <p style={styles.errorText}>No valid data available</p>
          </div>
        </div>
      );
    }

    const todays = rateData[0] || { date: "", rate: 0, diff: 0 };

    const formatRate = (rate) => {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rate);
    };

    const formatDate = (dateStr) => {
      const [year, month, day] = dateStr.split("-");
      return `${day}.${month}.${year}`;
    };

    const getDiffColor = (diff) => {
      if (diff > 0) return "#10b981";
      if (diff < 0) return "#ef4444";
      return "#6b7280";
    };

    const getDiffIcon = (diff) => {
      if (diff > 0) return "↑";
      if (diff < 0) return "↓";
      return "→";
    };

    const getBarHeight = (rate) => {
      const average = calculateAverage();
      const maxDeviation = Math.max(
        ...rateData.map((item) => Math.abs(item.rate - average)),
      );
      const deviation = Math.abs(rate - average);
      const normalizedHeight = maxDeviation > 0 ? deviation / maxDeviation : 0;
      return 8 + normalizedHeight * 28;
    };

    const getBarTranslate = (rate) => {
      const average = calculateAverage();
      const deviation = rate - average;
      const maxDeviation = Math.max(
        ...rateData.map((item) => Math.abs(item.rate - average)),
      );
      const normalizedDeviation =
        maxDeviation > 0 ? deviation / maxDeviation : 0;
      return normalizedDeviation * -12;
    };

    const changeBadgeStyle = {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontSize: 10,
      fontWeight: 500,
      color: getDiffColor(todays.diff),
    };

    return (
      <div style={styles.wrapper}>
        <div style={styles.infoSection}>
          <div style={styles.header}>
            <span style={styles.dateBadge}>{formatDate(todays.date)}</span>
          </div>

          <div style={styles.rateDisplay}>
            <span style={styles.rateValue}>{formatRate(todays.rate)}</span>
            <span style={styles.currencyLabel}>UZS</span>
          </div>

          <span style={changeBadgeStyle}>
            <span style={{ fontSize: 9, lineHeight: 1 }}>
              {getDiffIcon(todays.diff)}
            </span>
            {Math.abs(todays.diff).toFixed(2)}%
          </span>
        </div>

        <div style={styles.chartSection}>
          <Chart data={rateData} />
        </div>
      </div>
    );
  } catch (err) {
    console.error("Error rendering currency widget:", err);
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingContainer}>
          <p style={styles.errorText}>Render error: {err.message}</p>
        </div>
      </div>
    );
  }
};

export default Currency;
import { useState } from "react";

const Chart = ({ data }) => {
  const width = 115;
  const height = 65;
  const paddingX = 0;
  const paddingY = 10;

  const [hoverIndex, setHoverIndex] = useState(null);

  const chronological = data.slice().reverse();
  const values = chronological.map((d) => d.rate);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = chronological.map((d, i) => {
    const x =
      (i / (chronological.length - 1 || 1)) * (width - paddingX * 2) + paddingX;
    const y =
      height - paddingY - ((d.rate - min) / range) * (height - paddingY * 2);
    return { ...d, x, y };
  });

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const area =
    line +
    ` L ${points[points.length - 1].x} ${height}` +
    ` L ${points[0].x} ${height} Z`;

  const formatRate = (rate) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rate);

  const formatDate = (dateStr) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const [year, month, day] = dateStr.split("-");
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
  };

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  };

  const handleLeave = () => setHoverIndex(null);

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  const tooltipWidth = 58;
  const tooltipOnLeft = hovered && hovered.x > width - tooltipWidth - 4;

  return (
    <div style={{ position: "relative", width, height }}>
      <svg
        width={width}
        height={height}
        style={{ overflow: "visible", cursor: "crosshair" }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <path d={area} fill="rgba(255,255,255,0.12)" />
        <path
          d={line}
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1={0}
              x2={hovered.x}
              y2={height}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r="3"
              fill="#fff"
              stroke="#111"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>

      {hovered && (
        <div
          style={{
            position: "absolute",
            top: 3,
            left: tooltipOnLeft ? hovered.x - tooltipWidth - 4 : hovered.x + 4,
            width: tooltipWidth,
            backdropFilter: "blur(10px)",
            color: "##fff",
            borderRadius: 4,
            padding: "3px 5px",
            fontSize: 8,
            lineHeight: 1.3,
            pointerEvents: "none",
            boxShadow: "0 2px 8px #00000073",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 7.5 }}>{formatDate(hovered.date)}</div>
          <div style={{ fontWeight: 700 }}>{formatRate(hovered.rate)}</div>
        </div>
      )}
    </div>
  );
};
export const y = 555;
export const x = 10;
export const height = 80;
export const width = 245;
