const SPLIT = {
  left: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPg0KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGQ9Ik04LjQ0ODY4IDcuMzE2MjNDOC42MjMzMyA2Ljc5MjI4IDguMzQwMTcgNi4yMjU5NiA3LjgxNjIzIDYuMDUxMzJDNy4yOTIyOCA1Ljg3NjY3IDYuNzI1OTYgNi4xNTk4MyA2LjU1MTMyIDYuNjgzNzdDNi4xNTgzNCA3Ljg2MjcxIDYuMTU4MzQgOS4xMzcyOSA2LjU1MTMyIDEwLjMxNjJDNi43MjU5NiAxMC44NDAyIDcuMjkyMjggMTEuMTIzMyA3LjgxNjIzIDEwLjk0ODdDOC4zNDAxNyAxMC43NzQgOC42MjMzMyAxMC4yMDc3IDguNDQ4NjggOS42ODM3N0M4LjE5MjU1IDguOTE1MzcgOC4xOTI1NSA4LjA4NDYzIDguNDQ4NjggNy4zMTYyM1oiIGZpbGw9IiMwRjE3MjkiLz4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTAgMS40MTM2NEM1LjYwOTQ0IDEuNDEzNjQgMy4wMDAwMiA0LjY3ODc2IDMgOC4xMjY1N0wzIDguODEzNjNDMyA5LjYzNzMxIDMuMjI4MjIgMTAuNzUzNSAzLjQ3ODI5IDExLjc2NjhDMy43MTQ1NCAxMi43MjQxIDMuOTk1NDcgMTMuNjg1MSA0LjIwMDE3IDE0LjM4NTNMNC4yNTE3OSAxNC41NjJDNC42ODQ4MSAxNi4wNDU4IDYuMDQ3NTcgMTkuNjUyNiA2LjU3MjMzIDIwLjk0MjhDNy4xMzUwNCAyMi4zMjY0IDguNjgzNjQgMjIuOTc0IDEwLjA3NjQgMjIuNjMxNEMxMS43NTEgMjIuMjE5NCAxMi43ODkyIDIwLjQ4OTMgMTIuMTI4MSAxOC44NDEzQzExLjc2MyAxNy45MzExIDExLjAwNzkgMTUuOTIzIDEwLjQ4NjMgMTQuNDIzNEMxMC42MTk3IDE0LjQyODggMTAuNzUzOSAxNC40MzE1IDEwLjg4ODkgMTQuNDMxNUMxMi44NTg4IDE0LjQzMTUgMTQuNjg1MiAxMy44NTY5IDE2LjA4ODIgMTIuODc2OEMxNi45MTIxIDEzLjQ5ODcgMTguMDczMyAxMy42NTkxIDE5LjA5OTEgMTMuMDgxNkwyMC4zNDQzIDEyLjM4MDZDMjEuMzY3MSAxMS44MDQ4IDIyIDEwLjcyMjMgMjIgOS41NDg1NFY2LjM4Nzg0QzIyIDUuMjE0MTIgMjEuMzY3MSA0LjEzMTU4IDIwLjM0NDMgMy41NTU3OEwxOS4wOTkxIDIuODU0NzNDMTcuOTUyOCAyLjIwOTQyIDE2LjYzNzMgMi40ODU1NiAxNS44MTI0IDMuMjk3NDRDMTQuMTk0NCAyLjE1NTU4IDEyLjA4NyAxLjQxMzY0IDEwIDEuNDEzNjRaTTE3IDguOTU0NTVDMTcgOC45NTMwNSAxNyA4Ljk1MTU5IDE3IDguOTUwMTdMMTcgNS4yNDgzMkMxNy4wMDIgNC42NzYxOSAxNy42MTg4IDQuMzE2NTQgMTguMTE3OSA0LjU5NzU0TDE5LjM2MzIgNS4yOTg1OUMxOS43NTY2IDUuNTIwMDUgMjAgNS45MzY0MSAyMCA2LjM4Nzg0VjkuNTQ4NTRDMjAgOS45OTk5NyAxOS43NTY2IDEwLjQxNjMgMTkuMzYzMiAxMC42Mzc4TDE4LjExNzkgMTEuMzM4OEMxNy42MTggMTEuNjIwMyAxNyAxMS4yNTkgMTcgMTAuNjg1M1Y4Ljk1NDU1Wk0xNSA1LjI0NThWNS4xODY3N0MxMy42Njc1IDQuMTI2NDcgMTEuNzk3NiAzLjQxMzY0IDEwIDMuNDEzNjRDNi43ODEzMyAzLjQxMzY0IDUuMDAwMDEgNS43MTQ3OSA1IDguMTI2NTdMNSA4LjgxMzY0QzUgOS4zNjcxOSA1LjE2ODcxIDEwLjI2OTIgNS40MjAwNCAxMS4yODc2QzUuNjQ1NTUgMTIuMjAxNSA1LjkxNDk4IDEzLjEyMzMgNi4xMjA4MyAxMy44Mjc1TDYuMTcxNyAxNC4wMDE2QzYuNTc0NDEgMTUuMzgxNiA3LjkwNDMzIDE4LjkwOTIgOC40MjQ5NiAyMC4xODk0QzguNTY3MTIgMjAuNTM4OSA5LjA0NTEyIDIwLjgyNTUgOS41OTg1OSAyMC42ODkzQzEwLjIyMDYgMjAuNTM2MyAxMC40MzI2IDE5Ljk4NjUgMTAuMjcxOSAxOS41ODU5QzkuNzY4MzggMTguMzMwOCA4LjUwNjA3IDE0Ljk0OTggOC4xMTU0OSAxMy42MTE0QzcuODg5MzIgMTIuODM2MyA4LjU3Mjg5IDEyLjEyNDggOS4zMzkyOCAxMi4yNzkxQzkuODMxODggMTIuMzc4MiAxMC4zNTEyIDEyLjQzMTUgMTAuODg4OSAxMi40MzE1QzEyLjQyMzcgMTIuNDMxNSAxMy43OTgzIDExLjk5ODIgMTQuODI5MyAxMS4zMTQ1TDE0LjgzNDEgMTEuMjg0NkMxNC44NyAxMS4wNTQ3IDE0LjkwMTUgMTAuNzQwNyAxNC45MjcyIDEwLjQwMThDMTQuOTc4MiA5LjcyOTQ0IDE0Ljk5OTYgOS4wNTc3NSAxNSA4Ljk1MzAyVjUuMjUxMDlDMTUgNS4yNDkzMyAxNSA1LjI0NzU2IDE1IDUuMjQ1OFoiIGZpbGw9IiMwRjE3MjkiLz4NCjwvc3ZnPg==",
  case: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPg0KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGQ9Ik0yLjYyMDEyIDE1Ljc1VjguMjVDMi42MjAxMiA3LjQ4IDIuNjUwMTIgNi43OSAyLjczMDEyIDYuMThDMy4xMDAxMiAyLjg5IDQuNjUwMTIgMiA4Ljg4MDEyIDJIMTUuMTMwMUMxOS4zNTAxIDIgMjAuOTEwMSAyLjg5IDIxLjI3MDEgNi4xOEMyMS4zNjAxIDYuNzkgMjEuMzgwMSA3LjQ4IDIxLjM4MDEgOC4yNVYxNS43NUMyMS4zODAxIDE2LjUyIDIxLjM1MDEgMTcuMjEgMjEuMjcwMSAxNy44M0MyMC45MDAxIDIxLjExIDE5LjM1MDEgMjIgMTUuMTIwMSAyMkg4Ljg4MDEyQzQuNjYwMTIgMjIgMy4xMDAxMiAyMS4xMSAyLjc0MDEyIDE3LjgzQzIuNjUwMTIgMTcuMjEgMi42MjAxMiAxNi41MiAyLjYyMDEyIDE1Ljc1WiIgc3Ryb2tlPSIjMjkyRDMyIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+DQo8cGF0aCBkPSJNMjEuMjI5OSA4LjkyMDA0SDE3LjEyOTkiIHN0cm9rZT0iIzI5MkQzMiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPg0KPHBhdGggZD0iTTYuODcwMDIgOC45MjAwNEgyLjc3MDAyIiBzdHJva2U9IiMyOTJEMzIiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4NCjxwYXRoIGQ9Ik0xNy4xMzAxIDguOTJDMTcuMTMwMSAxMC4wNSAxNi4yMTAxIDEwLjk3IDE1LjA4MDEgMTAuOTdIOC45MjAxMkM4LjM2MDEyIDEwLjk3IDcuODQwMTIgMTAuNzQgNy40NzAxMiAxMC4zNkM3LjEwMDEyIDkuOTk5OTkgNi44NzAxMiA5LjQ5IDYuODcwMTIgOC45MkM2Ljg3MDEyIDcuNzkgNy43OTAxMiA2Ljg3IDguOTIwMTIgNi44N0gxNS4wNzAxQzE1LjYzMDEgNi44NyAxNi4xNTAxIDcuMSAxNi41MjAxIDcuNDhDMTYuOTAwMSA3Ljg1IDE3LjEzMDEgOC4zNiAxNy4xMzAxIDguOTJaIiBzdHJva2U9IiMyOTJEMzIiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4NCjwvc3ZnPg==",
};

