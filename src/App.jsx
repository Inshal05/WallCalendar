import React, { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoonStar,
  Sparkles,
  SunMedium,
} from "lucide-react";

import { CalendarGrid } from "./components/CalendarGrid";
import { NotesPanel } from "./components/NotesPanel";
import { featuredPhotoByMonth } from "./data/featuredPhotoData";
import { holidayMap } from "./data/holidayData";

import {
  addDays,
  describeScope,
  daysInMonth,
  formatDateKey,
  fromDateKey,
  getNextReminderOccurrence,
  isReminderDueOnDate,
  monthNames,
  reminderCategoryLabels,
  rangeLabel,
  sortPinnedFirst,
  startOfGrid,
  toDateKey,
  weekdayLabels,
  yearMonthKey,
} from "./utils/calendarUtils";

const STORAGE_KEY = "wall-calendar-react-pro-v4";

/* ───────── Helpers ───────── */

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStoredState() {
  if (typeof localStorage === "undefined") return null;

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function normalizeReminder(reminder) {
  if (!reminder || typeof reminder !== "object") return null;

  const text = typeof reminder.text === "string" ? reminder.text.trim() : "";
  const dateKey = typeof reminder.dateKey === "string" ? reminder.dateKey : "";
  const category = Object.hasOwn(reminderCategoryLabels, reminder.category)
    ? reminder.category
    : "personal";

  if (!text || !dateKey) return null;

  return {
    id: reminder.id || makeId(),
    text,
    dateKey,
    category,
    repeatsYearly: Boolean(reminder.repeatsYearly),
    createdAt:
      typeof reminder.createdAt === "string"
        ? reminder.createdAt
        : new Date().toISOString(),
  };
}

function normalizeReminderList(reminders) {
  if (!Array.isArray(reminders)) return [];

  return reminders.map(normalizeReminder).filter(Boolean);
}

function createInitialState() {
  const today = new Date();
  const saved = loadStoredState();
  const defaultViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const restoredReminders = normalizeReminderList(saved?.reminders);
  const restoredNotes = Array.isArray(saved?.notes) ? saved.notes : [];

  return {
    today,
    viewDate: saved?.viewDate ? fromDateKey(saved.viewDate) : defaultViewDate,
    rangeStart: saved?.rangeStart ? fromDateKey(saved.rangeStart) : null,
    rangeEnd: saved?.rangeEnd ? fromDateKey(saved.rangeEnd) : null,
    selectedDay: saved?.selectedDay
      ? fromDateKey(saved.selectedDay)
      : new Date(today),
    noteMode: saved?.noteMode ?? "range",
    notes: restoredNotes,
    reminders: restoredReminders,
    restoredItemCount: restoredNotes.length + restoredReminders.length,
    themeMode: saved?.themeMode ?? "auto",
    showHints: typeof saved?.showHints === "boolean" ? saved.showHints : true,
  };
}

function getThemePack(month, themeMode) {
  if (themeMode === "light") {
    return {
      title: "Paper Light",
      hero: "linear-gradient(145deg, #ffffff 0%, #f8fafc 48%, #fde68a 100%)",
    };
  }

  if (themeMode === "dark") {
    return {
      title: "Ink Dark",
      hero: "linear-gradient(145deg, #020617 0%, #0f172a 45%, #1e293b 100%)",
    };
  }

  if ([2, 3, 4].includes(month)) {
    return {
      title: "Spring Bloom",
      hero: "linear-gradient(165deg, #fffaf4 0%, #dceeff 28%, #b8f3d4 62%, #ffe29f 100%)",
    };
  }

  if ([5, 6, 7].includes(month)) {
    return {
      title: "Summer Light",
      hero: "linear-gradient(165deg, #f5fbff 0%, #b9e3ff 26%, #7dddf7 58%, #ffe18a 100%)",
    };
  }

  if ([8, 9, 10].includes(month)) {
    return {
      title: "Autumn Warmth",
      hero: "linear-gradient(165deg, #fff8ef 0%, #ffd3a5 30%, #f6aa4d 60%, #fce38a 100%)",
    };
  }

  return {
    title: "Winter Calm",
    hero: "linear-gradient(165deg, #f8fbff 0%, #cfe3ff 34%, #c7ebff 68%, #eef7ff 100%)",
  };
}

/* ───────── Small Components ───────── */

function SummaryCard({ label, value, helper }) {
  return (
    <div className="summary-card">
      <p className="summary-card__label">{label}</p>
      <p className="summary-card__value">{value}</p>
      <div className="summary-card__divider" />
      <p className="summary-card__helper">{helper}</p>
    </div>
  );
}

function SummaryCardButton({ label, value, helper, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="summary-card summary-card--button"
      title={`Open ${label}`}
      aria-label={`Open ${label}`}
    >
      <p className="summary-card__label">{label}</p>
      <p className="summary-card__value">{value}</p>
      <div className="summary-card__divider" />
      <p className="summary-card__helper">{helper}</p>
      <span className="summary-card__action">Click to open</span>
    </button>
  );
}

function PillButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`theme-switch ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}

function NavButton({ children, icon, onClick }) {
  return (
    <button type="button" onClick={onClick} className="nav-button">
      {icon}
      {children}
    </button>
  );
}

function formatReminderDateLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPrintAccentPack(month) {
  if ([2, 3, 4].includes(month)) {
    return {
      accent: "#0ea5e9",
      accentSoft: "#e0f2fe",
      accentStrong: "#0369a1",
    };
  }

  if ([5, 6, 7].includes(month)) {
    return {
      accent: "#14b8a6",
      accentSoft: "#ccfbf1",
      accentStrong: "#0f766e",
    };
  }

  if ([8, 9, 10].includes(month)) {
    return {
      accent: "#f97316",
      accentSoft: "#ffedd5",
      accentStrong: "#c2410c",
    };
  }

  return {
    accent: "#3b82f6",
    accentSoft: "#dbeafe",
    accentStrong: "#1d4ed8",
  };
}

function getReminderTone(reminders) {
  const categories = [...new Set(reminders.map((reminder) => reminder.category))];

  if (!categories.length) return "personal";
  if (categories.length === 1) return categories[0];
  return "mixed";
}

function PrintCalendarSheet({
  month,
  year,
  days,
  featuredPhoto,
  monthNotes,
  dayNotes,
  rangeNotes,
  reminderMap,
  visibleMonthReminderCount,
}) {
  const accentPack = getPrintAccentPack(month);
  const monthlyReminderItems = days
    .filter((day) => day.getMonth() === month)
    .map((day) => {
      const dayKey = toDateKey(day);
      const reminders = reminderMap[dayKey] ?? [];

      if (!reminders.length) return null;

      return {
        label: formatReminderDateLabel(dayKey),
        text: reminders
          .slice(0, 2)
          .map((reminder) => reminder.text)
          .join(" | "),
      };
    })
    .filter(Boolean);

  const printEntries = [
    ...monthNotes.map((note) => ({
      label: "Month note",
      text: note.text,
    })),
    ...dayNotes.map((note) => ({
      label: formatDateKey(note.scope.dayKey, {
        month: "short",
        day: "numeric",
      }),
      text: note.text,
    })),
    ...rangeNotes.map((note) => ({
      label: `${formatDateKey(note.scope.startKey, {
        month: "short",
        day: "numeric",
      })} - ${formatDateKey(note.scope.endKey, {
        month: "short",
        day: "numeric",
      })}`,
      text: note.text,
    })),
    ...monthlyReminderItems,
  ].slice(0, 5);

  return (
    <section
      className="print-sheet"
      aria-hidden="true"
      style={{
        "--print-accent": accentPack.accent,
        "--print-accent-soft": accentPack.accentSoft,
        "--print-accent-strong": accentPack.accentStrong,
      }}
    >
      <div className="print-sheet__page">
        <div className="print-sheet__binding" aria-hidden="true" />

        <div className="print-sheet__hero">
          <div className="print-sheet__hero-media">
            <img
              src={featuredPhoto.image}
              alt={featuredPhoto.alt}
              className="print-sheet__image"
              style={{ objectPosition: featuredPhoto.objectPosition }}
            />
            <div className="print-sheet__hero-fade" />
            <div className="print-sheet__hero-copy">
              <p className="print-sheet__eyebrow">Featured photo</p>
              <h1 className="print-sheet__headline">{featuredPhoto.title}</h1>
            </div>
          </div>

          <div className="print-sheet__hero-side">
            <p className="print-sheet__hero-label">Wall calendar</p>
            <div className="print-sheet__month-lockup">
              <span className="print-sheet__month-year">{year}</span>
              <strong className="print-sheet__month-name">
                {monthNames[month]}
              </strong>
            </div>
            <p className="print-sheet__hero-note">{featuredPhoto.note}</p>
          </div>
        </div>

        <div className="print-sheet__body">
          <aside className="print-sheet__notes">
            <p className="print-sheet__section-label">Notes</p>

            {printEntries.length ? (
              <div className="print-sheet__entry-list">
                {printEntries.map((entry, index) => (
                  <div key={`${entry.label}-${index}`} className="print-sheet__entry">
                    <span className="print-sheet__entry-label">{entry.label}</span>
                    <span className="print-sheet__entry-text">{entry.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="print-sheet__lines" aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                  <span key={index} className="print-sheet__line" />
                ))}
              </div>
            )}

          </aside>

          <section className="print-sheet__calendar">
            <div className="print-sheet__calendar-header">
              <div>
                <p className="print-sheet__section-label">Month grid</p>
                <h2 className="print-sheet__calendar-title">
                  {monthNames[month]} {year}
                </h2>
              </div>

              <div className="print-sheet__calendar-chip">
                {visibleMonthReminderCount
                  ? `${visibleMonthReminderCount} reminders`
                  : "Fresh month"}
              </div>
            </div>

            <div className="print-sheet__weekdays">
              {weekdayLabels.map((day) => (
                <span key={day} className="print-sheet__weekday">
                  {day}
                </span>
              ))}
            </div>

            <div className="print-sheet__grid">
              {days.map((day) => {
                const dayKey = toDateKey(day);
                const reminders = reminderMap[dayKey] ?? [];
                const tone = getReminderTone(reminders);
                const isCurrentMonth = day.getMonth() === month;
                const markerText =
                  reminders.length === 1
                    ? reminderCategoryLabels[reminders[0].category] ?? "Reminder"
                    : reminders.length > 1
                    ? `${reminders.length} items`
                    : "";

                return (
                  <div
                    key={dayKey}
                    className={`print-sheet__day ${
                      isCurrentMonth ? "is-current" : "is-outside"
                    }`}
                  >
                    <span className="print-sheet__day-number">
                      {day.getDate()}
                    </span>
                    {markerText ? (
                      <span
                        className={`print-sheet__day-marker print-sheet__day-marker--${tone}`}
                      >
                        {markerText}
                      </span>
                    ) : (
                      <span className="print-sheet__day-marker-spacer" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function SavedItemsModal({
  open,
  items,
  noteCount,
  reminderCount,
  onClose,
  onClearAll,
  onDeleteNote,
  onDeleteReminder,
}) {
  if (!open) return null;

  return (
    <div
      className="saved-items-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="saved-items-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-items-modal-title"
      >
        <div className="saved-items-modal__header">
          <div>
            <p className="saved-items-modal__eyebrow">Stored In Browser</p>
            <h3 id="saved-items-modal-title" className="saved-items-modal__title">
              All saved items
            </h3>
            <p className="saved-items-modal__copy">
              {items.length
                ? `${noteCount} note${noteCount === 1 ? "" : "s"} and ${reminderCount} reminder${
                    reminderCount === 1 ? "" : "s"
                  } saved locally in this browser.`
                : "No saved items yet. Add notes or reminders and they will appear here."}
            </p>
          </div>

          <div className="saved-items-modal__actions">
            {items.length > 0 && (
              <button
                type="button"
                className="icon-button"
                title="Clear all saved items"
                onClick={onClearAll}
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              className="icon-button"
              title="Close saved items"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="saved-items-modal__body">
          {items.length ? (
            <div className="saved-items-list">
              {items.map((item) => (
                <div key={item.id} className="saved-item-row">
                  <div className="saved-item-row__top">
                    <div className="saved-item-row__heading">
                      <span
                        className={`saved-item-row__label ${
                          item.kind === "reminder"
                            ? `saved-item-row__label--${item.category ?? "reminder"}`
                            : ""
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="saved-item-row__meta">{item.meta}</span>
                    </div>

                    <button
                      type="button"
                      className="icon-button"
                      title={
                        item.kind === "reminder"
                          ? "Delete reminder"
                          : "Delete note"
                      }
                      onClick={() =>
                        item.kind === "reminder"
                          ? onDeleteReminder(item.itemId)
                          : onDeleteNote(item.itemId)
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="saved-item-row__title">{item.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-notes saved-items-modal__empty">
              No saved items yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Main App ───────── */

export default function App() {
  const initialState = useMemo(() => createInitialState(), []);
  const today = initialState.today;
  const [isSavedItemsOpen, setIsSavedItemsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => initialState.viewDate);
  const [rangeStart, setRangeStart] = useState(() => initialState.rangeStart);
  const [rangeEnd, setRangeEnd] = useState(() => initialState.rangeEnd);
  const [selectedDay, setSelectedDay] = useState(() => initialState.selectedDay);
  const [noteMode, setNoteMode] = useState(() => initialState.noteMode);
  const [notes, setNotes] = useState(() => initialState.notes);
  const [reminders, setReminders] = useState(() => initialState.reminders);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [draft, setDraft] = useState("");
  const [reminderDraft, setReminderDraft] = useState(() => ({
    text: "",
    category: "birthday",
    dateKey: toDateKey(initialState.selectedDay),
    repeatsYearly: true,
  }));
  const [themeMode, setThemeMode] = useState(() => initialState.themeMode);
  const [showHints, setShowHints] = useState(() => initialState.showHints);

  /* ───────── Persistence ───────── */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          viewDate: toDateKey(viewDate),
          rangeStart: rangeStart ? toDateKey(rangeStart) : null,
          rangeEnd: rangeEnd ? toDateKey(rangeEnd) : null,
          selectedDay: toDateKey(selectedDay),
          notes,
          reminders,
          themeMode,
          noteMode,
          showHints,
        })
      );
    } catch {
      // ignore storage write failures
    }
  }, [
    viewDate,
    rangeStart,
    rangeEnd,
    selectedDay,
    notes,
    reminders,
    themeMode,
    noteMode,
    showHints,
  ]);

  useEffect(() => {
    if (!isSavedItemsOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsSavedItemsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSavedItemsOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const featuredPhoto = featuredPhotoByMonth[month] ?? featuredPhotoByMonth[0];
  const yearOptions = useMemo(() => {
    const baseYear = today.getFullYear();
    const startYear = Math.min(baseYear - 20, year - 20);
    const endYear = Math.max(baseYear + 20, year + 20);

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );
  }, [today, year]);

  const themePack = useMemo(
    () => getThemePack(month, themeMode),
    [month, themeMode]
  );

  const gridDays = useMemo(() => {
    const firstCell = startOfGrid(year, month);
    return Array.from({ length: 42 }, (_, i) => addDays(firstCell, i));
  }, [year, month]);

  const monthKey = yearMonthKey(year, month);

  const monthNotes = useMemo(
    () =>
      notes.filter(
        (n) => n.scope.type === "month" && n.scope.monthKey === monthKey
      ),
    [notes, monthKey]
  );

  const rangeNotes = useMemo(
    () => notes.filter((n) => n.scope.type === "range"),
    [notes]
  );

  const dayNotes = useMemo(
    () =>
      notes.filter((note) => {
        if (note.scope.type !== "day") return false;

        const noteDate = fromDateKey(note.scope.dayKey);
        return (
          noteDate.getFullYear() === year && noteDate.getMonth() === month
        );
      }),
    [notes, year, month]
  );

  const visibleMonthRangeNotes = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth(year, month));

    return rangeNotes.filter((note) => {
      const startDate = fromDateKey(note.scope.startKey);
      const endDate = fromDateKey(note.scope.endKey);

      return startDate <= monthEnd && endDate >= monthStart;
    });
  }, [rangeNotes, year, month]);

  const reminderMap = useMemo(() => {
    const byDate = {};

    gridDays.forEach((day) => {
      const dayKey = toDateKey(day);
      const dueReminders = reminders.filter((reminder) =>
        isReminderDueOnDate(reminder, day)
      );

      if (dueReminders.length) {
        byDate[dayKey] = dueReminders;
      }
    });

    return byDate;
  }, [gridDays, reminders]);

  const selectedDayNotes = useMemo(
    () =>
      notes.filter(
        (n) =>
          n.scope.type === "day" && n.scope.dayKey === toDateKey(selectedDay)
      ),
    [notes, selectedDay]
  );

  const selectedDayReminders = useMemo(
    () =>
      (reminderMap[toDateKey(selectedDay)] ?? []).map((reminder) => ({
        ...reminder,
        occurrenceDate: new Date(selectedDay),
      })),
    [reminderMap, selectedDay]
  );

  const visibleMonthReminderCount = useMemo(
    () =>
      gridDays.reduce((count, day) => {
        if (day.getMonth() !== month) return count;
        return count + (reminderMap[toDateKey(day)]?.length ?? 0);
      }, 0),
    [gridDays, month, reminderMap]
  );

  const upcomingReminders = useMemo(
    () =>
      reminders
        .map((reminder) => ({
          ...reminder,
          nextOccurrence: getNextReminderOccurrence(reminder, today),
        }))
        .filter((reminder) => reminder.nextOccurrence)
        .sort((a, b) => {
          const timeDiff =
            a.nextOccurrence.getTime() - b.nextOccurrence.getTime();

          if (timeDiff !== 0) return timeDiff;
          return a.text.localeCompare(b.text);
        })
        .slice(0, 6),
    [reminders, today]
  );

  const savedItems = useMemo(() => {
    const reminderItems = reminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      itemId: reminder.id,
      kind: "reminder",
      category: reminder.category,
      label: reminderCategoryLabels[reminder.category] ?? "Reminder",
      title: reminder.text,
      meta: reminder.repeatsYearly
        ? `Repeats yearly - ${formatReminderDateLabel(reminder.dateKey)}`
        : `Due on ${formatReminderDateLabel(reminder.dateKey)}`,
      createdAt: reminder.createdAt ?? "",
    }));

    const noteItems = notes.map((note) => ({
      id: `note-${note.id}`,
      itemId: note.id,
      kind: "note",
      label: "Note",
      title: note.text,
      meta: describeScope(note.scope),
      createdAt: note.createdAt ?? "",
    }));

    return [...reminderItems, ...noteItems].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
  }, [notes, reminders]);

  const noteCount = notes.length;
  const reminderCount = reminders.length;
  const totalSavedItemCount = notes.length + reminders.length;
  const nextReminder = upcomingReminders[0] ?? null;
  const savedItemsHelper = totalSavedItemCount
    ? `${noteCount} note${noteCount === 1 ? "" : "s"} • ${reminderCount} reminder${
        reminderCount === 1 ? "" : "s"
      }`
    : "Notes and reminders";

  /* ───────── Handlers ───────── */

  function setDisplayedMonth(nextYear, nextMonth) {
    const safeDay = Math.min(
      selectedDay?.getDate?.() ?? 1,
      daysInMonth(nextYear, nextMonth)
    );

    setViewDate(new Date(nextYear, nextMonth, 1));
    setSelectedDay(new Date(nextYear, nextMonth, safeDay));
  }

  function moveMonth(delta) {
    const next = new Date(year, month + delta, 1);
    setDisplayedMonth(next.getFullYear(), next.getMonth());
  }

  function jumpToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(new Date(today));
  }

  function handleDayClick(day) {
    const clicked = new Date(day);
    setSelectedDay(clicked);

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clicked);
      setRangeEnd(null);
      return;
    }

    if (clicked.getTime() < rangeStart.getTime()) {
      setRangeEnd(new Date(rangeStart));
      setRangeStart(clicked);
      return;
    }

    setRangeEnd(clicked);
  }

  function saveNote() {
    const text = draft.trim();
    if (!text) return;

    if (editingNoteId) {
      setNotes((curr) =>
        sortPinnedFirst(
          curr.map((note) =>
            note.id === editingNoteId ? { ...note, text } : note
          )
        )
      );
      setEditingNoteId(null);
      setDraft("");
      return;
    }

    let scope;

    if (noteMode === "month") {
      scope = { type: "month", monthKey };
    } else if (noteMode === "day") {
      scope = { type: "day", dayKey: toDateKey(selectedDay) };
    } else if (rangeStart && rangeEnd) {
      scope = {
        type: "range",
        startKey: toDateKey(rangeStart),
        endKey: toDateKey(rangeEnd),
      };
    } else if (rangeStart) {
      scope = { type: "day", dayKey: toDateKey(rangeStart) };
    } else {
      scope = { type: "month", monthKey };
    }

    setNotes((curr) =>
      sortPinnedFirst([
        {
          id: makeId(),
          text,
          scope,
          pinned: false,
          createdAt: new Date().toISOString(),
        },
        ...curr,
      ])
    );

    setDraft("");
  }

  function saveReminder() {
    const text = reminderDraft.text.trim();
    if (!text || !reminderDraft.dateKey) return;

    if (editingReminderId) {
      setReminders((curr) =>
        curr
          .map((reminder) =>
            reminder.id === editingReminderId
              ? {
                  ...reminder,
                  text,
                  dateKey: reminderDraft.dateKey,
                  category: reminderDraft.category,
                  repeatsYearly: reminderDraft.repeatsYearly,
                }
              : reminder
          )
          .map(normalizeReminder)
          .filter(Boolean)
          .sort((a, b) => {
            const aNext = getNextReminderOccurrence(a) ?? fromDateKey(a.dateKey);
            const bNext = getNextReminderOccurrence(b) ?? fromDateKey(b.dateKey);
            const timeDiff = aNext.getTime() - bNext.getTime();

            if (timeDiff !== 0) return timeDiff;
            return a.text.localeCompare(b.text);
          })
      );

      setEditingReminderId(null);
      setReminderDraft({
        text: "",
        category: "birthday",
        dateKey: toDateKey(selectedDay),
        repeatsYearly: true,
      });
      return;
    }

    setReminders((curr) =>
      [...curr, { id: makeId(), ...reminderDraft, text, createdAt: new Date().toISOString() }]
        .map(normalizeReminder)
        .filter(Boolean)
        .sort((a, b) => {
          const aNext = getNextReminderOccurrence(a) ?? fromDateKey(a.dateKey);
          const bNext = getNextReminderOccurrence(b) ?? fromDateKey(b.dateKey);
          const timeDiff = aNext.getTime() - bNext.getTime();

          if (timeDiff !== 0) return timeDiff;
          return a.text.localeCompare(b.text);
        })
    );

    setReminderDraft((curr) => ({
      ...curr,
      text: "",
      dateKey: toDateKey(selectedDay),
    }));
  }

  function deleteNote(id) {
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setDraft("");
    }

    setNotes((curr) => curr.filter((n) => n.id !== id));
  }

  function deleteReminder(id) {
    if (editingReminderId === id) {
      setEditingReminderId(null);
      setReminderDraft({
        text: "",
        category: "birthday",
        dateKey: toDateKey(selectedDay),
        repeatsYearly: true,
      });
    }

    setReminders((curr) => curr.filter((reminder) => reminder.id !== id));
  }

  function togglePin(id) {
    setNotes((curr) =>
      sortPinnedFirst(
        curr.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
      )
    );
  }

  function clearRange() {
    setRangeStart(null);
    setRangeEnd(null);
  }

  function startEditingNote(note) {
    setEditingNoteId(note.id);
    setDraft(note.text);

    if (note.scope.type === "day") {
      const day = fromDateKey(note.scope.dayKey);
      setNoteMode("day");
      setDisplayedMonth(day.getFullYear(), day.getMonth());
      setSelectedDay(day);
      return;
    }

    if (note.scope.type === "month") {
      const [scopeYear, scopeMonth] = note.scope.monthKey.split("-").map(Number);
      setNoteMode("month");
      setDisplayedMonth(scopeYear, scopeMonth - 1);
      return;
    }

    const rangeStartDate = fromDateKey(note.scope.startKey);
    const rangeEndDate = fromDateKey(note.scope.endKey);
    setNoteMode("range");
    setDisplayedMonth(
      rangeStartDate.getFullYear(),
      rangeStartDate.getMonth()
    );
    setRangeStart(rangeStartDate);
    setRangeEnd(rangeEndDate);
    setSelectedDay(rangeStartDate);
  }

  function cancelEditingNote() {
    setEditingNoteId(null);
    setDraft("");
  }

  function startEditingReminder(reminder) {
    const reminderDate = fromDateKey(reminder.dateKey);

    setEditingReminderId(reminder.id);
    setDisplayedMonth(reminderDate.getFullYear(), reminderDate.getMonth());
    setSelectedDay(reminderDate);
    setReminderDraft({
      text: reminder.text,
      category: reminder.category,
      dateKey: reminder.dateKey,
      repeatsYearly: reminder.repeatsYearly,
    });
  }

  function cancelEditingReminder() {
    setEditingReminderId(null);
    setReminderDraft({
      text: "",
      category: "birthday",
      dateKey: toDateKey(selectedDay),
      repeatsYearly: true,
    });
  }

  function handlePrint() {
    if (typeof window === "undefined") return;
    window.print();
  }

  function clearAllSavedItems() {
    setNotes([]);
    setReminders([]);
    setEditingNoteId(null);
    setEditingReminderId(null);
    setDraft("");
    setReminderDraft({
      text: "",
      category: "birthday",
      dateKey: toDateKey(selectedDay),
      repeatsYearly: true,
    });

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage removal failures
    }
  }

  /* ───────── UI ───────── */

  return (
    <div className="app-shell" data-theme={themeMode}>
      <div className="app-shell__inner">
        <div className="calendar-shell" data-theme={themeMode}>
          <div className="layout">
            <aside
              className="hero-panel"
              style={{ background: themePack.hero }}
            >
              <div className="hero-panel__overlay" />

              <div className="hero-panel__content">
                <div className="pill">
                  <CalendarDays size={14} />
                  Wall Calendar
                </div>

                <div className="hero-copy-block">
                  <p className="hero-kicker">Printed monthly planner</p>
                  <h1 className="hero-title">
                    {monthNames[month]} {year}
                  </h1>
                </div>

                <div className="hero-poster">
                  <div className="hero-poster__rings" aria-hidden="true">
                    <span className="hero-poster__ring" />
                    <span className="hero-poster__ring" />
                    <span className="hero-poster__ring" />
                  </div>

                  <div className="hero-poster__sheet">
                    {/* Title */}
                    <strong className="hero-poster__title">
                      {featuredPhoto.title}
                    </strong>

                    {/* Photo */}
                    <div className="hero-poster__image-wrap">
                      <img
                        src={featuredPhoto.image}
                        alt={featuredPhoto.alt}
                        className="hero-poster__image"
                        style={{ objectPosition: featuredPhoto.objectPosition }}
                      />
                    </div>

                    {/* Note */}
                    <p className="hero-poster__note">
                      {featuredPhoto.note}
                    </p>

                    {/* Collection + Year footer */}
                    <div className="hero-poster__footer">
                      <span>{monthNames[month]} collection</span>
                      <span>{year}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowHints((v) => !v)}
                  className="chip-button"
                  type="button"
                >
                  <Sparkles size={14} />
                  {showHints ? "Hide tips" : "Show tips"}
                </button>
              </div>

              <div className="hero-bottom">
                <div className="summary-grid">
                  <SummaryCard
                    label="Selection"
                    value={rangeLabel(rangeStart, rangeEnd)}
                    helper="Pick start & end date"
                  />

                  <SummaryCardButton
                    label="All Saved"
                    value={
                      totalSavedItemCount
                        ? `${totalSavedItemCount} saved`
                        : "Start planning"
                    }
                    onClick={() => setIsSavedItemsOpen(true)}
                    helper={
                      nextReminder
                        ? `${savedItemsHelper} • Next ${nextReminder.nextOccurrence.toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )}`
                        : savedItemsHelper
                    }
                  />
                </div>

                {showHints && (
                  <div className="hint-box">
                    Tap once to start, again to end. Add notes for ranges and
                    reminders for birthdays, anniversaries, and meetings.
                  </div>
                )}

                <div className="nav-row">
                  <NavButton
                    onClick={() => moveMonth(-1)}
                    icon={<ChevronLeft size={16} />}
                  >
                    Prev
                  </NavButton>

                  <NavButton
                    onClick={() => moveMonth(1)}
                    icon={<ChevronRight size={16} />}
                  >
                    Next
                  </NavButton>
                </div>
              </div>
            </aside>

            <section className="workspace">
              <div className="workspace__top">
                <div>
                  <p className="eyebrow">Month Grid</p>
                  <h2 className="section-title">
                    {monthNames[month]} {year}
                  </h2>
                  <p className="workspace-copy">
                    A responsive planning sheet for selecting ranges, spotting
                    holidays, saving notes, and keeping personal reminders in
                    view.
                  </p>
                </div>

                <div className="workspace__controls">
                  <div className="calendar-jump" aria-label="Calendar controls">
                    <button
                      type="button"
                      className="calendar-jump__step"
                      onClick={() => moveMonth(-1)}
                      aria-label="Go to previous month"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <label className="calendar-jump__field calendar-jump__field--month">
                      <span className="calendar-jump__label">Month</span>
                      <select
                        className="calendar-jump__select"
                        value={month}
                        onChange={(event) =>
                          setDisplayedMonth(year, Number(event.target.value))
                        }
                      >
                        {monthNames.map((name, index) => (
                          <option key={name} value={index}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="calendar-jump__field calendar-jump__field--year">
                      <span className="calendar-jump__label">Year</span>
                      <select
                        className="calendar-jump__select"
                        value={year}
                        onChange={(event) =>
                          setDisplayedMonth(Number(event.target.value), month)
                        }
                      >
                        {yearOptions.map((optionYear) => (
                          <option key={optionYear} value={optionYear}>
                            {optionYear}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      className="calendar-jump__step"
                      onClick={() => moveMonth(1)}
                      aria-label="Go to next month"
                    >
                      <ChevronRight size={16} />
                    </button>

                    <button
                      type="button"
                      className="calendar-jump__today"
                      onClick={jumpToToday}
                    >
                      Today
                    </button>
                  </div>

                  <div className="theme-switcher">
                    <PillButton
                      active={themeMode === "auto"}
                      onClick={() => setThemeMode("auto")}
                    >
                      Auto
                    </PillButton>

                    <PillButton
                      active={themeMode === "light"}
                      onClick={() => setThemeMode("light")}
                    >
                      <SunMedium size={14} /> Light
                    </PillButton>

                    <PillButton
                      active={themeMode === "dark"}
                      onClick={() => setThemeMode("dark")}
                    >
                      <MoonStar size={14} /> Dark
                    </PillButton>
                  </div>

                  <button
                    type="button"
                    className="secondary-button print-button"
                    onClick={handlePrint}
                  >
                    Print / PDF
                  </button>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="calendar-card">
                  <div className="calendar-card__header">
                    <div>
                      <p className="calendar-card__eyebrow">Calendar Sheet</p>
                      <h3 className="calendar-card__title">
                        {monthNames[month]} overview
                      </h3>
                    </div>

                    <div className="calendar-card__stamp">{year}</div>
                  </div>

                  <CalendarGrid
                    days={gridDays}
                    month={month}
                    today={today}
                    selectedDay={selectedDay}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onDayClick={handleDayClick}
                    holidayMap={holidayMap}
                    reminderMap={reminderMap}
                  />

                  <div className="legend-row">
                    <button
                      type="button"
                      onClick={clearRange}
                      className="legend-clear"
                    >
                      Clear range
                    </button>

                    <span className="legend-chip legend-chip--start">
                      <span className="legend-dot legend-dot--start" /> Start
                    </span>

                    <span className="legend-chip legend-chip--end">
                      <span className="legend-dot legend-dot--end" /> End
                    </span>

                    <span className="legend-chip legend-chip--range">
                      <span className="legend-dot legend-dot--range" /> In
                      between
                    </span>

                    <span className="legend-chip legend-chip--reminder">
                      <span className="legend-dot legend-dot--reminder" />
                      Reminder
                    </span>
                  </div>
                </div>

                <NotesPanel
                  noteMode={noteMode}
                  setNoteMode={setNoteMode}
                  draft={draft}
                  setDraft={setDraft}
                  onSave={saveNote}
                  onClearAll={clearAllSavedItems}
                  editingNoteId={editingNoteId}
                  editingReminderId={editingReminderId}
                  selectedDayNotes={selectedDayNotes}
                  selectedDayReminders={selectedDayReminders}
                  rangeNotes={rangeNotes}
                  monthNotes={monthNotes}
                  reminders={reminders}
                  reminderDraft={reminderDraft}
                  setReminderDraft={setReminderDraft}
                  onSaveReminder={saveReminder}
                  onDelete={deleteNote}
                  onDeleteReminder={deleteReminder}
                  onStartEditNote={startEditingNote}
                  onStartEditReminder={startEditingReminder}
                  onCancelNoteEdit={cancelEditingNote}
                  onCancelReminderEdit={cancelEditingReminder}
                  onPin={togglePin}
                  upcomingReminders={upcomingReminders}
                  visibleMonthReminderCount={visibleMonthReminderCount}
                  selectedDay={selectedDay}
                  viewYear={year}
                  viewMonth={month}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      <PrintCalendarSheet
        month={month}
        year={year}
        days={gridDays}
        featuredPhoto={featuredPhoto}
        monthNotes={monthNotes}
        dayNotes={dayNotes}
        rangeNotes={visibleMonthRangeNotes}
        reminderMap={reminderMap}
        visibleMonthReminderCount={visibleMonthReminderCount}
      />

      <SavedItemsModal
        open={isSavedItemsOpen}
        items={savedItems}
        noteCount={noteCount}
        reminderCount={reminderCount}
        onClose={() => setIsSavedItemsOpen(false)}
        onClearAll={clearAllSavedItems}
        onDeleteNote={deleteNote}
        onDeleteReminder={deleteReminder}
      />
    </div>
  );
}
