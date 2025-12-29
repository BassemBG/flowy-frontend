import { useState, useRef } from "react";
import { Mic, Upload, Square, Play, Pause, FileText, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EvaluationResult {
  overallScore: number;
  breakdowns: {
    name: string;
    score: number;
    weight: number;
    weightedScore: number;
  }[];
  category: "Excellent" | "Good" | "Needs Work" | "Poor";
  recommendations: string[];
}

const referenceArticles = [
  { id: "1", title: "Legal Translation: Key Principles and Best Practices" },
  { id: "2", title: "Medical Translation: Terminology and Precision" },
  { id: "3", title: "Introduction to CAT Tools for Translators" },
  { id: "4", title: "Financial Translation: Numbers, Culture, and Precision" },
];

const progressHistory = [
  { date: "Week 1", score: 62 },
  { date: "Week 2", score: 68 },
  { date: "Week 3", score: 71 },
  { date: "Week 4", score: 75 },
  { date: "Week 5", score: 73 },
  { date: "Week 6", score: 79 },
  { date: "Week 7", score: 82 },
  { date: "Week 8", score: 85 },
];

export function TranslationEvaluator() {
  const [selectedArticle, setSelectedArticle] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setResult(null);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      // Simulate recording completion
      setAudioFile(new File([], "recording.webm"));
      setResult(null);
    }
  };

  const evaluateTranslation = async () => {
    if (!audioFile || !selectedArticle) return;
    
    setIsEvaluating(true);
    
    // Simulate evaluation
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    const mockResult: EvaluationResult = {
      overallScore: 82,
      breakdowns: [
        { name: "Semantic Similarity", score: 85, weight: 40, weightedScore: 34 },
        { name: "Grammar", score: 78, weight: 15, weightedScore: 11.7 },
        { name: "Terminology", score: 88, weight: 15, weightedScore: 13.2 },
        { name: "Fluency", score: 72, weight: 5, weightedScore: 3.6 },
        { name: "Content Coverage", score: 79, weight: 25, weightedScore: 19.75 },
      ],
      category: "Good",
      recommendations: [
        "Focus on improving fluency by practicing natural speech patterns",
        "Review terminology for specialized legal terms like 'functional equivalence'",
        "Work on maintaining consistent pacing throughout longer translations",
        "Consider joining a practice group for real-time feedback",
      ],
    };
    
    setResult(mockResult);
    setIsEvaluating(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Excellent":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" /> Excellent
        </Badge>;
      case "Good":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <CheckCircle className="h-3 w-3 mr-1" /> Good
        </Badge>;
      case "Needs Work":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <AlertCircle className="h-3 w-3 mr-1" /> Needs Work
        </Badge>;
      default:
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3 mr-1" /> Poor
        </Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload/Record Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Upload or Record Translation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Article Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference Article</label>
              <Select value={selectedArticle} onValueChange={setSelectedArticle}>
                <SelectTrigger>
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select an article to translate" />
                </SelectTrigger>
                <SelectContent>
                  {referenceArticles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recording Interface */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={toggleRecording}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Audio
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Waveform Visualization (Placeholder) */}
              <div className="h-24 bg-muted rounded-lg flex items-center justify-center border border-border relative overflow-hidden">
                {isRecording ? (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 60 + 10}%`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                ) : audioFile ? (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-primary/60 rounded-full"
                          style={{ height: `${Math.sin(i * 0.3) * 30 + 35}%` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">0:00 / 2:34</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Audio waveform will appear here
                  </p>
                )}
              </div>

              {audioFile && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{audioFile.name || "Recording"}</span>
                  <Button
                    onClick={evaluateTranslation}
                    disabled={!selectedArticle || isEvaluating}
                    className="gradient-brand text-primary-foreground"
                  >
                    {isEvaluating ? "Evaluating..." : "Evaluate Translation"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {result && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Evaluation Results</CardTitle>
              {getCategoryBadge(result.category)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="flex items-center gap-6 p-6 bg-muted/30 rounded-xl">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
              </div>
              <div className="flex-1">
                <Progress value={result.overallScore} className="h-4" />
              </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {result.breakdowns.map((breakdown) => (
                <Card key={breakdown.name} className="bg-muted/30">
                  <CardContent className="p-4 text-center space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">{breakdown.name}</p>
                    <p className={`text-2xl font-bold ${getScoreColor(breakdown.score)}`}>
                      {breakdown.score}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Weight: {breakdown.weight}%
                    </p>
                    <Progress value={breakdown.score} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Improvement Recommendations
              </h4>
              <ScrollArea className="h-[120px]">
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
