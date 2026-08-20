"use client";

import { useState } from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import DocxTemplatePreview from "./components/docx-template-preview";
import { internshipWeeks } from "./lib/internship-log";
import {
  buildWeeklyReportRequest,
  createInitialDrafts,
} from "./lib/weekly-report";
import type { WeeklyDraft } from "./types/weekly-log";

type LogField = "task" | "lesson" | "problem" | "solution";
type WeeklyDetailField = "summary" | "reportDate" | "reportMonth" | "reportYear";

export default function Dashboard() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [weekNumber, setWeekNumber] = useState("1");
  const [weeklyDrafts, setWeeklyDrafts] = useState<Record<string, WeeklyDraft>>(
    createInitialDrafts,
  );
  const selectedWeek = internshipWeeks[Number(weekNumber) - 1];
  const { days, summary, reportDate, reportMonth, reportYear } =
    weeklyDrafts[weekNumber];
  const currentDay = days[selectedDay];

  function updateCurrentDay(field: LogField, value: string) {
    setWeeklyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [weekNumber]: {
        ...currentDrafts[weekNumber],
        days: currentDrafts[weekNumber].days.map((day, index) =>
          index === selectedDay ? { ...day, [field]: value } : day,
        ),
      },
    }));
  }

  function updateCurrentHours(hours: string) {
    setWeeklyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [weekNumber]: {
        ...currentDrafts[weekNumber],
        days: currentDrafts[weekNumber].days.map((day, index) =>
          index === selectedDay ? { ...day, hours } : day,
        ),
      },
    }));
  }

  function updateWeeklyDetail(field: WeeklyDetailField, value: string) {
    setWeeklyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [weekNumber]: {
        ...currentDrafts[weekNumber],
        [field]: value,
      },
    }));
  }

  function selectWeek(nextWeek: string) {
    setWeekNumber(nextWeek);
    setSelectedDay(0);
  }

  function clearCurrentDay() {
    setWeeklyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [weekNumber]: {
        ...currentDrafts[weekNumber],
        days: currentDrafts[weekNumber].days.map((day, index) =>
          index === selectedDay
            ? { ...day, task: "", lesson: "", problem: "", solution: "" }
            : day,
        ),
      },
    }));
  }

  function handleSave() {
    const requestData = buildWeeklyReportRequest({
      weekNumber,
      selectedWeek,
      days,
      reportDate,
      summary,
    });

    console.log("Ready for Go Fiber:", requestData);
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="grid min-h-[calc(100vh-5rem)] xl:grid-cols-[minmax(0,1.08fr)_minmax(500px,0.92fr)]">
          <section className="min-w-0 border-r border-slate-200 p-4 sm:p-6 lg:p-8">
            <div>
              <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/10">
                Week {weekNumber || "—"}
              </span>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Weekly Logger
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                บันทึกงานฝึกงานประจำวันที่ {selectedWeek.dateRange}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-950">Weekly report details</h2>
                <p className="mt-1 text-xs text-slate-400">
                  ข้อมูลสำหรับ week, summary และวันที่ลงนามในเอกสาร
                </p>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-4">
                <label className="block sm:col-span-4">
                  <span className="text-sm font-semibold text-slate-900">Week</span>
                  <select
                    value={weekNumber}
                    onChange={(event) => selectWeek(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  >
                    {internshipWeeks.map((week) => (
                      <option key={week.number} value={week.number}>
                        {week.label}
                      </option>
                    ))}
                  </select>
                </label>
                <TextInput
                  label="วันที่"
                  placeholder="14"
                  value={reportDate}
                  onChange={(value) => updateWeeklyDetail("reportDate", value)}
                  inputMode="numeric"
                />
                <TextInput
                  label="เดือน"
                  placeholder="สิงหาคม"
                  value={reportMonth}
                  onChange={(value) => updateWeeklyDetail("reportMonth", value)}
                />
                <TextInput
                  label="พ.ศ."
                  placeholder="2569"
                  value={reportYear}
                  onChange={(value) => updateWeeklyDetail("reportYear", value)}
                  inputMode="numeric"
                />

                <label className="block sm:col-span-4">
                  <span className="text-sm font-semibold text-slate-900">Weekly Summary</span>
                  <span className="ml-2 text-xs text-slate-400">ทบทวนและประเมินผลประจำสัปดาห์</span>
                  <textarea
                    value={summary}
                    onChange={(event) => updateWeeklyDetail("summary", event.target.value)}
                    placeholder="สรุปภาพรวมการปฏิบัติงานประจำสัปดาห์..."
                    rows={4}
                    className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {days.map((day, index) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDay(index)}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${selectedDay === index
                    ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <span className="block font-semibold">Day {index + 1}</span>
                  <span className="mt-1 block text-xs opacity-70">{day.date}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Daily internship log</h2>
                  <p className="mt-1 text-xs text-slate-400">บันทึกประจำวันที่ {currentDay.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                    <span className="text-xs font-medium text-slate-500">Hours</span>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={currentDay.hours}
                      onChange={(event) => updateCurrentHours(event.target.value)}
                      placeholder="0"
                      className="w-14 bg-transparent text-right text-sm font-semibold text-slate-900 outline-none"
                      aria-label={`จำนวนชั่วโมงของ Day ${selectedDay + 1}`}
                    />
                  </label>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                    Day {selectedDay + 1}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2">
                <FormField
                  label="Task"
                  thaiLabel="งานที่ได้รับมอบหมาย"
                  placeholder="ระบุงานที่ได้รับมอบหมาย..."
                  value={currentDay.task}
                  onChange={(value) => updateCurrentDay("task", value)}
                  className="border-b border-slate-100 md:border-r"
                />
                <FormField
                  label="Lesson Learned"
                  thaiLabel="สิ่งที่ได้เรียนรู้"
                  placeholder="อธิบายสิ่งที่ได้เรียนรู้..."
                  value={currentDay.lesson}
                  onChange={(value) => updateCurrentDay("lesson", value)}
                  className="border-b border-slate-100"
                />
                <FormField
                  label="Challenge"
                  thaiLabel="ปัญหาและอุปสรรค"
                  placeholder="ระบุปัญหาที่พบ..."
                  value={currentDay.problem}
                  onChange={(value) => updateCurrentDay("problem", value)}
                  className="border-b border-slate-100 md:border-b-0 md:border-r"
                />
                <FormField
                  label="Solution"
                  thaiLabel="แนวทางการแก้ไข"
                  placeholder="ระบุแนวทางการแก้ไข..."
                  value={currentDay.solution}
                  onChange={(value) => updateCurrentDay("solution", value)}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={clearCurrentDay}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Clear this day
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 sm:flex-none"
                  >
                    Save Week
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Document preview updates instantly while you type. Data is sent to Go Fiber only when you save.
            </p>
          </section>

          <DocxTemplatePreview
            days={days}
            weekNumber={weekNumber}
            summary={summary}
            reportDate={reportDate}
            reportMonth={reportMonth}
            reportYear={reportYear}
          />
        </main>
      </div>
    </div>
  );
}

type TextInputProps = {
  label: string;
  value: string;
  placeholder: string;
  inputMode?: "text" | "numeric";
  onChange: (value: string) => void;
};

function TextInput({
  label,
  value,
  placeholder,
  inputMode = "text",
  onChange,
}: TextInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}

type FormFieldProps = {
  label: string;
  thaiLabel: string;
  value: string;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
};

function FormField({
  label,
  thaiLabel,
  value,
  placeholder,
  className = "",
  onChange,
}: FormFieldProps) {
  return (
    <label className={`block min-w-0 p-5 ${className}`}>
      <span className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        <span className="text-xs text-slate-400">{thaiLabel}</span>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={6}
        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}
