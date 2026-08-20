import { internshipWeeks } from "./internship-log";
import type {
  DailyLog,
  InternshipWeek,
  WeeklyDraft,
  WeeklyReportRequest,
} from "../types/weekly-log";

export function createInitialDrafts() {
  return internshipWeeks.reduce<Record<string, WeeklyDraft>>((drafts, week) => {
    drafts[week.number] = {
      days: week.dates.map((date) => ({
        date,
        hours: "8",
        task: "",
        lesson: "",
        problem: "",
        solution: "",
      })),
      summary: "",
      reportDate: "",
      reportMonth: "",
      reportYear: "",
    };
    return drafts;
  }, {});
}

type BuildWeeklyReportRequestParams = {
  weekNumber: string;
  selectedWeek: InternshipWeek;
  days: DailyLog[];
  reportDate: string;
  summary: string;
};

export function buildWeeklyReportRequest({
  weekNumber,
  selectedWeek,
  days,
  reportDate,
  summary,
}: BuildWeeklyReportRequestParams): WeeklyReportRequest {
  return {
    template_id: "weekly-report",
    week: Number(weekNumber),
    start_date: selectedWeek.startDate,
    end_date: selectedWeek.endDate,
    report_date: reportDate || null,
    summary,
    days: days.map((day, index) => ({
      date: selectedWeek.isoDates[index],
      hours: Number(day.hours) || 0,
      task: day.task,
      lesson: day.lesson,
      problem: day.problem,
      solution: day.solution,
    })),
  };
}
