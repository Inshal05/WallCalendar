export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const reminderCategoryLabels = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  meeting: "Meeting",
  personal: "Personal",
};

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toMonthDayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthDayFromDateKey(key) {
  return key.split("-").slice(1).join("-");
}

export function formatDateKey(key, options) {
  return fromDateKey(key).toLocaleDateString(undefined, options);
}

export function formatMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function sameDay(a, b) {
  return !!a && !!b && toDateKey(a) === toDateKey(b);
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  return addDays(firstOfMonth, -firstOfMonth.getDay());
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function yearMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function isBetween(day, start, end) {
  if (!start || !end) return false;
  const time = day.getTime();
  return time > start.getTime() && time < end.getTime();
}

export function rangeLabel(start, end) {
  if (!start && !end) return "No range selected";
  if (start && !end) {
    return `${start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} -> pick an end date`;
  }

  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function describeScope(scope) {
  if (scope.type === "month") {
    return `Month note - ${formatMonthKey(scope.monthKey)}`;
  }

  if (scope.type === "day") {
    return `Day note - ${formatDateKey(scope.dayKey, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return `Range note - ${formatDateKey(scope.startKey, {
    month: "short",
    day: "numeric",
  })} to ${formatDateKey(scope.endKey, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function sortPinnedFirst(notes) {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export function isReminderDueOnDate(reminder, date) {
  if (reminder.repeatsYearly) {
    return monthDayFromDateKey(reminder.dateKey) === toMonthDayKey(date);
  }

  return reminder.dateKey === toDateKey(date);
}

export function getReminderOccurrenceDate(reminder, year) {
  const [, month, day] = reminder.dateKey.split("-").map(Number);

  if (reminder.repeatsYearly) {
    return new Date(year, month - 1, day);
  }

  return fromDateKey(reminder.dateKey);
}

export function getNextReminderOccurrence(reminder, fromDate = new Date()) {
  const fromDateKeyValue = toDateKey(fromDate);

  if (reminder.repeatsYearly) {
    const currentYearOccurrence = getReminderOccurrenceDate(
      reminder,
      fromDate.getFullYear()
    );

    if (toDateKey(currentYearOccurrence) >= fromDateKeyValue) {
      return currentYearOccurrence;
    }

    return getReminderOccurrenceDate(reminder, fromDate.getFullYear() + 1);
  }

  const nextOccurrence = fromDateKey(reminder.dateKey);
  return reminder.dateKey >= fromDateKeyValue ? nextOccurrence : null;
}
