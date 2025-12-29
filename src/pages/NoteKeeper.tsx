import { useState } from "react";
import { FileText, Mic, Square, ChevronLeft, Save, FileDown, Eye, History, Plus, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
  summary: string;
  tasks: { task: string; dueDate?: string }[];
  importantDates: { event: string; date: string }[];
}

const mockReports: Report[] = [
  {
    id: "1",
    date: new Date("2024-01-15T10:30:00"),
    clientName: "John Smith",
    summary: "Discussed quarterly financial review and upcoming audit preparations. Client expressed concerns about tax implications of new investments. Agreed to schedule follow-up meeting next month to review updated portfolio allocation.",
    tasks: [
      { task: "Prepare Q4 financial summary", dueDate: "2024-01-22" },
      { task: "Send tax documentation request", dueDate: "2024-01-18" },
      { task: "Schedule follow-up meeting", dueDate: "2024-01-20" },
    ],
    importantDates: [
      { event: "Tax filing deadline", date: "2024-04-15" },
      { event: "Follow-up meeting", date: "2024-02-15" },
    ],
  },
  {
    id: "2",
    date: new Date("2024-01-12T14:00:00"),
    clientName: "Sarah Johnson",
    summary: "Initial consultation regarding estate planning. Reviewed current will and discussed updates needed following recent marriage. Client to provide spouse documentation.",
    tasks: [
      { task: "Draft updated will", dueDate: "2024-01-25" },
      { task: "Request marriage certificate", dueDate: "2024-01-15" },
    ],
    importantDates: [
      { event: "Document review meeting", date: "2024-01-30" },
    ],
  },
  {
    id: "3",
    date: new Date("2024-01-10T09:00:00"),
    clientName: "ABC Corporation",
    summary: "Annual contract renewal discussion. Negotiated terms for 2024 service agreement. Minor adjustments to scope of work approved by both parties.",
    tasks: [
      { task: "Prepare updated contract", dueDate: "2024-01-17" },
      { task: "Send for legal review", dueDate: "2024-01-19" },
    ],
    importantDates: [
      { event: "Contract signing", date: "2024-01-31" },
      { event: "Service start date", date: "2024-02-01" },
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

  const startRecording = async () => {
    setErrorType(null);
    setCurrentReport(null);
    
    // Simulate microphone check
    try {
      // In real implementation, check for microphone access
      setRecordingStatus("recording");
    } catch {
      setErrorType("mic_not_found");
    }
  };

  const stopRecording = async () => {
    setRecordingStatus("processing");
    
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Simulate successful report generation
    const newReport: Report = {
      id: Date.now().toString(),
      date: new Date(),
      clientName: "New Client",
      summary: "Meeting notes from the recorded conversation. The discussion covered project timelines, deliverables, and next steps for the collaboration.",
      tasks: [
        { task: "Send project proposal", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
        { task: "Schedule follow-up call", dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
      ],
      importantDates: [
        { event: "Project kickoff", date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
      ],
    };
    
    setCurrentReport(newReport);
    setReports((prev) => [newReport, ...prev]);
    setRecordingStatus("complete");
  };

  const saveReport = () => {
    // In real implementation, save to database
    setActiveTab("history");
    setCurrentReport(null);
    setRecordingStatus("idle");
  };

  const exportPDF = () => {
    // In real implementation, generate and download PDF
    alert("PDF export would be triggered here");
  };

  const statusMessage = getStatusMessage();

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

        <Card className="max-w-3xl mx-auto">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {viewingReport.date.toLocaleDateString()} at {viewingReport.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <CardTitle className="text-xl mt-1">{viewingReport.clientName}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Client Information</h3>
              <p className="text-foreground">{viewingReport.clientName}</p>
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conversation Summary</h3>
              <p className="text-foreground leading-relaxed">{viewingReport.summary}</p>
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
                      {task.dueDate && (
                        <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Important Dates</h3>
              <ul className="space-y-2">
                {viewingReport.importantDates.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-foreground">{item.event}</span>
                    <span className="text-sm text-muted-foreground">{item.date}</span>
                  </li>
                ))}
              </ul>
            </section>
          </CardContent>
          <div className="p-6 border-t border-border flex gap-3">
            <Button variant="outline" onClick={() => setViewingReport(null)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" className="ml-auto">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={exportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </Card>
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

        <Card className="max-w-3xl mx-auto">
          <CardHeader className="border-b border-border bg-green-50 dark:bg-green-900/10">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Report generated successfully</span>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Client Information</h3>
              <p className="text-foreground">{currentReport.clientName}</p>
              <p className="text-sm text-muted-foreground">
                {currentReport.date.toLocaleDateString()} at {currentReport.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conversation Summary</h3>
              <p className="text-foreground leading-relaxed">{currentReport.summary}</p>
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks and Important Dates</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Tasks</h4>
                  <ul className="space-y-2">
                    {currentReport.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-foreground">{task.task}</p>
                          {task.dueDate && (
                            <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Important Dates</h4>
                  <ul className="space-y-2">
                    {currentReport.importantDates.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <span className="text-foreground">{item.event}</span>
                        <span className="text-sm text-muted-foreground">{item.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </CardContent>
          <div className="p-6 border-t border-border flex gap-3">
            <Button variant="outline" onClick={() => { setCurrentReport(null); setRecordingStatus("idle"); }}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" className="ml-auto" onClick={saveReport}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={exportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
              <div className={`p-4 rounded-lg w-full ${
                statusMessage.type === "error"
                  ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30"
                  : statusMessage.type === "success"
                  ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30"
                  : statusMessage.type === "recording"
                  ? "bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30"
                  : statusMessage.type === "processing"
                  ? "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30"
                  : "bg-muted/30 border border-border"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {statusMessage.type === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {statusMessage.type === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {statusMessage.type === "recording" && (
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  )}
                  {statusMessage.type === "processing" && (
                    <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                  )}
                  <p className={`${
                    statusMessage.type === "error"
                      ? "text-red-600 dark:text-red-400"
                      : statusMessage.type === "success"
                      ? "text-green-600 dark:text-green-400"
                      : statusMessage.type === "recording"
                      ? "text-blue-600 dark:text-blue-400"
                      : statusMessage.type === "processing"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-muted-foreground"
                  }`}>
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
                <Button
                  variant="outline"
                  onClick={() => { setErrorType(null); setRecordingStatus("idle"); }}
                >
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
                          {report.date.toLocaleDateString()} at {report.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingReport(report)}
                      >
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
