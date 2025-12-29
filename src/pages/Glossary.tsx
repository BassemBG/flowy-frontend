import { useState, useCallback, useRef, useEffect } from "react";
import { BookOpen, Upload, FileSpreadsheet, Trash2, Eye, Send, Search, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ManagedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mode: "glossary" | "web";
}

export default function Glossary() {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Glossary Assistant. Upload Excel files to build your glossary, then ask me questions. You can search your internal glossary or the web using the toggle above.",
      timestamp: new Date(),
      mode: "glossary",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [searchMode, setSearchMode] = useState<"glossary" | "web">("glossary");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      addFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      addFile(selectedFile);
    }
  };

  const addFile = (file: File) => {
    const newFile: ManagedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
    };
    setFiles((prev) => [...prev, newFile]);
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
      mode: searchMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: searchMode === "glossary"
          ? `[Glossary Search] I searched your uploaded glossary files for "${inputValue}". Here are the relevant terms and definitions I found...\n\n(Connect to AI backend for actual glossary search functionality.)`
          : `[Web Search] I searched the web for "${inputValue}". Here's what I found...\n\n(Connect to AI backend for actual web search functionality.)`,
        timestamp: new Date(),
        mode: searchMode,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isGlossaryMode = searchMode === "glossary";

  return (
    <div className="page-container animate-fade-in h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">AI Glossary Management</h1>
            <p className="page-description">Upload glossaries and chat with your AI assistant</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* File Manager Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upload Zone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload Excel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
                  ${isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Drop Excel file or click
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managed Files */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Managed Files ({files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No files uploaded yet
                </p>
              ) : (
                <ScrollArea className="h-[200px] lg:h-[300px]">
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteFile(file.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Assistant */}
        <Card className="lg:col-span-3 flex flex-col min-h-[500px] lg:min-h-0">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Glossary Chat Assistant
            </CardTitle>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? message.mode === "glossary"
                          ? "bg-blue-500 text-white"
                          : "bg-purple-500 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        {message.mode === "glossary" ? (
                          <Search className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Globe className="h-3 w-3 text-purple-500" />
                        )}
                        <span className={`text-xs font-medium ${message.mode === "glossary" ? "text-blue-500" : "text-purple-500"}`}>
                          {message.mode === "glossary" ? "Glossary" : "Web"}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <ToggleGroup
                type="single"
                value={searchMode}
                onValueChange={(value) => value && setSearchMode(value as "glossary" | "web")}
                className="bg-muted p-1 rounded-lg"
              >
                <ToggleGroupItem
                  value="glossary"
                  className={`px-4 py-2 text-sm rounded-md transition-all ${
                    isGlossaryMode
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Glossary Search
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="web"
                  className={`px-4 py-2 text-sm rounded-md transition-all ${
                    !isGlossaryMode
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Web Search
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isGlossaryMode ? "Search your glossary..." : "Search the web..."}
                  className={`pr-10 transition-all ${
                    isGlossaryMode
                      ? "border-blue-200 focus-visible:ring-blue-500"
                      : "border-purple-200 focus-visible:ring-purple-500"
                  }`}
                />
                {inputValue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setInputValue("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`transition-all ${
                  isGlossaryMode
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-purple-500 hover:bg-purple-600"
                } text-white`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
