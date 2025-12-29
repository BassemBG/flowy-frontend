import { useState, useCallback } from "react";
import { Languages, Upload, FileText, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Translation() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translatedText, setTranslatedText] = useState("");

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
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setTranslatedText("");

    // Read file content
    const text = await selectedFile.text();
    
    // Simulate AI translation processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock translated output (in real implementation, this would call AI API)
    const mockTranslation = `[Translated Document]\n\n${text}\n\n---\nNote: This is a simulated translation. Connect to AI backend for actual translation.`;
    
    setTranslatedText(mockTranslation);
    setIsProcessing(false);
  };

  const clearFile = () => {
    setFile(null);
    setTranslatedText("");
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (!translatedText) return;
    
    const blob = new Blob([translatedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file ? `translated_${file.name.replace(/\.[^/.]+$/, "")}.txt` : "translated_document.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
            <Languages className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">AI Document Translator</h1>
            <p className="page-description">Upload a document and get it translated automatically with AI</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
                  ${isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".txt,.doc,.docx,.pdf,.md"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports .txt, .doc, .docx, .pdf, .md files
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Indicator */}
        {isProcessing && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">Translating your document…</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This may take a moment depending on document size
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Translation Output */}
        {translatedText && !isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Translated Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={translatedText}
                onChange={(e) => setTranslatedText(e.target.value)}
                className="min-h-[400px] font-mono text-sm resize-y"
                placeholder="Translated content will appear here..."
              />
              <p className="text-sm text-muted-foreground">
                You can edit the translation above before downloading.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Download Section */}
        {translatedText && !isProcessing && (
          <Card className="border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Ready to download</p>
                  <p className="text-sm text-muted-foreground">
                    Save your translated document as a text file
                  </p>
                </div>
                <Button onClick={handleDownload} className="gradient-brand text-primary-foreground">
                  <Download className="h-4 w-4 mr-2" />
                  Download Translation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
