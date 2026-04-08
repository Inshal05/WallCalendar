import React from "react";
import {
  isBetween,
  reminderCategoryLabels,
  sameDay,
  toDateKey,
  weekdayLabels,
} from "../utils/calendarUtils";

function getReminderTone(reminders) {
  const categories = [...new Set(reminders.map((reminder) => reminder.category))];

  if (!categories.length) return "personal";
  if (categories.length === 1) return categories[0];
  return "mixed";
}

export function CalendarGrid({
  days,
  month,
  today,
  selectedDay,
  rangeStart,
  rangeEnd,
  onDayClick,
  holidayMap,
  reminderMap,
}) {
  return (
    <>
      <div className="calendar-weekdays">
        {weekdayLabels.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day) => {
          const inCurrentMonth = day.getMonth() === month;
          const isStart = sameDay(day, rangeStart);
          const isEnd = sameDay(day, rangeEnd);
          const inRange = isBetween(day, rangeStart, rangeEnd);
          const isMiddleRange = inRange && !isStart && !isEnd;
          const isSelected = sameDay(day, selectedDay);
          const isToday = sameDay(day, today);
          const holiday = holidayMap[toDateKey(day)];
          const reminders = reminderMap?.[toDateKey(day)] ?? [];
          const reminderTone = getReminderTone(reminders);
          const reminderLabel =
            reminders.length === 1
              ? reminderCategoryLabels[reminders[0].category] ?? "Reminder"
              : `${reminders.length} reminders`;
          const reminderTitle = reminders.map((reminder) => reminder.text).join(", ");

          const background = isStart
            ? "var(--range-start-bg)"
            : isEnd
            ? "var(--range-end-bg)"
            : inRange
            ? "var(--range-middle-bg)"
            : undefined;

          return (
            <button
              key={toDateKey(day)}
              type="button"
              onClick={() => onDayClick(day)}
              className={`calendar-day ${
                inCurrentMonth ? "calendar-day--current" : "calendar-day--outside"
              } ${inRange ? "calendar-day--range" : ""} ${
                isStart ? "calendar-day--start" : ""
              } ${isEnd ? "calendar-day--end" : ""} ${
                inRange ? "calendar-day--between" : ""
              }`}
              style={{ background }}
            >
              <div className="calendar-day__top">
                <div
                  className={`calendar-day__number ${
                    isStart || isEnd
                      ? "calendar-day__number--dark"
                      : isMiddleRange
                      ? "calendar-day__number--range"
                      : ""
                  }`}
                >
                  {day.getDate()}
                </div>

                {isToday && (
                  <span
                    className={`calendar-today-badge ${
                      isStart || isEnd
                        ? "calendar-today-badge--dark"
                        : isMiddleRange
                        ? "calendar-today-badge--range"
                        : ""
                    }`}
                  >
                    Today
                  </span>
                )}
              </div>

              <div className="calendar-day__body">
                <div className="calendar-day__chips">
                  {holiday && (
                    <div
                      className={`holiday-badge ${
                        isStart || isEnd
                          ? "holiday-badge--dark"
                          : isMiddleRange
                          ? "holiday-badge--range"
                          : ""
                      }`}
                    >
                      {holiday}
                    </div>
                  )}

                  {reminders.length > 0 && (
                    <div
                      className={`reminder-badge ${
                        reminders.length ? `reminder-badge--${reminderTone}` : ""
                      } ${
                        isStart || isEnd
                          ? "reminder-badge--dark"
                          : isMiddleRange
                          ? "reminder-badge--range"
                          : ""
                      }`}
                      title={reminderTitle}
                    >
                      {reminderLabel}
                    </div>
                  )}
                </div>
              </div>

              {isSelected && (
                <div
                  className={`calendar-selected-dot ${
                    isStart || isEnd || inRange ? "calendar-selected-dot--dark" : ""
                  }`}
                />
              )}

              {inRange && !isStart && !isEnd && (
                <div className="calendar-range-outline" />
              )}
              {isStart && <div className="calendar-start-outline" />}
              {isEnd && <div className="calendar-end-outline" />}
            </button>
          );
        })}
      </div>
    </>
  );
}
