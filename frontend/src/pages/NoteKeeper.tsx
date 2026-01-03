import { useState } from "react";
import {
  FileText,
  Mic,
  Square,
  ChevronLeft,
  Save,
  FileDown,
  Eye,
  History,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type RecordingStatus = "idle" | "recording" | "processing" | "complete" | "error";
type ErrorType = "mic_not_found" | "processing_failed" | "no_speech" | "report_failed" | null;

interface Report {
  id: string;
  date: Date;
  clientName: string;
  tasks: { task: string; dueDate?: string }[];
}

const mockReports: Report[] = [
  {
    id: "1",
    date: new Date("2024-01-15T10:30:00"),
    clientName: "John Smith",
    tasks: [
      { task: "Prepare Q4 financial summary", dueDate: "2024-01-22" },
      { task: "Send tax documentation request", dueDate: "2024-01-18" },
      { task: "Schedule follow-up meeting", dueDate: "2024-01-20" },
    ],
  },
  {
    id: "2",
    date: new Date("2024-01-12T14:00:00"),
    clientName: "Sarah Johnson",
    tasks: [
      { task: "Draft updated will", dueDate: "2024-01-25" },
      { task: "Request marriage certificate", dueDate: "2024-01-15" },
    ],
  },
  {
    id: "3",
    date: new Date("2024-01-10T09:00:00"),
    clientName: "ABC Corporation",
    tasks: [
      { task: "Prepare updated contract", dueDate: "2024-01-17" },
      { task: "Send for legal review", dueDate: "2024-01-19" },
    ],
  },
];

export default function NoteKeeper() {
  const [activeTab, setActiveTab] = useState<"recording" | "history">("recording");
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableReport, setEditableReport] = useState<Report | null>(null);

  const getStatusMessage = () => {
    if (errorType) {
      switch (errorType) {
        case "mic_not_found":
          return { text: "Microphone not detected. Please check your device.", type: "error" };
        case "processing_failed":
          return { text: "Audio processing failed. Please try again.", type: "error" };
        case "no_speech":
          return { text: "No speech detected in the recording.", type: "error" };
        case "report_failed":
          return { text: "Unable to generate the report. Please record again or check audio quality.", type: "error" };
      }
    }
    switch (recordingStatus) {
      case "idle":
        return { text: "No recording in progress. Press Start Recording to begin.", type: "idle" };
      case "recording":
        return { text: "Recording started successfully. The system is listening…", type: "recording" };
      case "processing":
        return { text: "Recording stopped. Processing audio, please wait…", type: "processing" };
      case "complete":
        return { text: "Report generated successfully.", type: "success" };
      default:
        return { text: "", type: "idle" };
    }
  };

  // Simulate starting a recording (no real microphone access required for demo)
  const startRecording = async () => {
    setErrorType(null);
    setCurrentReport(null);
    try {
      setRecordingStatus("recording");
    } catch {
      setErrorType("mic_not_found");
      setRecordingStatus("error");
    }
  };

  // Simulate stopping recording and generating the simplified demo report
  const stopRecording = async () => {
    if (recordingStatus !== "recording") return;
    setRecordingStatus("processing");
    setErrorType(null);

    try {
      // simulate small processing delay
      await new Promise((r) => setTimeout(r, 2000));

      const newReport: Report = {
        id: Date.now().toString(),
        // use 05/01/2026 (day/month/year). create date for display but we will format as dd/mm/yyyy explicitly
        date: new Date(2026, 0, 5),
        clientName: "Sara",
        tasks: [
          { task: "Translate the baccalaureate certificate from French to English", dueDate: "2026-01-05" },
          { task: "Send it by next Monday", dueDate: "2026-01-12" },
        ],
      };

      setCurrentReport(newReport);
      setReports((prev) => [newReport, ...prev]);
      setRecordingStatus("complete");
      setActiveTab("recording");
    } catch (err) {
      console.error("Stop recording failed (demo)", err);
      setErrorType("processing_failed");
      setRecordingStatus("error");
    }
  };

  const saveReport = () => {
    // Demo: move to history view, clear current view
    setActiveTab("history");
    setCurrentReport(null);
    setRecordingStatus("idle");
  };

  // Export the styled report using html2canvas + jsPDF
  const exportPDF = async () => {
  const report = (isEditing && editableReport) ? editableReport : (viewingReport || currentReport);
  if (!report) return;

  const formatDate = (d: Date | string) => {
    try {
      const date = d instanceof Date ? d : new Date(d);
      return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
    } catch {
      return String(d);
    }
  };

  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40; // pts
    const usableWidth = pageWidth - margin * 2;
    let y = 0;

    // Create a small canvas for the pink gradient header
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 140;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "#ff9ec8");
      grad.addColorStop(1, "#ff6fb5");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title text on gradient (white)
      ctx.fillStyle = "#ffffff";
      const titleFontSize = 48;
      ctx.font = `bold ${titleFontSize}px Helvetica, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(report.clientName || "Sara", canvas.width / 2, canvas.height / 2 - 6);
    }

    const headerImg = canvas.toDataURL("image/png");
    const headerHeight = 120; // pts
    doc.addImage(headerImg, "PNG", 0, 0, pageWidth, headerHeight);
    y = headerHeight + 20;

    // Date under header, centered
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor("#333333");
    doc.text(`Date: ${formatDate(report.date)}`, pageWidth / 2, y, { align: "center" });
    y += 28;

    // Divider line
    doc.setDrawColor(220);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    // Tasks heading with pink accent
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor("#d63384"); // deep pink
    doc.text("Tasks", margin, y);
    y += 14;

    // Tasks list
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor("#111111");
    const lineHeight = 16;

    for (let i = 0; i < report.tasks.length; i++) {
      const t = report.tasks[i];
      const indexLabel = `${i + 1}. `;
      const text = `${indexLabel}${t.task}`;
      const split = (doc as any).splitTextToSize(text, usableWidth - 40);
      for (let j = 0; j < split.length; j++) {
        doc.text(split[j], margin + 20, y);
        y += lineHeight;
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      }

      // Due date on the same line at the right
      if (t.dueDate) {
        doc.setFontSize(10);
        doc.setTextColor("#666666");
        const dueText = `Due: ${formatDate(t.dueDate)}`;
        doc.text(dueText, pageWidth - margin, y - (lineHeight * (split.length === 0 ? 1 : 0)), { align: "right" });
        doc.setFontSize(11);
        doc.setTextColor("#111111");
      }

      y += 6;
      if (y > pageHeight - margin && i < report.tasks.length - 1) {
        doc.addPage();
        y = margin;
      }
    }

    // Footer (optional): small branding text
    doc.setFontSize(9);
    doc.setTextColor("#999999");
    doc.text("Generated by AI NoteKeeper", pageWidth / 2, pageHeight - 30, { align: "center" });

    doc.save(`report_${report.id}.pdf`);
  } catch (err) {
    console.error("PDF export failed", err);
    alert("PDF export failed. Make sure jsPDF is installed.");
  }
};

  const statusMessage = getStatusMessage();

  const formatDisplayDate = (d?: Date | string) => {
    if (!d) return "";
    try {
      const date = d instanceof Date ? d : new Date(d);
      return date.toLocaleDateString("en-GB");
    } catch {
      return String(d);
    }
  };

  const toInputDate = (d?: Date | string) => {
    if (!d) return "";
    try {
      const date = d instanceof Date ? d : new Date(d);
      return date.toISOString().slice(0, 10);
    } catch {
      return String(d);
    }
  };

  // View Report Screen
  if (viewingReport) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="page-title">AI NoteKeeper</h1>
              <p className="page-description">View generated report</p>
            </div>
          </div>
        </div>

        <div id="report-card" className="mx-auto w-full max-w-3xl">
          <Card className="rounded-lg shadow-lg">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {viewingReport.date.toLocaleDateString("en-GB")}
                  </p>
                  <CardTitle className="text-xl mt-1">{viewingReport.clientName}</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Client Information</h3>
                <p className="text-foreground">{viewingReport.clientName}</p>
                <p className="text-sm text-muted-foreground">{viewingReport.date.toLocaleDateString("en-GB")}</p>
              </section>

              <Separator />

              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks</h3>
                <ul className="space-y-2">
                  {viewingReport.tasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-foreground">{task.task}</p>
                        {task.dueDate && <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </CardContent>

            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" onClick={() => setViewingReport(null)}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button variant="outline" className="ml-auto" onClick={saveReport}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button onClick={exportPDF}>
                <FileDown className="h-4 w-4 mr-2" /> Export PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Generated Report Screen (after recording)
  if (currentReport && recordingStatus === "complete") {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="page-title">AI NoteKeeper</h1>
              <p className="page-description">Generated report from your recording</p>
            </div>
          </div>
        </div>

        <div id="report-card" className="mx-auto w-full max-w-3xl">
          <Card className="rounded-lg shadow-lg">
            <CardHeader className="border-b border-border bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Report generated successfully</span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {isEditing && editableReport ? (
                  <>
                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Client Information</h3>
                      <input
                        className="w-full p-2 border rounded"
                        value={editableReport.clientName}
                        onChange={(e) => setEditableReport({ ...(editableReport as Report), clientName: e.target.value })}
                      />
                      <input
                        type="date"
                        className="mt-2 p-2 border rounded"
                        value={toInputDate(editableReport.date)}
                        onChange={(e) => setEditableReport({ ...(editableReport as Report), date: new Date(e.target.value) })}
                      />
                    </section>

                    <Separator />

                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks</h3>
                      <ul className="space-y-2">
                        {editableReport.tasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">{idx + 1}</span>
                            <div className="flex-1 space-y-1">
                              <input
                                className="w-full p-2 border rounded"
                                value={task.task}
                                onChange={(e) => {
                                  const updated = { ...(editableReport as Report) } as Report;
                                  updated.tasks = updated.tasks.map((t, i) => i === idx ? { ...t, task: e.target.value } : t);
                                  setEditableReport(updated);
                                }}
                              />
                              <input
                                type="date"
                                className="p-2 border rounded"
                                value={task.dueDate ? toInputDate(task.dueDate) : ""}
                                onChange={(e) => {
                                  const updated = { ...(editableReport as Report) } as Report;
                                  updated.tasks = updated.tasks.map((t, i) => i === idx ? { ...t, dueDate: e.target.value } : t);
                                  setEditableReport(updated);
                                }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                ) : (
                  <>
                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Client Information</h3>
                      <p className="text-foreground">{currentReport.clientName}</p>
                      <p className="text-sm text-muted-foreground">{formatDisplayDate(currentReport.date)}</p>
                    </section>

                    <Separator />

                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks</h3>
                      <ul className="space-y-2">
                        {currentReport.tasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">{idx + 1}</span>
                            <div>
                              <p className="text-foreground">{task.task}</p>
                              {task.dueDate && <p className="text-sm text-muted-foreground">Due: {formatDisplayDate(task.dueDate)}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )}
            </CardContent>

            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" onClick={() => { setCurrentReport(null); setRecordingStatus("idle"); }}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Back
              </Button>

              {!isEditing ? (
                <>
                  <Button variant="outline" className="ml-auto" onClick={saveReport}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => {
                    if (!currentReport) return;
                    setEditableReport({
                      id: currentReport.id,
                      date: new Date(currentReport.date),
                      clientName: currentReport.clientName,
                      tasks: currentReport.tasks.map((t) => ({ ...t })),
                    });
                    setIsEditing(true);
                  }}>
                    Edit
                  </Button>
                  <Button onClick={exportPDF}>
                    <FileDown className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="ml-auto" onClick={() => {
                    // Apply edits
                    if (!editableReport) return;
                    setCurrentReport(editableReport);
                    setReports((prev) => prev.map((r) => r.id === editableReport.id ? editableReport : r));
                    setIsEditing(false);
                    setEditableReport(null);
                  }}>
                    Save Changes
                  </Button>
                  <Button variant="ghost" onClick={() => { setIsEditing(false); setEditableReport(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={exportPDF}>
                    <FileDown className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Default (recording / history)
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">AI NoteKeeper</h1>
            <p className="page-description">Record conversations and generate AI reports</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "recording" ? "default" : "outline"}
          onClick={() => setActiveTab("recording")}
          className={activeTab === "recording" ? "gradient-brand text-primary-foreground" : ""}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Recording
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
          className={activeTab === "history" ? "gradient-brand text-primary-foreground" : ""}
        >
          <History className="h-4 w-4 mr-2" />
          Reports History
        </Button>
      </div>

      {/* Recording Tab */}
      {activeTab === "recording" && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Status Message */}
              <div
                className={`p-4 rounded-lg w-full ${
                  statusMessage.type === "error"
                    ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30"
                    : statusMessage.type === "success"
                    ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30"
                    : statusMessage.type === "recording"
                    ? "bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30"
                    : statusMessage.type === "processing"
                    ? "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30"
                    : "bg-muted/30 border border-border"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {statusMessage.type === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {statusMessage.type === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {statusMessage.type === "recording" && <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />}
                  {statusMessage.type === "processing" && <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />}
                  <p
                    className={`${
                      statusMessage.type === "error"
                        ? "text-red-600 dark:text-red-400"
                        : statusMessage.type === "success"
                        ? "text-green-600 dark:text-green-400"
                        : statusMessage.type === "recording"
                        ? "text-blue-600 dark:text-blue-400"
                        : statusMessage.type === "processing"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {statusMessage.text}
                  </p>
                </div>
              </div>

              {/* Recording Animation */}
              {recordingStatus === "recording" && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 40 + 10}px`,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button
                  size="lg"
                  className="flex-1 h-14 text-lg bg-green-500 hover:bg-green-600 text-white"
                  onClick={startRecording}
                  disabled={recordingStatus === "recording" || recordingStatus === "processing"}
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="flex-1 h-14 text-lg"
                  onClick={stopRecording}
                  disabled={recordingStatus !== "recording"}
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              </div>

              {/* Clear Error Button */}
              {errorType && (
                <Button variant="outline" onClick={() => { setErrorType(null); setRecordingStatus("idle"); }}>
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reports History</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No reports found. Start a new recording to generate your first report.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{report.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.date.toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setViewingReport(report)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}