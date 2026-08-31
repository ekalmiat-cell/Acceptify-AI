"use client";

import { jsPDF } from "jspdf";
import type { AdmissionAnalysis } from "@/types/domain";

const BRAND = "#0B1F3A";

export function downloadAdmissionReport(input: {
  studentName: string;
  studentEmail: string;
  universityName: string;
  analysis: AdmissionAnalysis;
}) {
  const { studentName, studentEmail, universityName, analysis } = input;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 64;

  doc.setTextColor(BRAND);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Acceptify AI — Admission Analysis Report", marginX, y);

  y += 28;
  doc.setDrawColor(BRAND);
  doc.line(marginX, y, 548, y);

  y += 32;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#333333");
  doc.text(`Student: ${studentName}`, marginX, y);
  y += 18;
  doc.text(`Email: ${studentEmail}`, marginX, y);
  y += 18;
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, marginX, y);

  y += 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(BRAND);
  doc.text(`University: ${universityName}`, marginX, y);

  y += 28;
  doc.setFontSize(13);
  doc.text(`Fit score: ${analysis.score}/100  ·  Category: ${capitalize(analysis.category)}  ·  Confidence: ${analysis.confidence}%`, marginX, y);

  y += 32;
  doc.setFontSize(14);
  doc.text("Breakdown", marginX, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor("#333333");
  for (const item of analysis.breakdown) {
    // A component the programme doesn't weight is reported as such rather
    // than as 0% — see `ScoreBreakdown` in lib/predict.ts.
    const value = item.score == null ? "Not assessed" : `${item.score}%`;
    doc.text(`${item.label} (${item.weight}% weight): ${value}`, marginX + 8, y);
    y += 16;
  }

  y += 20;
  y = writeList(doc, "Strengths", analysis.strengths, marginX, y);
  y += 12;
  if (analysis.weaknesses.length > 0) {
    y = writeList(doc, "Weaknesses", analysis.weaknesses, marginX, y);
    y += 12;
  }
  y = writeList(doc, "Recommendations", analysis.recommendations, marginX, y);

  // The report leaves the reader's hands the moment it is downloaded, so the
  // one claim it must not let them make on our behalf travels with it.
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#777777");
  doc.text(
    doc.splitTextToSize(
      "The fit score measures how closely this profile matches what this programme asks for, weighted by that programme's evaluation model. It is not a probability of admission and is not a guarantee of any outcome.",
      480
    ),
    marginX,
    y
  );

  doc.save(`acceptify-ai-report-${universityName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

function writeList(doc: jsPDF, title: string, items: string[], x: number, startY: number): number {
  let y = startY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor("#0B1F3A");
  doc.text(title, x, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor("#333333");
  for (const item of items) {
    const lines = doc.splitTextToSize(`• ${item}`, 480);
    doc.text(lines, x + 8, y);
    y += lines.length * 14 + 4;
  }
  return y;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
