import { useEffect, useState } from "react";

const githubUsername = "developerbola";
const githubToken = ""

export const width = 399;
export const height = 125;
export const x = 10;
export const y = 20;

export const refreshFrequency = 3600000;

export const className = `

.github-widget,
.github-widget:hover {
  cursor: none !important;
}

.github-widget:hover *,
.github-widget * {
  cursor: none !important;
}

.github-widget {
  background: #111;
  padding: 12px;
  height: 100vh;
  width: 100vw;
  border-radius: 10px;
  webkit-user-select: none;
  pointer-events: none;
}

.github-grid {
  display: grid;
  grid-template-rows: repeat(7, 14px);
  grid-auto-flow: column;
  grid-auto-columns: 14px;
  gap: 1px;
  justify-content: start;
  align-items: start;
}

.github-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: #22222290;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 600;
  color: white;
  transition: transform 0.15s ease;
  pointer-events: auto;
}

.github-cell::after {
  content: attr(data-commit);
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  color: white;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.github-cell:hover::after {
  opacity: 1;
}

.github-cell:hover {
  transform: scale(1.8);
  border: 1px solid #ffffff20;
  z-index: 10;
}

.skeleton {
  background: #22222290;
}
`;

const getColor = (count) => {
  if (count === 0) return "#22222290";
  if (count < 5) return "#0e4429";
  if (count < 10) return "#006d32";
  if (count < 20) return "#26a641";
  return "#39d353";
};

const getOrdinal = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] || "th";
};

const formatDate = (isoDate) => {
  const d = new Date(isoDate);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month} ${day}${getOrdinal(day)} ${isToday ? "(today)" : ""}`;
};

export default function GithubWidget() {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = new Date().getFullYear();

  const load = async () => {
    setLoading(true);
    try {
      const query = `
      {
        user(login: "${githubUsername}") {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }`;

      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();
      setWeeks(
        json.data.user.contributionsCollection.contributionCalendar.weeks,
      );
      setError(null);
    } catch {
      setError("Failed to load GitHub contributions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, refreshFrequency);
    return () => clearInterval(id);
  }, []);

  const columns = Math.floor((width - 24) / 15);

  if (loading) {
    return (
      <div className="github-widget">
        <div className="github-grid">
          {Array.from({ length: columns }).map((_, x) =>
            Array.from({ length: 7 }).map((_, y) => (
              <div key={`${x}-${y}`} className="github-cell skeleton" />
            )),
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="github-widget">{error}</div>;
  }

  const firstYearWeekIndex = weeks.findIndex((week) =>
    week.contributionDays.some(
      (day) => new Date(day.date).getFullYear() === currentYear,
    ),
  );

  const yearWeeks =
    firstYearWeekIndex === -1 ? [] : weeks.slice(firstYearWeekIndex);

  const normalizedWeeks = yearWeeks.map((week) => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const day = week.contributionDays[i];
      if (!day) {
        return { contributionCount: 0, isOutOfYear: true };
      }

      const year = new Date(day.date).getFullYear();
      if (year !== currentYear) {
        return {
          ...day,
          contributionCount: 0,
          isOutOfYear: true,
        };
      }

      return {
        ...day,
        isOutOfYear: false,
      };
    });

    return { days };
  });

  const displayWeeks = [...normalizedWeeks.slice(0, columns)];

  while (displayWeeks.length < columns) {
    displayWeeks.push({
      days: Array.from({ length: 7 }).map(() => ({
        contributionCount: 0,
        isOutOfYear: true,
      })),
    });
  }

  return (
    <div className="github-widget">
      <div className="github-grid">
        {displayWeeks.map((week, x) =>
          week.days.map((day, y) => (
            <div
              key={`${x}-${y}`}
              className="github-cell"
              title={
                day.date && !day.isOutOfYear
                  ? `${day.contributionCount} on ${formatDate(day.date)}`
                  : ""
              }
              data-commit={
                day.contributionCount > 0 ? day.contributionCount : ""
              }
              style={{
                backgroundColor: getColor(day.contributionCount),
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}
