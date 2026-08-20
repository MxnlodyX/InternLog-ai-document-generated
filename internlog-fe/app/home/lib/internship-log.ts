import type { InternshipWeek } from "../types/weekly-log";

const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiDate(date: Date) {
  return `${date.getUTCDate()} ${THAI_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear() + 543}`;
}

function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatWeekRange(startDate: Date, endDate: Date) {
  const year = endDate.getUTCFullYear() + 543;
  const startMonth = THAI_MONTHS[startDate.getUTCMonth()];
  const endMonth = THAI_MONTHS[endDate.getUTCMonth()];

  if (startDate.getUTCMonth() === endDate.getUTCMonth()) {
    return `${startDate.getUTCDate()}–${endDate.getUTCDate()} ${endMonth} ${year}`;
  }

  return `${startDate.getUTCDate()} ${startMonth}–${endDate.getUTCDate()} ${endMonth} ${year}`;
}

export const internshipWeeks: InternshipWeek[] = Array.from(
  { length: 16 },
  (_, index) => {
    const startDate = new Date(Date.UTC(2026, 7, 3 + index * 7));
    const weekDates = Array.from({ length: 5 }, (__, dayIndex) => {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + dayIndex);
      return date;
    });
    const endDate = weekDates[4];
    const dates = weekDates.map(formatThaiDate);
    const isoDates = weekDates.map(formatISODate);
    const number = String(index + 1);
    const dateRange = formatWeekRange(startDate, endDate);

    return {
      number,
      dateRange,
      dates,
      isoDates,
      startDate: formatISODate(startDate),
      endDate: formatISODate(endDate),
      label: `Week ${number} · ${dateRange}`,
    };
  },
);
