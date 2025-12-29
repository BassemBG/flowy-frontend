import { useState } from "react";
import { Sparkles, Filter, BookOpen, TrendingUp, Clock, Star, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecommendedArticle {
  id: string;
  title: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  readTime: string;
  rating: number;
  matchScore: number;
  reason: string;
  thumbnail: string;
}

const mockRecommendations: RecommendedArticle[] = [
  {
    id: "1",
    title: "Advanced Contract Drafting in Legal Translation",
    topic: "Legal",
    difficulty: "advanced",
    readTime: "8 min",
    rating: 4.9,
    matchScore: 98,
    reason: "Based on your interest in legal translation",
    thumbnail: "📜",
  },
  {
    id: "2",
    title: "Cross-Border Commercial Agreements",
    topic: "Legal",
    difficulty: "advanced",
    readTime: "12 min",
    rating: 4.7,
    matchScore: 95,
    reason: "Similar to articles you've bookmarked",
    thumbnail: "🤝",
  },
  {
    id: "3",
    title: "Medical Device Documentation Standards",
    topic: "Medical",
    difficulty: "intermediate",
    readTime: "6 min",
    rating: 4.5,
    matchScore: 88,
    reason: "Popular in your skill level",
    thumbnail: "🏥",
  },
  {
    id: "4",
    title: "EU Regulatory Compliance for Translations",
    topic: "Regulatory",
    difficulty: "intermediate",
    readTime: "10 min",
    rating: 4.6,
    matchScore: 85,
    reason: "Complements your legal translation path",
    thumbnail: "🇪🇺",
  },
  {
    id: "5",
    title: "Introduction to Patent Translation",
    topic: "Legal",
    difficulty: "beginner",
    readTime: "5 min",
    rating: 4.3,
    matchScore: 82,
    reason: "New topic related to your interests",
    thumbnail: "💡",
  },
  {
    id: "6",
    title: "Financial Statement Translation Best Practices",
    topic: "Finance",
    difficulty: "intermediate",
    readTime: "7 min",
    rating: 4.4,
    matchScore: 78,
    reason: "Expands your specialization areas",
    thumbnail: "💰",
  },
  {
    id: "7",
    title: "Technical Writing for Translators",
    topic: "Technology",
    difficulty: "beginner",
    readTime: "4 min",
    rating: 4.2,
    matchScore: 75,
    reason: "Foundational skill for your career",
    thumbnail: "⚙️",
  },
  {
    id: "8",
    title: "Pharmaceutical Labeling Requirements",
    topic: "Medical",
    difficulty: "advanced",
    readTime: "9 min",
    rating: 4.8,
    matchScore: 72,
    reason: "Trending in your community",
    thumbnail: "💊",
  },
];

export function SmartRecommendations() {
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const topics = ["all", ...new Set(mockRecommendations.map((r) => r.topic))];

  const filteredRecommendations = mockRecommendations.filter(
    (rec) => topicFilter === "all" || rec.topic === topicFilter
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "advanced": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Personalized For You</h3>
              <p className="text-sm text-muted-foreground">
                Based on your reading history, interests, and learning goals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-muted-foreground">
          {filteredRecommendations.length} recommendations
        </h4>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((topic) => (
              <SelectItem key={topic} value={topic}>
                {topic === "all" ? "All Topics" : topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecommendations.map((rec) => (
          <Card
            key={rec.id}
            className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
          >
            <CardContent className="p-4 space-y-4">
              {/* Thumbnail & Match Score */}
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center text-2xl">
                  {rec.thumbnail}
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getMatchColor(rec.matchScore)}`}>
                    {rec.matchScore}%
                  </div>
                  <p className="text-xs text-muted-foreground">match</p>
                </div>
              </div>

              {/* Title & Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(rec.difficulty)} variant="secondary">
                    {rec.difficulty}
                  </Badge>
                  <Badge variant="outline">{rec.topic}</Badge>
                </div>
                <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                  {rec.title}
                </h3>
              </div>

              {/* Recommendation Reason */}
              <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {rec.readTime}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {rec.rating}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  Read
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
