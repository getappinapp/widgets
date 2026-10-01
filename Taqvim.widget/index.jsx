export const width = 350;
export const height = 80;
export const y = 40;
export const x = 10;

export const refreshFrequency = 1000 * 60 * 1;

export const command = `curl -s "https://namoz-vaqti.uz/?format=json&lang=lotin&period=today&region=toshkent"`;

const ORDER = ["bomdod", "quyosh", "peshin", "asr", "shom", "xufton"];

export default function Taqvim({ output }) {
  let data = null;

  if (output) {
    try {
      data = JSON.parse(output);
    } catch {
      data = null;
    }
  }

  const loading = !data;

  const times = data?.today?.times || {};
  const labels = data?.labels || {};
  const meta = data?.meta;
  const current = loading ? null : activeKey(times, meta?.now);

  return (
    <div style={screen}>
      <style>{skeletonCSS}</style>
      <div style={widget}>
        <div style={topRow}>
          <span>
            {loading ? <Skeleton width={80} height={11} /> : meta?.region?.name}
          </span>
          <span style={{ textTransform: "capitalize" }}>
            {loading ? (
              <Skeleton width={90} height={11} />
            ) : (
              formatDate(meta?.date)
            )}
          </span>
        </div>

        <div style={timesRow}>
          {ORDER.map((k) => (
            <div key={k} style={column}>
              <div style={label}>
                {loading ? (
                  <Skeleton width={28} height={9} center />
                ) : (
                  shortLabel(labels[k])
                )}
              </div>
              <div
                style={{
                  ...time,
                  ...(k === current ? activeTime : {}),
                }}
              >
                {loading ? (
                  <Skeleton width={34} height={14} center />
                ) : (
                  times[k]
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Skeleton({ width, height, center }) {
  return (
    <span
      className="skeleton"
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: 4,
        verticalAlign: "middle",
        margin: center ? "0 auto" : 0,
      }}
    />
  );
}

const skeletonCSS = `
  .skeleton {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 37%, #2a2a2a 63%);
    background-size: 400% 100%;
    animation: skeleton-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skeleton-pulse {
    0% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;


function toMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function activeKey(times, now) {
  if (!now) return null;

  const n = toMin(now);
  const minutes = ORDER.map((k) => [k, toMin(times[k])]).filter(
    ([, m]) => !Number.isNaN(m),
  );

  if (!minutes.length) return null;

  for (let i = 0; i < minutes.length; i++) {
    const [key, start] = minutes[i];
    const [, nextStart] = minutes[(i + 1) % minutes.length];

    const end = nextStart <= start ? nextStart + 1440 : nextStart;
    const current = n < start ? n + 1440 : n;

    if (current >= start && current < end) return key;
  }

  return minutes[minutes.length - 1][0];
}

function shortLabel(t) {
  return t ? t.split(" ")[0] : "";
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

const screen = {
  width: width,
  height: height,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  WebkitUserSelect: "none",
  pointerEvents: "none",
};

const widget = {
  width: width,
  height: height,
  top: 100,
  left: 400,
  background: "#111",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#fff",
  fontFamily: "system-ui",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  opacity: 0.8,
  marginBottom: 6,
};

const timesRow = {
  display: "flex",
  justifyContent: "space-between",
};

const column = {
  textAlign: "center",
  minWidth: 40,
};

const label = {
  fontSize: 11,
  opacity: 0.7,
};

const time = {
  fontSize: 14,
  padding: "2px 6px",
  borderRadius: 999,
};

const activeTime = {
  background: "#0b5d2d",
  fontWeight: 600,
};
