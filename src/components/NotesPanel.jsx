import React from "react";
import { Bell, NotebookPen, Pin, Repeat, Trash2 } from "lucide-react";
import {
  describeScope,
  reminderCategoryLabels,
  rangeLabel,
  toDateKey,
} from "../utils/calendarUtils";

function formatReminderDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NotesPanel({
  noteMode,
  setNoteMode,
  draft,
  setDraft,
  onSave,
  onClearAll,
  editingNoteId,
  editingReminderId,
  selectedDayNotes,
  selectedDayReminders,
  rangeNotes,
  monthNotes,
  reminders,
  reminderDraft,
  setReminderDraft,
  onSaveReminder,
  onDelete,
  onDeleteReminder,
  onStartEditNote,
  onStartEditReminder,
  onCancelNoteEdit,
  onCancelReminderEdit,
  onPin,
  upcomingReminders,
  visibleMonthReminderCount,
  selectedDay,
  viewYear,
  viewMonth,
  rangeStart,
  rangeEnd,
}) {
  const selectedDayLabel = selectedDay.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="notes-panel">
      <div className="notes-panel__header">
        <div>
          <h3 className="notes-title">
            <NotebookPen className="notes-title__icon" /> Notes & reminders
          </h3>
          <p className="notes-subtitle">
            Save notes for the planner and add personal reminders for important
            dates. Use All Saved on the left whenever you want the full saved
            list in a pop-up.
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="icon-button"
          title="Clear all saved items"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="notes-panel__body">
        <div className="notes-section notes-section--context">
          <div className="notes-section__eyebrow">Planner context</div>
          <div className="notes-context">
            <div className="notes-context__card">
              <span className="notes-context__label">Selected day</span>
              <div className="notes-context__value">{selectedDayLabel}</div>
            </div>

            <div className="notes-context__card">
              <span className="notes-context__label">Selected range</span>
              <div className="notes-context__value">
                {rangeLabel(rangeStart, rangeEnd)}
              </div>
            </div>

            <div className="notes-context__card">
              <span className="notes-context__label">Current month</span>
              <div className="notes-context__value">
                {new Date(viewYear, viewMonth).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="notes-context__card">
              <span className="notes-context__label">Month reminders</span>
              <div className="notes-context__value">
                {visibleMonthReminderCount
                  ? `${visibleMonthReminderCount} due`
                  : "None yet"}
              </div>
            </div>
          </div>
        </div>

        <div className="notes-section">
          <div className="notes-section__eyebrow">Edit from calendar day</div>
          <p className="notes-section__copy">
            Click a date in the calendar and the notes or reminders saved for
            that day will show up here with quick edit actions.
          </p>

          {selectedDayReminders.length || selectedDayNotes.length ? (
            <div className="selected-day-groups">
              {selectedDayReminders.length > 0 && (
                <ReminderBucket
                  title={`Reminders on ${selectedDayLabel}`}
                  reminders={selectedDayReminders}
                  emptyText="No reminders on the selected day."
                  onDeleteReminder={onDeleteReminder}
                  onEditReminder={onStartEditReminder}
                />
              )}
              {selectedDayNotes.length > 0 && (
                <NoteBucket
                  title={`Notes on ${selectedDayLabel}`}
                  notes={selectedDayNotes}
                  onDelete={onDelete}
                  onPin={onPin}
                  onStartEdit={onStartEditNote}
                />
              )}
            </div>
          ) : (
            <div className="empty-notes">
              Nothing is saved on {selectedDayLabel} yet. Select another day or
              add a day note or reminder to start editing from the calendar.
            </div>
          )}
        </div>

        <div className="notes-section notes-section--composer">
          <div className="notes-section__eyebrow">Personal reminders</div>
          <p className="notes-section__copy">
            Great for birthdays, anniversaries, meetings, and anything you do
            not want to miss.
          </p>

          {editingReminderId && (
            <p className="notes-inline-state">
              Editing a saved reminder. Update the details below and save to
              keep the same reminder.
            </p>
          )}

          <label className="notes-input-group">
            <span className="notes-input-group__label">Reminder title</span>
            <input
              type="text"
              value={reminderDraft.text}
              onChange={(event) =>
                setReminderDraft((curr) => ({
                  ...curr,
                  text: event.target.value,
                }))
              }
              placeholder="Mom's birthday, doctor visit, team meeting..."
              className="notes-text-input"
            />
          </label>

          <div className="reminder-fields">
            <label className="notes-input-group">
              <span className="notes-input-group__label">Date</span>
              <input
                type="date"
                value={reminderDraft.dateKey}
                onChange={(event) =>
                  setReminderDraft((curr) => ({
                    ...curr,
                    dateKey: event.target.value,
                  }))
                }
                className="notes-text-input"
              />
            </label>

            <label className="notes-input-group">
              <span className="notes-input-group__label">Type</span>
              <select
                value={reminderDraft.category}
                onChange={(event) =>
                  setReminderDraft((curr) => {
                    const nextCategory = event.target.value;
                    const shouldRepeat =
                      nextCategory === "birthday" ||
                      nextCategory === "anniversary";

                    return {
                      ...curr,
                      category: nextCategory,
                      repeatsYearly: shouldRepeat ? true : curr.repeatsYearly,
                    };
                  })
                }
                className="notes-select"
              >
                {Object.entries(reminderCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={reminderDraft.repeatsYearly}
              onChange={(event) =>
                setReminderDraft((curr) => ({
                  ...curr,
                  repeatsYearly: event.target.checked,
                }))
              }
            />
            Repeat every year on this date
          </label>

          <div className="button-row">
            <button
              type="button"
              onClick={onSaveReminder}
              className="save-button save-button--secondary"
            >
              <Bell size={16} />{" "}
              {editingReminderId ? "Update reminder" : "Save reminder"}
            </button>

            {editingReminderId && (
              <button
                type="button"
                onClick={onCancelReminderEdit}
                className="secondary-button"
              >
                Cancel edit
              </button>
            )}
          </div>
        </div>

        <div className="note-groups reminder-groups">
          <div className="note-groups__eyebrow">Upcoming reminders</div>
          {reminders.length ? (
            <ReminderBucket
              title="Next up"
              reminders={upcomingReminders}
              emptyText="No upcoming reminders yet."
              onDeleteReminder={onDeleteReminder}
              onEditReminder={onStartEditReminder}
            />
          ) : (
            <div className="empty-notes">
              No reminders yet. Add birthdays, anniversaries, meetings, or
              personal to-dos.
            </div>
          )}
        </div>

        <div className="notes-section notes-section--scope">
          <div className="notes-section__eyebrow">Note scope</div>
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setNoteMode("month")}
              className={`segmented-control__button ${
                noteMode === "month" ? "is-active" : ""
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setNoteMode("day")}
              className={`segmented-control__button ${
                noteMode === "day" ? "is-active" : ""
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setNoteMode("range")}
              className={`segmented-control__button ${
                noteMode === "range" ? "is-active" : ""
              }`}
            >
              Range
            </button>
          </div>
        </div>

        <div className="notes-section notes-section--composer">
          <div className="notes-section__eyebrow">Write note</div>

          {editingNoteId && (
            <p className="notes-inline-state">
              Editing a saved note. The original scope stays the same while you
              update the text.
            </p>
          )}

          <label className="notes-input-group">
            <span className="notes-input-group__label">Add note</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                noteMode === "day"
                  ? "Note for the selected day..."
                  : noteMode === "range"
                  ? "Note for the selected range..."
                  : "Monthly memo..."
              }
              rows={4}
              className="notes-textarea"
            />
          </label>

          <div className="button-row">
            <button type="button" onClick={onSave} className="save-button">
              <Pin size={16} /> {editingNoteId ? "Update note" : "Save note"}
            </button>

            {editingNoteId && (
              <button
                type="button"
                onClick={onCancelNoteEdit}
                className="secondary-button"
              >
                Cancel edit
              </button>
            )}
          </div>
        </div>

        <div className="note-groups">
          <div className="note-groups__eyebrow">Saved notes</div>
          {rangeNotes.length || monthNotes.length ? (
            <>
              <NoteBucket
                title="Selected range"
                notes={rangeNotes}
                onDelete={onDelete}
                onPin={onPin}
                onStartEdit={onStartEditNote}
              />
              <NoteBucket
                title="Month"
                notes={monthNotes}
                onDelete={onDelete}
                onPin={onPin}
                onStartEdit={onStartEditNote}
              />
            </>
          ) : (
            <div className="empty-notes">
              No range or month notes yet. Day-specific notes appear in the
              selected-day editor above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReminderBucket({
  title,
  reminders,
  emptyText,
  onDeleteReminder,
  onEditReminder,
}) {
  if (!reminders.length) {
    return <div className="empty-notes empty-notes--compact">{emptyText}</div>;
  }

  return (
    <div className="note-bucket">
      <div className="note-bucket__header">
        <h4 className="note-bucket__title">{title}</h4>
        <span className="note-bucket__count">{reminders.length}</span>
      </div>

      <div className="note-bucket__list">
        {reminders.map((reminder) => {
          const date =
            reminder.occurrenceDate ??
            reminder.nextOccurrence ??
            new Date(`${reminder.dateKey}T00:00:00`);

          return (
            <div
              key={`${reminder.id}-${toDateKey(date)}`}
              className="note-card note-card--reminder"
            >
              <div className="note-card__content">
                <div className="note-card__body">
                  <div className="note-card__tags">
                    <span
                      className={`note-card__pill note-card__pill--${reminder.category}`}
                    >
                      {reminderCategoryLabels[reminder.category] ?? "Reminder"}
                    </span>
                    {reminder.repeatsYearly && (
                      <span className="note-card__pill note-card__pill--muted">
                        <Repeat size={11} /> Every year
                      </span>
                    )}
                  </div>
                  <p className="note-card__text">{reminder.text}</p>
                </div>

                <div className="note-card__actions">
                  {onEditReminder && (
                    <button
                      type="button"
                      onClick={() => onEditReminder(reminder)}
                      className="card-action-button"
                      title="Edit reminder"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteReminder(reminder.id)}
                    className="icon-button"
                    title="Delete reminder"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="note-card__meta">Due on {formatReminderDate(date)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoteBucket({ title, notes, onDelete, onPin, onStartEdit }) {
  if (!notes.length) return null;

  return (
    <div className="note-bucket">
      <div className="note-bucket__header">
        <h4 className="note-bucket__title">{title}</h4>
        <span className="note-bucket__count">{notes.length}</span>
      </div>

      <div className="note-bucket__list">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`note-card ${note.pinned ? "is-pinned" : ""}`}
          >
            <div className="note-card__content">
              <p className="note-card__text">{note.text}</p>

              <div className="note-card__actions">
                <button
                  type="button"
                  onClick={() => onPin(note.id)}
                  className="icon-button"
                  title="Pin note"
                >
                  <Pin size={14} />
                </button>
                {onStartEdit && (
                  <button
                    type="button"
                    onClick={() => onStartEdit(note)}
                    className="card-action-button"
                    title="Edit note"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(note.id)}
                  className="icon-button"
                  title="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <p className="note-card__meta">{describeScope(note.scope)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
