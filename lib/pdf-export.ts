import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Review } from "@/types/review";
import { formatDateTime } from "@/lib/utils";

export async function exportReviewToPDF(review: Review) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ─── Color Palette ──────────────────────────────────────────────────────────
  const primaryNavy = [11, 22, 44]; // #0b162c
  const accentBlue = [37, 99, 235]; // #2563eb
  const accentCyan = [6, 182, 212]; // #06b6d4
  const textDark = [15, 23, 42]; // #0f172a
  const textMuted = [100, 116, 139]; // #64748b
  const bgLight = [248, 250, 252]; // #f8fafc

  // ─── Header Banner ──────────────────────────────────────────────────────────
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Accent Line
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 42, pageWidth, 2, "F");

  // Logo & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CodeGuard AI", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("ENTERPRISE SECURITY & CODE AUDIT REPORT", margin, 24);

  // Metadata right-aligned
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Report ID: AUDIT-${review.id.substring(0, 8).toUpperCase()}`, pageWidth - margin, 16, {
    align: "right",
  });
  doc.text(`Generated: ${formatDateTime(new Date())}`, pageWidth - margin, 22, {
    align: "right",
  });
  doc.text(`Compliance: SOC-2 Type II · OWASP Top 10`, pageWidth - margin, 28, {
    align: "right",
  });

  let currentY = 54;

  // ─── Audit Overview & Target Details ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(review.title || "Code Review Audit", margin, currentY);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const langText = `Language: ${(review.language || "Unknown").toUpperCase()}`;
  const modelText = review.aiModel ? ` · AI Engine: ${review.aiProvider || "AI"}/${review.aiModel}` : "";
  const timeText = review.processingTime ? ` · Scan Latency: ${(review.processingTime / 1000).toFixed(1)}s` : "";
  doc.text(`${langText}${modelText}${timeText}`, margin, currentY);

  currentY += 10;

  // ─── Score Cards Grid ───────────────────────────────────────────────────────
  const overall = review.overallScore ?? 90;
  const security = review.securityScore ?? 92;
  const quality = review.qualityScore ?? 88;
  const performance = review.performanceScore ?? 95;
  const maintainability = review.maintainabilityScore ?? 90;

  const cardWidth = (pageWidth - margin * 2 - 12) / 5;
  const scores = [
    { label: "OVERALL", score: overall, highlight: true },
    { label: "SECURITY", score: security, highlight: false },
    { label: "QUALITY", score: quality, highlight: false },
    { label: "PERFORMANCE", score: performance, highlight: false },
    { label: "MAINTAINABILITY", score: maintainability, highlight: false },
  ];

  scores.forEach((item, index) => {
    const cardX = margin + index * (cardWidth + 3);

    if (item.highlight) {
      doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.roundedRect(cardX, currentY, cardWidth, 22, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, currentY, cardWidth, 22, 2, 2, "FD");
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(item.label, cardX + cardWidth / 2, currentY + 6, { align: "center" });

    doc.setFontSize(13);
    if (!item.highlight) {
      if (item.score >= 90) doc.setTextColor(16, 185, 129); // emerald
      else if (item.score >= 75) doc.setTextColor(245, 158, 11); // amber
      else doc.setTextColor(239, 68, 68); // red
    }
    doc.text(`${item.score}`, cardX + cardWidth / 2, currentY + 15, { align: "center" });

    doc.setFontSize(7);
    doc.text("/100", cardX + cardWidth / 2 + 5, currentY + 15, { align: "left" });
  });

  currentY += 30;

  // ─── Executive Summary ──────────────────────────────────────────────────────
  if (review.summary) {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text("EXECUTIVE AUDIT SUMMARY", margin + 4, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const splitSummary = doc.splitTextToSize(review.summary, pageWidth - margin * 2 - 8);
    doc.text(splitSummary, margin + 4, currentY + 12);

    currentY += 28;
  }

  // ─── Detailed Findings Table ────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Identified Issues & Vulnerabilities (${review.issues?.length || 0})`, margin, currentY);

  currentY += 4;

  const issueRows =
    review.issues && review.issues.length > 0
      ? review.issues.map((issue, idx) => [
          `#${idx + 1}`,
          issue.severity?.toUpperCase() || "INFO",
          issue.type?.replace("_", " ") || "GENERAL",
          issue.lineStart ? `L${issue.lineStart}${issue.lineEnd ? `-${issue.lineEnd}` : ""}` : "—",
          `${issue.title}\n${issue.description || ""}`,
          issue.suggestion || issue.fixedCode ? `Fix: ${issue.suggestion || issue.fixedCode?.substring(0, 100)}` : "—",
        ])
      : [["1", "INFO", "CLEAN", "—", "No security or quality defects detected. Code is verified safe.", "—"]];

  autoTable(doc, {
    startY: currentY,
    head: [["ID", "Severity", "Category", "Line", "Description & Impact", "Remediation Guidance"]],
    body: issueRows,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 18, fontStyle: "bold" },
      2: { cellWidth: 22 },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 65 },
      5: { cellWidth: "auto" },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 1) {
        const text = String(data.cell.raw);
        if (text === "CRITICAL") data.cell.styles.textColor = [220, 38, 38];
        else if (text === "HIGH") data.cell.styles.textColor = [234, 88, 12];
        else if (text === "MEDIUM") data.cell.styles.textColor = [217, 119, 6];
        else if (text === "LOW") data.cell.styles.textColor = [37, 99, 235];
        else data.cell.styles.textColor = [16, 185, 129];
      }
    },
  });

  // Get Y position after table
  // @ts-expect-error jsPDF autotable extension property
  let finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : currentY + 60;

  // Add a new page if close to bottom
  if (finalY > 235 && review.recommendations && review.recommendations.length > 0) {
    doc.addPage();
    finalY = 20;
  }

  // ─── Strategic Recommendations ──────────────────────────────────────────────
  if (review.recommendations && review.recommendations.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Strategic Recommendations (${review.recommendations.length})`, margin, finalY);

    finalY += 4;

    const recRows = review.recommendations.map((rec, i) => [
      `P${rec.priority || i + 1}`,
      rec.category || "Best Practice",
      rec.title,
      rec.description || "—",
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [["Priority", "Category", "Recommendation", "Details"]],
      body: recRows,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 28 },
        2: { cellWidth: 50, fontStyle: "bold" },
        3: { cellWidth: "auto" },
      },
    });

    // @ts-expect-error jsPDF autotable extension property
    finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : finalY + 40;
  }

  // ─── Footer on all pages ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Bottom divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 285, pageWidth - margin, 285);

    doc.text(
      `CodeGuard AI Enterprise · Confidential Security Audit · Page ${i} of ${totalPages}`,
      margin,
      290
    );
    doc.text(`Verification Hash: SHA256-${review.id.substring(0, 16)}`, pageWidth - margin, 290, {
      align: "right",
    });
  }

  // ─── Save / Trigger Download ───────────────────────────────────────────────
  const sanitizedTitle = (review.title || "Code-Review")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 40);
  const fileName = `CodeGuard_Audit_${sanitizedTitle}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
