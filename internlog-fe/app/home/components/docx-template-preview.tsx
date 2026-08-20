"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyLog } from "../types/weekly-log";

const TEMPLATE_URL = "/api/templates/weekly-report";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const ZOOM_STEP = 10;

let templateRequest: Promise<ArrayBuffer> | null = null;

function loadTemplate() {
  if (!templateRequest) {
    templateRequest = fetch(TEMPLATE_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`โหลด template ไม่สำเร็จ (${response.status})`);
        }

        return response.arrayBuffer();
      })
      .catch((error) => {
        templateRequest = null;
        throw error;
      });
  }

  return templateRequest;
}

type DocxTemplatePreviewProps = {
  days: DailyLog[];
  weekNumber: string;
  summary: string;
  reportDate: string;
  reportMonth: string;
  reportYear: string;
};

export default function DocxTemplatePreview({
  days,
  weekNumber,
  summary,
  reportDate,
  reportMonth,
  reportYear,
}: DocxTemplatePreviewProps) {
  const previewContainer = useRef<HTMLDivElement>(null);
  const renderSequence = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);

  function changeZoom(amount: number) {
    setZoomLevel((currentZoom) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + amount)),
    );
  }

  useEffect(() => {
    const sequence = ++renderSequence.current;

    const timer = window.setTimeout(async () => {
      setStatus("loading");
      setErrorMessage("");

      try {
        const [template, pizzipModule, docxtemplaterModule, previewModule] =
          await Promise.all([
            loadTemplate(),
            import("pizzip"),
            import("docxtemplater"),
            import("docx-preview"),
          ]);

        if (sequence !== renderSequence.current || !previewContainer.current) {
          return;
        }

        const PizZip = pizzipModule.default;
        const Docxtemplater = docxtemplaterModule.default;
        const zip = new PizZip(template.slice(0));
        const document = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          nullGetter: () => "",
        });

        const thisWeekHours = Number(
          days
            .reduce((total, day) => total + (Number(day.hours) || 0), 0)
            .toFixed(2),
        );

        const templateData: Record<string, string | number> = {
          week: weekNumber,
          start_date: days[0]?.date ?? "",
          end_date: days[days.length - 1]?.date ?? "",
          summary,
          this_hours: thisWeekHours,
          prev_this_hours: 0,
          sum_hours: thisWeekHours,
          date: reportDate,
          month: reportMonth,
          years: reportYear,
        };

        days.forEach((day, index) => {
          const position = index + 1;
          templateData[`day_${position}_date`] = day.date;
          templateData[`hour_d${position}`] = day.hours;
          templateData[`day_${position}_task`] = day.task;
          templateData[`day_${position}_lesson`] = day.lesson;
          templateData[`day_${position}_problem`] = day.problem;
          templateData[`day_${position}_solution`] = day.solution;
        });

        document.render(templateData);

        const filledZip = document.getZip();

        const filledTemplate = filledZip.generate({
          type: "blob",
          mimeType: DOCX_MIME,
          compression: "DEFLATE",
        });

        if (sequence !== renderSequence.current || !previewContainer.current) {
          return;
        }

        const stagingContainer = window.document.createElement("div");

        await previewModule.renderAsync(
          filledTemplate,
          stagingContainer,
          stagingContainer,
          {
            inWrapper: true,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            renderHeaders: true,
            renderFooters: true,
            useBase64URL: true,
          },
        );

        if (sequence !== renderSequence.current || !previewContainer.current) return;

        previewContainer.current.replaceChildren(
          ...Array.from(stagingContainer.childNodes),
        );
        setStatus("ready");
      } catch (error) {
        if (sequence !== renderSequence.current) return;

        console.error("DOCX preview failed", error);
        setErrorMessage(
          error instanceof Error ? error.message : "ไม่สามารถแสดง DOCX template ได้",
        );
        setStatus("error");
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [days, weekNumber, summary, reportDate, reportMonth, reportYear]);

  return (
    <aside className="min-w-0 bg-slate-200/60 p-4 sm:p-6">
      <div className="sticky top-24">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Document Preview</h2>
            <p className="mt-0.5 text-xs text-slate-500">Filled from the real DOCX template</p>
          </div>

          <div
            className="flex px-2 shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            role="group"
            aria-label="Document zoom controls"
          >
            <button
              type="button"
              onClick={() => changeZoom(-ZOOM_STEP)}
              disabled={zoomLevel === MIN_ZOOM}
              className="grid size-8 place-items-center text-base font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="h-8 min-w-14 border-x border-slate-200 px-2 text-xs font-semibold tabular-nums text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              aria-label={`Reset zoom to 100 percent. Current zoom ${zoomLevel} percent`}
              title="Reset zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => changeZoom(ZOOM_STEP)}
              disabled={zoomLevel === MAX_ZOOM}
              className="grid size-8 place-items-center text-base font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>

        <div className="relative h-[calc(100vh-9rem)] overflow-auto rounded-xl border border-slate-200 bg-slate-300">
          {status === "loading" && (
            <div className="absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-violet-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-500" />
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-slate-100/95 p-6">
              <div className="max-w-sm text-center">
                <p className="text-sm font-medium text-rose-600">เปิด template ไม่สำเร็จ</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{errorMessage}</p>
              </div>
            </div>
          )}

          <div
            ref={previewContainer}
            style={{ zoom: zoomLevel / 100 }}
            className="docx-preview-host min-h-full [&_.docx-wrapper]:!bg-slate-300 [&_.docx-wrapper]:!p-5 [&_section.docx]:!shadow-xl"
          />
        </div>
      </div>
    </aside>
  );
}