const pctToNum = (v) => {
  if (v == null) return null;
  const n = Number(
    String(v)
      .trim()
      .match(/^(\d+(?:\.\d+)?)\s*%?$/)?.[1],
  );
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : null;
};

const levelColor = (l) =>
  l == null
    ? "transparent"
    : l <= 15
      ? "#e02c33"
      : l <= 30
        ? "#e6c000"
        : "#00b825";

const parseBluetoothJSON = (raw) => {
  if (!raw) return { device: null, invalid: false };
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    const controllers = data?.SPBluetoothDataType;
    if (!Array.isArray(controllers)) return { device: null, invalid: true };
    const devices = [];
    for (const ctrl of controllers) {
      const conn = ctrl?.device_connected;
      if (!Array.isArray(conn)) continue;
      for (const entry of conn) {
        if (!entry || typeof entry !== "object") continue;
        for (const [name, info] of Object.entries(entry)) {
          if (!info || typeof info !== "object") continue;
          const d = {
            name: name || "Bluetooth Device",
            left: pctToNum(info.device_batteryLevelLeft),
            right: pctToNum(info.device_batteryLevelRight),
            caseLvl: pctToNum(info.device_batteryLevelCase),
            single: pctToNum(info.device_batteryLevel),
          };
          if ([d.left, d.right, d.caseLvl, d.single].some((v) => v != null))
            devices.push(d);
        }
      }
    }
    const device =
      devices.find((d) => /airpods/i.test(d.name)) ||
      devices.find(
        (d) => d.left != null || d.right != null || d.caseLvl != null,
      ) ||
      devices[0] ||
      null;
    return { device, invalid: false };
  } catch {
    return { device: null, invalid: true };
  }
};

