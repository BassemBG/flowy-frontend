import { useState } from "react";
import { Hand, Play, Pause, RotateCcw, Eye, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface GlossWord {
  english: string;
  gloss: string;
  note?: string;
}

export function ASLTranslator() {
  const [inputText, setInputText] = useState("");
  const [glossResult, setGlossResult] = useState<GlossWord[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [activeView, setActiveView] = useState<"front" | "side" | "top" | "profile">("front");

  const translateToGloss = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    
    // Simulate translation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock ASL gloss translation
    const words = inputText.toLowerCase().split(/\s+/);
    const mockGloss: GlossWord[] = words.map((word) => {
      // Simplified mock conversion rules
      const glossMap: Record<string, { gloss: string; note?: string }> = {
        "i": { gloss: "ME", note: "Point to self" },
        "am": { gloss: "", note: "Often omitted in ASL" },
        "is": { gloss: "", note: "Often omitted in ASL" },
        "are": { gloss: "", note: "Often omitted in ASL" },
        "the": { gloss: "", note: "Articles omitted" },
        "a": { gloss: "", note: "Articles omitted" },
        "an": { gloss: "", note: "Articles omitted" },
        "hello": { gloss: "HELLO", note: "Wave or salute" },
        "how": { gloss: "HOW" },
        "you": { gloss: "YOU", note: "Point to person" },
        "what": { gloss: "WHAT" },
        "name": { gloss: "NAME" },
        "my": { gloss: "MY", note: "Flat hand on chest" },
        "your": { gloss: "YOUR", note: "Point to person" },
        "please": { gloss: "PLEASE", note: "Circular motion on chest" },
        "thank": { gloss: "THANK-YOU", note: "Hand from chin forward" },
        "sorry": { gloss: "SORRY", note: "Fist circles on chest" },
        "help": { gloss: "HELP", note: "Fist on palm, lift up" },
        "understand": { gloss: "UNDERSTAND", note: "Flick finger near forehead" },
        "learn": { gloss: "LEARN", note: "Hand from book to head" },
        "want": { gloss: "WANT", note: "Clawing motion toward self" },
        "need": { gloss: "NEED", note: "X handshape, bend down" },
        "good": { gloss: "GOOD", note: "Flat hand from chin down" },
        "bad": { gloss: "BAD", note: "Hand from chin, flip over" },
        "yes": { gloss: "YES", note: "Fist nods" },
        "no": { gloss: "NO", note: "Index and middle fingers close" },
      };
      
      const mapping = glossMap[word];
      if (mapping) {
        return { english: word, ...mapping };
      }
      return { english: word, gloss: word.toUpperCase() };
    }).filter((w) => w.gloss !== "");
    
    setGlossResult(mockGloss);
    setIsTranslating(false);
  };

  const generateVisualization = () => {
    setShowVisualization(true);
    setIsPlaying(true);
  };

  const viewLabels = {
    front: "Front View",
    side: "Side View",
    top: "Top View",
    profile: "Profile View",
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hand className="h-5 w-5 text-primary" />
            English to ASL Translator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter English text to translate to ASL gloss..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex gap-3">
            <Button
              onClick={translateToGloss}
              disabled={!inputText.trim() || isTranslating}
              className="gradient-brand text-primary-foreground"
            >
              {isTranslating ? "Translating..." : "Translate to ASL Gloss"}
            </Button>
            {inputText && (
              <Button variant="outline" onClick={() => { setInputText(""); setGlossResult([]); setShowVisualization(false); }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gloss Result */}
      {glossResult.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">ASL Gloss Output</CardTitle>
              <Button
                onClick={generateVisualization}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Generate Visualization
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
              {glossResult.map((word, idx) => (
                <div key={idx} className="group relative">
                  <Badge
                    variant="secondary"
                    className="text-lg px-3 py-1.5 cursor-help bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {word.gloss}
                  </Badge>
                  {word.note && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {word.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Hover over each gloss word for signing notes
            </p>
          </CardContent>
        </Card>
      )}

      {/* 3D Visualization */}
      {showVisualization && (
        <Card className="border-purple-200 dark:border-purple-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Maximize2 className="h-5 w-5 text-purple-500" />
                3D Pose Visualization
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  <Slider
                    value={playbackSpeed}
                    onValueChange={setPlaybackSpeed}
                    min={0.5}
                    max={2}
                    step={0.25}
                    className="w-24"
                  />
                  <span className="text-sm font-medium w-8">{playbackSpeed}x</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View Selector */}
            <div className="flex gap-2 justify-center">
              {(["front", "side", "top", "profile"] as const).map((view) => (
                <Button
                  key={view}
                  variant={activeView === view ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveView(view)}
                  className={activeView === view ? "bg-purple-500 hover:bg-purple-600" : ""}
                >
                  {viewLabels[view]}
                </Button>
              ))}
            </div>

            {/* 4-View Grid */}
            <div className="grid grid-cols-2 gap-4">
              {(["front", "side", "top", "profile"] as const).map((view) => (
                <div
                  key={view}
                  className={`aspect-square rounded-xl border-2 transition-all cursor-pointer ${
                    activeView === view
                      ? "border-purple-500 bg-purple-500/5"
                      : "border-border bg-muted/30 hover:border-purple-300"
                  }`}
                  onClick={() => setActiveView(view)}
                >
                  <div className="h-full flex flex-col items-center justify-center p-4">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Simplified 3D Pose Placeholder */}
                      <svg
                        viewBox="0 0 100 100"
                        className={`w-3/4 h-3/4 ${isPlaying ? "animate-pulse" : ""}`}
                      >
                        {view === "front" && (
                          <>
                            {/* Head */}
                            <circle cx="50" cy="20" r="10" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                            {/* Body */}
                            <line x1="50" y1="30" x2="50" y2="60" className="stroke-purple-600" strokeWidth="3" />
                            {/* Arms */}
                            <line x1="50" y1="35" x2="25" y2="50" className="stroke-purple-600" strokeWidth="3" />
                            <line x1="50" y1="35" x2="75" y2="50" className="stroke-purple-600" strokeWidth="3" />
                            {/* Hands */}
                            <circle cx="25" cy="50" r="5" className="fill-purple-300 stroke-purple-600" strokeWidth="2" />
                            <circle cx="75" cy="50" r="5" className="fill-purple-300 stroke-purple-600" strokeWidth="2" />
                            {/* Legs */}
                            <line x1="50" y1="60" x2="35" y2="85" className="stroke-purple-600" strokeWidth="3" />
                            <line x1="50" y1="60" x2="65" y2="85" className="stroke-purple-600" strokeWidth="3" />
                          </>
                        )}
                        {view === "side" && (
                          <>
                            {/* Head */}
                            <ellipse cx="50" cy="20" rx="8" ry="10" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                            {/* Body */}
                            <line x1="50" y1="30" x2="50" y2="60" className="stroke-purple-600" strokeWidth="3" />
                            {/* Arm */}
                            <line x1="50" y1="35" x2="65" y2="50" className="stroke-purple-600" strokeWidth="3" />
                            <circle cx="65" cy="50" r="5" className="fill-purple-300 stroke-purple-600" strokeWidth="2" />
                            {/* Leg */}
                            <line x1="50" y1="60" x2="50" y2="85" className="stroke-purple-600" strokeWidth="3" />
                          </>
                        )}
                        {view === "top" && (
                          <>
                            {/* Head from top */}
                            <circle cx="50" cy="50" r="12" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                            {/* Shoulders */}
                            <line x1="30" y1="50" x2="70" y2="50" className="stroke-purple-600" strokeWidth="3" />
                            {/* Arms */}
                            <line x1="30" y1="50" x2="20" y2="40" className="stroke-purple-600" strokeWidth="3" />
                            <line x1="70" y1="50" x2="80" y2="40" className="stroke-purple-600" strokeWidth="3" />
                            {/* Hands */}
                            <circle cx="20" cy="40" r="4" className="fill-purple-300 stroke-purple-600" strokeWidth="2" />
                            <circle cx="80" cy="40" r="4" className="fill-purple-300 stroke-purple-600" strokeWidth="2" />
                          </>
                        )}
                        {view === "profile" && (
                          <>
                            {/* Head */}
                            <ellipse cx="50" cy="20" rx="10" ry="10" className="fill-purple-400 stroke-purple-600" strokeWidth="2" />
                            {/* Face features */}
                            <circle cx="55" cy="18" r="2" className="fill-purple-600" />
                            {/* Body */}
                            <line x1="50" y1="30" x2="48" y2="60" className="stroke-purple-600" strokeWidth="3" />
                            {/* Arm */}
                            <line x1="48" y1="38" x2="35" y2="50" className="stroke-purple-600" strokeWidth="3" />
                            <circle cx="35" cy="50" r="5" className="fill-purple-300 stroke-purple-600" strokeWidth="2" />
                            {/* Leg */}
                            <line x1="48" y1="60" x2="45" y2="85" className="stroke-purple-600" strokeWidth="3" />
                          </>
                        )}
                      </svg>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {viewLabels[view]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
              <Button variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                className="bg-purple-500 hover:bg-purple-600 text-white px-8"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Play
                  </>
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                Sign {glossResult.length > 0 ? 1 : 0} of {glossResult.length}
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              3D visualization is a placeholder. Connect to a pose estimation backend for actual animation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
