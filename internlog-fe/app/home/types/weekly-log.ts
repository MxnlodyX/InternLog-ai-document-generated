export type DailyLog = {
  date: string;
  hours: string;
  task: string;
  lesson: string;
  problem: string;
  solution: string;
};

export type WeeklyDraft = {
  days: DailyLog[];
  summary: string;
  reportDate: string;
  reportMonth: string;
  reportYear: string;
};

export type WeeklyReportRequest = {
  template_id: "weekly-report";
  week: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  report_date: string | null;
  summary: string;
  days: {
    date: string; // YYYY-MM-DD
    hours: number;
    task: string;
    lesson: string;
    problem: string;
    solution: string;
  }[];
};
export type InternshipWeek = {
  number: string;
  label: string;
  dateRange: string;
  dates: string[];      // วันที่ไทยสำหรับ UI
  isoDates: string[];   // YYYY-MM-DD สำหรับ API
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
};