const AirPlayIcon = ({ size = 24 }) => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <g stroke="currentColor" strokeWidth="1.65" strokeLinecap="round">
      <path d="M6.1 23.9a13 13 0 1 1 19.8 0" />
      <path d="M8.9 21.4a9.3 9.3 0 1 1 14.2 0" />
      <path d="M11.7 18.8a5.5 5.5 0 1 1 8.6 0" />
    </g>
    <path d="M16 18.2 26 29H6Z" fill="currentColor" />
  </svg>
);

const THEMES = {
  light: {
    card: "#e4e8ec",
    cardBorder: "#ffffff50",
    text: "#101214",
    subtext: "#6e6e6e",
    pillBg: "#c4c9cf50",
    badgeBg: "#f5f5f7",
    iconFilter: "brightness(0)",
  },
  dark: {
    card: "#161616",
    cardBorder: "#ffffff10",
    text: "#f5f5f7",
    subtext: "#98989f",
    pillBg: "#ffffff20",
    badgeBg: "#0b0b0baf",
    iconFilter: "brightness(0) invert(1)",
  },
};

const useTheme = () => {
  const [dark, setDark] = React.useState(
    () => window?.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );
  React.useEffect(() => {
    if (!window?.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setDark(e.matches);
    mq.addEventListener?.("change", fn) ?? mq.addListener(fn);
    return () =>
      mq.removeEventListener?.("change", fn) ?? mq.removeListener(fn);
  }, []);
  return dark ? "dark" : "light";
};

const useReducedMotion = () => {
  const [r, setR] = React.useState(
    () =>
      window?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  React.useEffect(() => {
    if (!window?.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e) => setR(e.matches);
    mq.addEventListener?.("change", fn) ?? mq.addListener(fn);
    return () =>
      mq.removeEventListener?.("change", fn) ?? mq.removeListener(fn);
  }, []);
  return r;
};

const BatteryBar = ({ value, type, label, vars, reducedMotion, mirrored }) => {
  const color = levelColor(value);
  const pct = value ?? 0;
  return (
    <div
      role="img"
      aria-label={`${label}: ${value == null ? "unavailable" : `${value}%`}`}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
        background: vars.pillBg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 10px 5px 10px",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        maskImage: "radial-gradient(white, black)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: `${pct}%`,
          zIndex: 0,
          background: color,
          filter: "blur(4px)",
          transition: reducedMotion
            ? "none"
            : "height 500ms ease, background 500ms ease",
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.5px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value == null ? "\u2014" : `${value}%`}
      </span>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: 40,
          height: 40,
          borderRadius: "100%",
          background: vars.badgeBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 15,
        }}
      >
        <img
          src={SPLIT[type]}
          alt="icon"
          draggable={false}
          style={{
            width: 20,
            height: 20,
            objectFit: "contain",
            filter: vars.iconFilter,
            transform: mirrored ? "scaleX(-1)" : undefined,
          }}
        />
      </div>
    </div>
  );
};

