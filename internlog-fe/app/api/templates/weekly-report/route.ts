import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function GET() {
  try {
    const templatePath = path.join(
      process.cwd(),
      "templates",
      "weekly-report-template.docx",
    );
    const template = await readFile(templatePath);

    return new Response(new Uint8Array(template), {
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": 'inline; filename="weekly-report-template.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Cannot read weekly report template", error);

    return Response.json(
      { message: "Weekly report template is unavailable" },
      { status: 500 },
    );
  }
}
