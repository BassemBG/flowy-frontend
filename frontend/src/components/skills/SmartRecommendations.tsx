import { useState, useEffect } from "react";
import { Sparkles, Filter, BookOpen, TrendingUp, Clock, Star, ChevronRight, Loader2, RefreshCw, ChevronLeft, Bookmark, BookmarkCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, type Recommendation, type Article } from "@/services/api";

const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || "user_01";

export function SmartRecommendations() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [strategy, setStrategy] = useState<"personalized" | "cold_start">("personalized");
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [applyDiversity, setApplyDiversity] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [userRating, setUserRating] = useState<number>(0);

  useEffect(() => {
    loadRecommendations();
  }, [strategy, limit, applyDiversity]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getRecommendations({
        user_id: DEFAULT_USER_ID,
        limit,
        strategy,
        apply_diversity: applyDiversity,
        include_explanations: true,
      });

      setRecommendations(data);

      if (data.length === 0) {
        toast({
          title: "No recommendations",
          description: "Try reading some articles first to get personalized recommendations!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      toast({
        title: "Error loading recommendations",
        description: error instanceof Error ? error.message : "Failed to fetch recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewArticle = async (articleId: string) => {
    try {
      // Fetch full article details
      const article = await api.getArticle(articleId);

      console.log("Fetched article:", article);

      // Record read interaction
      await api.recordInteraction({
        user_id: DEFAULT_USER_ID,
        article_id: articleId,
        interaction_type: "read",
      });

      setSelectedArticle(article);
      setUserRating(0); // Reset rating when viewing new article

      // Remove the toast notification
    } catch (error) {
      console.error("Failed to load article:", error);
      toast({
        title: "Error",
        description: "Failed to load article details",
        variant: "destructive",
      });
    }
  };

  const handleRating = async (rating: number) => {
    if (!selectedArticle) return;

    try {
      await api.recordInteraction({
        user_id: DEFAULT_USER_ID,
        article_id: selectedArticle.article_id,
        interaction_type: "rate",
        rating,
      });

      setUserRating(rating);

      toast({
        title: "Rating submitted",
        description: `You rated this article ${rating}/5 stars`,
      });
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 90) return "default";
    if (score >= 75) return "secondary";
    return "outline";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  // Article Detail View
  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedArticle(null)} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Recommendations
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{selectedArticle.topic}</Badge>
                  {selectedArticle.quality_score && (
                    <Badge variant="secondary">
                      Quality: {selectedArticle.quality_score.toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedArticle.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {selectedArticle.content ? (
                selectedArticle.content.split("\n\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <p className="text-muted-foreground italic">No content available for this article.</p>
              )}
            </div>

            {selectedArticle.vocabulary && selectedArticle.vocabulary.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Vocabulary ({selectedArticle.vocabulary.length} terms)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.vocabulary.map((term, idx) => (
                    <Badge key={idx} variant="secondary">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Rate this article</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={userRating >= rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRating(rating)}
                    className="gap-1"
                  >
                    <Star className={`h-4 w-4 ${userRating >= rating ? "fill-current" : ""}`} />
                    {rating}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Smart Recommendations</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={strategy} onValueChange={(v: "personalized" | "cold_start") => setStrategy(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personalized">Personalized</SelectItem>
                <SelectItem value="cold_start">Popular (Cold Start)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 items</SelectItem>
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="20">20 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={applyDiversity ? "default" : "outline"}
              onClick={() => setApplyDiversity(!applyDiversity)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {applyDiversity ? "Diversity ON" : "Diversity OFF"}
            </Button>

            <Button onClick={loadRecommendations} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {strategy === "personalized"
                ? "Showing personalized recommendations based on your reading history and preferences."
                : "Showing popular articles recommended for new users."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Card
            key={rec.article_id}
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
          >
            <CardContent className="p-4 space-y-3">
              {/* Header with Match Score */}
              <div className="flex items-start justify-between">
                <Badge variant={getScoreBadgeVariant(rec.score)} className="gap-1">
                  <Star className="h-3 w-3" />
                  {rec.score.toFixed(0)}% Match
                </Badge>
                <Badge variant="outline">{rec.topic}</Badge>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {rec.title}
              </h3>

              {/* Explanation */}
              {rec.explanation && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {rec.explanation}
                </p>
              )}

              {/* Component Scores (if available) */}
              {rec.component_scores && Object.keys(rec.component_scores).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Score Breakdown:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(rec.component_scores).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className={getScoreColor(value * 100)}>
                          {(value * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Article Button */}
              <Button
                variant="ghost"
                className="w-full gap-2 group-hover:bg-primary/10"
                onClick={() => handleViewArticle(rec.article_id)}
              >
                <BookOpen className="h-4 w-4" />
                View Article
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {recommendations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">No Recommendations Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {strategy === "personalized"
                  ? "Start reading some articles to get personalized recommendations based on your interests!"
                  : "No popular articles found. Try generating some articles first!"}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadRecommendations} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={() => setStrategy(strategy === "personalized" ? "cold_start" : "personalized")}
                variant="default"
              >
                Try {strategy === "personalized" ? "Popular" : "Personalized"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">How recommendations work</p>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your reading patterns, ratings, and preferences to suggest articles that match your
                interests. The match score combines content similarity, topic relevance, recency, and community ratings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