const AirPodsBattery = ({ output, error }) => {
  const parsed = React.useMemo(() => parseBluetoothJSON(output), [output]);
  const info = parsed.device;
  const vars = THEMES[useTheme()];
  const reducedMotion = useReducedMotion();
  const failure = error || parsed.invalid;

  if (failure || !info) {
    return (
      <div
        role="status"
        style={{
          width: width,
          height: height,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 28,
          textAlign: "center",
          fontSize: 17,
          borderRadius: 28,
          background: vars.card,
          color: vars.text,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div>
          {failure
            ? "Unable to read Bluetooth data"
            : "No battery data available"}
        </div>
        <small style={{ fontSize: 12, lineHeight: 1.5, color: vars.subtext }}>
          {failure
            ? "Check Bluetooth access and try again."
            : "Connect your AirPods and open the case to refresh."}
        </small>
      </div>
    );
  }

  const hasSplit =
    info.left != null || info.right != null || info.caseLvl != null;

  const splitName = (() => {
    const i = info.name.toLowerCase().indexOf("airpods");
    if (i > 0) return [info.name.slice(0, i).trim(), info.name.slice(i)];
    return [info.name];
  })();

  return (
    <section
      aria-label={`${info.name} battery levels`}
      style={{
        width: width,
        height: height,
        boxSizing: "border-box",
        padding: "16px 14px 13px",
        overflow: "hidden",
        borderRadius: 28,
        background: vars.card,
        border: `1px solid ${vars.cardBorder}`,
        color: vars.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
        WebkitFontSmoothing: "antialiased",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          height: "35%",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 19,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "-0.4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineClamp: 1,
            }}
          >
            {splitName[0]}
          </div>
          {splitName[1] && (
            <div
              style={{
                fontSize: 19,
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: "-0.4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {splitName[1]}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
              fontSize: 13,
              fontWeight: 400,
              color: vars.subtext,
            }}
          >
            <span>Noise Cancellation</span>
          </div>
        </div>
        <span style={{ flex: "none", marginTop: 4, color: vars.text }}>
          <AirPlayIcon />
        </span>
      </header>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: "auto",
          height: "60%",
          overflow: "hidden",
        }}
      >
        {hasSplit ? (
          <>
            <BatteryBar
              value={info.left}
              type="left"
              label="Left AirPod"
              vars={vars}
              reducedMotion={reducedMotion}
            />
            <BatteryBar
              value={info.caseLvl}
              type="case"
              label="Charging case"
              vars={vars}
              reducedMotion={reducedMotion}
            />
            <BatteryBar
              value={info.right}
              type="left"
              label="Right AirPod"
              vars={vars}
              reducedMotion={reducedMotion}
              mirrored
            />
          </>
        ) : (
          <BatteryBar
            value={info.single}
            type="left"
            label="Device"
            vars={vars}
            reducedMotion={reducedMotion}
          />
        )}
      </div>
    </section>
  );
};

export default AirPodsBattery;
export const command = "system_profiler SPBluetoothDataType -json";
export const refreshFrequency = 30000;
export const width = 200;
export const height = 175;
