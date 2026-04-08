import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";

const START_YEAR = 2025;
const END_YEAR = 2035;
const OUTPUT_PATH = new URL("../src/data/holidayData.js", import.meta.url);
const execFileAsync = promisify(execFile);

const MONTH_INDEX = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&uuml;/g, "u")
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(text) {
  return decodeHtml(text.replace(/<[^>]+>/g, ""));
}

function normalizeHolidayName(label) {
  return label
    .replace("Eid-ul-Fitar", "Eid-ul-Fitr")
    .replace("Budhha Purnima", "Buddha Purnima")
    .replace("Mathatma Gandhi Jayanti", "Mahatma Gandhi Jayanti");
}

function toDateKey(year, monthLabel, dayLabel) {
  const month = MONTH_INDEX[monthLabel];
  const day = Number.parseInt(dayLabel, 10);

  if (!month || Number.isNaN(day)) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addHolidayLabel(holidayMap, dateKey, label) {
  if (!dateKey || !label) return;

  if (!holidayMap[dateKey]) {
    holidayMap[dateKey] = label;
    return;
  }

  const labels = holidayMap[dateKey].split(" / ");
  if (!labels.includes(label)) {
    holidayMap[dateKey] = `${holidayMap[dateKey]} / ${label}`;
  }
}

function parseHolidayMap(html, year) {
  const holidayMap = {};
  const tableMatch = html.match(
    /<table class="hlist_tab">[\s\S]*?<tbody>([\s\S]*?)<\/tbody><\/table>/
  );

  if (!tableMatch) {
    throw new Error(`Could not find the holiday table for ${year}`);
  }

  const rowPattern =
    /<tr class="r[01]">[\s\S]*?<td class="dt_nowrap">[\s\S]*?<span class='pc'>(.*?)<\/span>[\s\S]*?<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;

  for (const match of tableMatch[1].matchAll(rowPattern)) {
    const dateText = stripTags(match[1]);
    const holidayName = normalizeHolidayName(stripTags(match[2]));

    if (!dateText || !holidayName) {
      continue;
    }

    const [monthLabel, dayLabel] = dateText.replace(",", "").split(" ");
    const dateKey = toDateKey(year, monthLabel, dayLabel);

    addHolidayLabel(holidayMap, dateKey, holidayName);
  }

  return holidayMap;
}

async function fetchHolidayPage(year) {
  const curlCommand = process.platform === "win32" ? "curl.exe" : "curl";
  const { stdout } = await execFileAsync(curlCommand, [
    "--location",
    "--silent",
    `https://www.calendarlabs.com/holidays/india/${year}`,
  ]);

  if (!stdout) {
    throw new Error(`Unable to load India holidays for ${year}`);
  }

  return stdout;
}

async function buildHolidayMap() {
  const holidayMap = {};

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    const html = await fetchHolidayPage(year);
    const yearHolidayMap = parseHolidayMap(html, year);

    Object.entries(yearHolidayMap).forEach(([dateKey, label]) => {
      addHolidayLabel(holidayMap, dateKey, label);
    });
  }

  return holidayMap;
}

async function main() {
  const holidayMap = await buildHolidayMap();
  const fileContents = `export const INDIA_HOLIDAY_SOURCE = "CalendarLabs India Holidays";\nexport const INDIA_HOLIDAY_SOURCE_URL = "https://www.calendarlabs.com/holidays/";\nexport const INDIA_HOLIDAY_YEAR_RANGE = {\n  start: ${START_YEAR},\n  end: ${END_YEAR},\n};\n\nexport const holidayMap = ${JSON.stringify(holidayMap, null, 2)};\n`;

  await writeFile(OUTPUT_PATH, fileContents);

  console.log(
    `Wrote ${Object.keys(holidayMap).length} India holidays for ${START_YEAR}-${END_YEAR}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
