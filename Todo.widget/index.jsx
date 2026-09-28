import React from "react";
import { Plus, Trash2, X, GripVertical } from "lucide-react";

export const width = 350;
export const height = 295;
export const y = 130;
export const x = 10;
export const refreshFrequency = 10000;

const STORAGE_KEY = "todo.widget:tasks";

function loadTasks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

export default function TodoWidget() {
  const [tasks, setTasks] = React.useState(loadTasks);
  const [value, setValue] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [focusId, setFocusId] = React.useState(null);
  const [draggingId, setDraggingId] = React.useState(null);
  const inputRef = React.useRef(null);
  const itemRefs = React.useRef({});
  const listRef = React.useRef(null);
  const dragInfo = React.useRef({ id: null, lastOverId: null });

  React.useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  React.useEffect(() => {
    if (dialogOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [dialogOpen]);

  React.useEffect(() => {
    if (focusId && itemRefs.current[focusId]) {
      itemRefs.current[focusId].focus();
    }
  }, [focusId]);

  const openDialog = () => setDialogOpen(true);

  const closeDialog = () => {
    setDialogOpen(false);
    setValue("");
  };

  const addTask = () => {
    const text = value.trim();
    if (!text) return;
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setTasks((prev) => [
      {
        id: newId,
        text,
        done: false,
      },
      ...prev,
    ]);
    setFocusId(newId);
    closeDialog();
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);

      if (next.length > 0) {
        const nextFocusIndex = Math.min(index, next.length - 1);
        setFocusId(next[nextFocusIndex].id);
      } else {
        setFocusId(null);
      }
      return next;
    });
  };

  const moveTask = (id, direction) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const reorderTasks = (sourceId, targetId) => {
    if (sourceId === targetId) return;
    setTasks((prev) => {
      const sourceIndex = prev.findIndex((t) => t.id === sourceId);
      const targetIndex = prev.findIndex((t) => t.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleItemKeyDown = (e, id) => {
    const currentIndex = tasks.findIndex((t) => t.id === id);

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (currentIndex > 0) {
        setFocusId(tasks[currentIndex - 1].id);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (currentIndex < tasks.length - 1) {
        setFocusId(tasks[currentIndex + 1].id);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveTask(id, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveTask(id, 1);
    } else if (e.key === "Enter" || e.code === "Space") {
      e.preventDefault();
      toggleTask(id);
    } else if (e.key === "Delete") {
      e.preventDefault();
      deleteTask(id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTask();
    if (e.key === "Escape") closeDialog();
  };

  const remaining = tasks.filter((t) => !t.done).length;

  const handleWidgetKeyDown = (e) => {
    if (dialogOpen) return;

    if (!focusId && tasks.length > 0) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusId(tasks[0].id);
      }
    }
  };

  const handlePointerMove = React.useCallback((e) => {
    const id = dragInfo.current.id;
    if (!id) return;

    const container = listRef.current;
    if (!container) return;

    // auto-scroll near edges
    const bounds = container.getBoundingClientRect();
    const edge = 24;
    if (e.clientY < bounds.top + edge) {
      container.scrollTop -= 8;
    } else if (e.clientY > bounds.bottom - edge) {
      container.scrollTop += 8;
    }

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const itemEl = el ? el.closest(".todo-item") : null;
    if (!itemEl) return;

    const overId = itemEl.getAttribute("data-id");
    if (!overId || overId === id || overId === dragInfo.current.lastOverId)
      return;

    dragInfo.current.lastOverId = overId;
    reorderTasks(id, overId);
  }, []);

  const handlePointerUp = React.useCallback(() => {
    dragInfo.current.id = null;
    dragInfo.current.lastOverId = null;
    setDraggingId(null);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    dragInfo.current.id = id;
    dragInfo.current.lastOverId = id;
    setDraggingId(id);
    setFocusId(id);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  React.useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div className="todo-widget" onKeyDown={handleWidgetKeyDown}>
      <div className="todo-header">
        <div className="todo-title-group">
          <span className="todo-title">Tasks</span>
          <span className="todo-count">{remaining} left</span>
        </div>
        <button
          className="todo-header-add"
          onClick={openDialog}
          aria-label="Add task"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="todo-empty">No tasks yet</div>
      ) : (
        <>
          <div className="todo-list" ref={listRef}>
            {tasks.map((t) => (
              <div
                className={
                  "todo-item" + (draggingId === t.id ? " dragging" : "")
                }
                key={t.id}
                data-id={t.id}
                tabIndex={0}
                role="checkbox"
                aria-checked={t.done}
                ref={(el) => {
                  if (el) itemRefs.current[t.id] = el;
                  else delete itemRefs.current[t.id];
                }}
                onClick={() => toggleTask(t.id)}
                onKeyDown={(e) => handleItemKeyDown(e, t.id)}
                onFocus={() => setFocusId(t.id)}
                style={{ opacity: t.done ? "40%" : 100 }}
              >
                <button
                  className={"todo-checkbox"}
                  aria-label="Toggle task"
                  tabIndex={-1}
                >
                  {t.done && (
                    <div
                      style={{
                        height: "74%",
                        width: "74%",
                        background: "#217efe",
                        borderRadius: 3,
                      }}
                    />
                  )}
                </button>
                <span className={"todo-text"}>{t.text}</span>
                <button
                  className="todo-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(t.id);
                  }}
                  tabIndex={-1}
                  aria-label="Delete task"
                >
                  <Trash2 size={13} />
                </button>
                <div
                  className="todo-drag-handle"
                  aria-label="Drag to reorder"
                  onPointerDown={(e) => handlePointerDown(e, t.id)}
                >
                  <GripVertical size={14} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {dialogOpen && (
        <div
          className="todo-dialog-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div className="todo-dialog">
            <div className="todo-dialog-header">
              <span className="todo-dialog-title">New task</span>
              <button
                className="todo-dialog-close"
                onClick={closeDialog}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="todo-dialog-row">
              <input
                ref={inputRef}
                className="todo-input"
                placeholder="What do you need to do?"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoCorrect="off"
              />
              <button
                className="todo-dialog-add-btn"
                onClick={addTask}
                disabled={!value.trim()}
                aria-label="Add task"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const className = `
  * {
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-touch-callout: none;
  }

  .todo-widget {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    max-height: 420px;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
    background: #111111;
    border: 1px solid #ffffff09;
    border-radius: 8px;
    color: #f2f2f4;
    overflow: hidden;
  }

  .todo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 10px 18px;
    flex-shrink: 0;
  }

  .todo-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .todo-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: #f2f2f4;
  }

  .todo-count {
    font-size: 11px;
    font-weight: 500;
    color: #f2f2f470;
    background: #232323;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .todo-header-add {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    border: none;
    background: #9cc1ff2e;
    color: #9cc1ff;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, transform 0.1s ease;
  }
    
  .todo-header-add *{
    cursor: pointer;
  }

  .todo-header-add:hover {
    background: #9cc1ff4d;
  }

  .todo-header-add:active {
    transform: scale(0.92);
  }

  .todo-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    max-height: 420px;
    overscroll-behavior: contain;
    padding: 2px 10px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .todo-item {
    display: flex;
    align-items: start;
    gap: 6px;
    padding: 5px;
    border-radius: 8px;
    transition: background 0.12s ease, opacity 0.12s ease;
    outline: none;
  }

  .todo-item:hover {
    background: #232323;
  }

  .todo-item.dragging {
    opacity: 0.5;
    background: #232323;
  }

  .todo-drag-handle {
    flex-shrink: 0;
    width: 16px;
    height: 18px;
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f2f2f450;
    touch-action: none;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  .todo-item:hover .todo-drag-handle,
  .todo-item:focus .todo-drag-handle,
  .todo-item.dragging .todo-drag-handle {
    opacity: 1;
  }

  .todo-checkbox {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 6px;
    border: 2px solid #217efe;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-top: 2px;
    transition: all 0.15s ease;
    background: transparent;
  }

  .todo-text {
    flex: 1;
    font-size: 15px;
    line-height: 1.3;
    color: #f2f2f4;
    word-break: break-word;
    cursor: default;
  }

  .todo-delete {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #ff8a8a;
    background: #ff64641a;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s ease, color 0.12s ease;
    border-radius: 6px;
  }

  .todo-item:hover .todo-delete {
    opacity: 1;
  }

  .todo-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #232323;
    padding: 30px 20px;
    text-align: center;
  }

  .todo-dialog-overlay {
    position: absolute;
    inset: 0;
    background: #111;
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 10;
    animation: todo-fade-in 0.15s ease;
  }

  .todo-dialog {
    width: 100%;
    background: #1;
    backdrop-filter: blur(20px);
    border-radius: 8px;
    padding: 14px;
    animation: todo-pop-in 0.15s ease;
  }

  .todo-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .todo-dialog-title {
    font-size: 13px;
    font-weight: 600;
    color: #f2f2f4cc;
  }

  .todo-dialog-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: #232323;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.12s ease, color 0.12s ease;
  }

  .todo-dialog-close:hover {
    background: #232323;
    color: #f2f2f4;
  }

  .todo-dialog-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .todo-input {
    flex: 1;
    background: #232323;
    outline: none;
    color: #f2f2f4;
    font-size: 13px;
    font-family: inherit;
    padding: 9px 10px;
    border-radius: 8px;
    transition: border-color 0.15s ease;
  }

  .todo-input::placeholder {
    color: #232323;
  }

  .todo-dialog-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: none;
    background: #9cc1ff2e;
    color: #9cc1ff;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .todo-dialog-add-btn:hover {
    background: #9cc1ff4d;
  }

  .todo-dialog-add-btn:active {
    transform: scale(0.92);
  }

  .todo-dialog-add-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  @keyframes todo-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes todo-pop-in {
    from { opacity: 0; transform: scale(0.96) translateY(4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;
