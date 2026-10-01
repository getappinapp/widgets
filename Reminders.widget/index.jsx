const { useState, useMemo } = React;
import { Loader2 } from "lucide-react";

function parseReminders(output) {
  if (!output) return [];
  const blocks = output
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const listMatch = block.match(/LIST:\s*(.+)/);
    const taskMatch = block.match(/Task:\s*(.+)/);
    const dueMatch = block.match(/Due:\s*(.+)/);
    const priorityMatch = block.match(/Priority:\s*(.+)/);
    const notesMatch = block.match(/Notes:\s*(.+)/);

    const clean = (v) => {
      if (!v) return null;
      const trimmed = v.trim();
      if (
        !trimmed ||
        /^missing value$/i.test(trimmed) ||
        /^none$/i.test(trimmed) ||
        /^no due date$/i.test(trimmed)
      ) {
        return null;
      }
      return trimmed;
    };

    return {
      list: clean(listMatch && listMatch[1]) || "Unknown",
      task: clean(taskMatch && taskMatch[1]) || "Untitled",
      due: clean(dueMatch && dueMatch[1]),
      priority: clean(priorityMatch && priorityMatch[1]),
      notes: clean(notesMatch && notesMatch[1]),
    };
  });
}

// Reformat AppleScript's verbose date string (e.g. "Thursday, 24 July 2025 at 18:00:00")
// into "18:00, 24 July"
function formatDue(due) {
  if (!due) return null;
  const timeMatch = due.match(/(\d{1,2}):(\d{2}):\d{2}/);
  const dayMatch = due.match(/(\d{1,2})\s+([A-Za-z]+)\s+\d{4}/);
  if (!dayMatch) return due;
  const dateLabel = `${dayMatch[1]} ${dayMatch[2]}`;
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, "0");
    const minutes = timeMatch[2];
    if (hours === "00" && minutes === "00") {
      return dateLabel;
    }
    return `${hours}:${minutes}, ${dateLabel}`;
  }
  return dateLabel;
}

const RemindersWidget = ({ output, error }) => {

  const [manualOutput, setManualOutput] = useState(null);

  const reminders = useMemo(
    () => parseReminders(manualOutput ?? output),
    [output, manualOutput],
  );

  const isLoading =
    !error && manualOutput === null && (output === undefined || output === null || output === "");

  if (isLoading) {
    return (
      <div className="reminders-widget reminders-loading">
        <Loader2 className="reminders-spinner-icon" size={22} strokeWidth={2} />
      </div>
    );
  }

  if (error && !manualOutput) {
    return (
      <div className="reminders-widget reminders-error">
        Couldn't read Reminders. Check Automation permissions.
      </div>
    );
  }

  const hasOutputError =
    !manualOutput &&
    typeof output === "string" &&
    /access denied|timeout|error/i.test(output);

  if (hasOutputError) {
    return (
      <div className="reminders-widget reminders-error">
        Couldn't read Reminders. Check Automation permissions.
      </div>
    );
  }

  return (
    <div className="reminders-widget">
      {reminders.length === 0 && (
        <div className="reminders-empty">Nothing pending</div>
      )}
      {reminders.map((r, idx) => {
        const dueLabel = formatDue(r.due);
        return (
          <div className="reminders-item" key={idx}>
            <div className="reminders-bar" />
            <div className="reminders-item-content">
              <div className="reminders-task">{r.task}</div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {dueLabel && (
                  <div className="reminders-subtitle date">{dueLabel}</div>
                )}
                {r.notes && <div className="reminders-subtitle">{r.notes}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RemindersWidget;

export const className = `
.reminders-widget {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  background: transparent;
  color: #e5e5e5;
  height: 200px;
  width: 350px;
  box-sizing: border-box;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reminders-widget::-webkit-scrollbar {
  width: 5px;
}

.reminders-widget::-webkit-scrollbar-thumb {
  background: #ffffff26;
  border-radius: 4px;
}

.reminders-empty {
  color: #ffffff73;
  font-size: 15px;
  padding: 8px 4px;
}

.reminders-error {
  color: #f87171;
  font-size: 13px;
}

.reminders-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.reminders-spinner-icon {
  color: #ffffffd9;
  animation: reminders-spin 0.9s linear infinite;
}

@keyframes reminders-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.reminders-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 3px 0;
  border-left: 2px solid #ffffff90;
}

.reminders-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.reminders-task {
  font-size: 17px;
  font-weight: 500;
  color: #d3d3d3;
  line-height: 1.2;
}

.reminders-subtitle {
  font-size: 14px;
  font-weight: 400;
  color: #ffffff80;
  line-height: 1.2;
}
  
.date{
  background: #ffffff10;
  padding: 3px 5px;
  border-radius: 5px;
  width: fit-content;
  display: inline;
  font-size: 12px;
}
`;

export const command = "osascript -l JavaScript ./remind.js 2>&1";
export const refreshFrequency = 60000;
export const width = 350;
export const height = 130;
export const x = 10;
export const y = 425;