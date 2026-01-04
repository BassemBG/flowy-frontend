import { useState, useEffect } from "react";
import { Search, Filter, Calendar, BookOpen, Star, Bookmark, BookmarkCheck, ChevronLeft, Loader2, RefreshCw, Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { api, type Article as APIArticle } from "@/services/api";

interface Article {
  id: string;
  title: string;
  topic: string;
  date: string;
  content: string;
  vocabulary: string[];
  quality_score?: number;
  isBookmarked: boolean;
  rating: number;
}

const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || "user_01";

export function NewsletterSystem() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [topics, setTopics] = useState<string[]>(["all"]);

  // Article generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [genTopics, setGenTopics] = useState<string>("");
  const [countPerTopic, setCountPerTopic] = useState(1);
  const [qualityThreshold, setQualityThreshold] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(2);

  // Fetch articles on mount
  useEffect(() => {
    loadArticles();
    loadTopics();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const data = await api.getArticles({ limit: 50 });

      // Transform API data to component format
      const transformedArticles: Article[] = data.map((article: APIArticle) => ({
        id: article.article_id,
        title: article.title,
        topic: article.topic,
        date: article.created_at,
        content: article.content,
        vocabulary: article.vocabulary || [],
        quality_score: article.quality_score,
        isBookmarked: false, // TODO: Load from user preferences
        rating: article.quality_score ? article.quality_score / 20 : 0, // Convert 0-100 to 0-5
      }));

      setArticles(transformedArticles);

      if (transformedArticles.length === 0) {
        toast({
          title: "No articles found",
          description: "Generate some articles to get started!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
      toast({
        title: "Error loading articles",
        description: error instanceof Error ? error.message : "Failed to fetch articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const data = await api.getTopics();
      const topicNames = data.topics.map((t) => t.topic);
      setTopics(["all", ...topicNames]);
    } catch (error) {
      console.error("Failed to load topics:", error);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = topicFilter === "all" || article.topic === topicFilter;
    return matchesSearch && matchesTopic;
  });

  const toggleBookmark = async (id: string) => {
    try {
      await api.recordInteraction({
        user_id: DEFAULT_USER_ID,
        article_id: id,
        interaction_type: "bookmark",
      });

      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isBookmarked: !a.isBookmarked } : a))
      );

      if (selectedArticle?.id === id) {
        setSelectedArticle((prev) => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
      }

      toast({
        title: "Bookmark updated",
        description: "Article bookmark toggled successfully",
      });
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  const handleArticleClick = async (article: Article) => {
    setSelectedArticle(article);

    // Record read interaction
    try {
      await api.recordInteraction({
        user_id: DEFAULT_USER_ID,
        article_id: article.id,
        interaction_type: "read",
      });
    } catch (error) {
      console.error("Failed to record read interaction:", error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!selectedArticle) return;

    try {
      await api.recordInteraction({
        user_id: DEFAULT_USER_ID,
        article_id: selectedArticle.id,
        interaction_type: "rate",
        rating,
      });

      // Update the rating in the articles list
      setArticles(prevArticles =>
        prevArticles.map(article =>
          article.id === selectedArticle.id
            ? { ...article, rating }
            : article
        )
      );

      // Update the selected article
      setSelectedArticle(prev => prev ? { ...prev, rating } : null);
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

  const handleGenerate = async () => {
    const topics = genTopics.split(',').map(t => t.trim()).filter(t => t);

    if (topics.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one topic",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);

      const articles = await api.generateArticles({
        topics,
        count_per_topic: countPerTopic,
        quality_threshold: qualityThreshold,
        max_regeneration_attempts: maxAttempts,
      });

      toast({
        title: "Success",
        description: `Generated ${articles.length} article${articles.length !== 1 ? 's' : ''} successfully!`,
      });

      setDialogOpen(false);
      setGenTopics("");
      await loadArticles();
      await loadTopics();
    } catch (error) {
      console.error("Failed to generate articles:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate articles",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedArticle(null)} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Articles
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedArticle.topic}</Badge>
                  {selectedArticle.quality_score && (
                    <Badge variant="secondary">
                      Quality: {selectedArticle.quality_score.toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedArticle.date).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleBookmark(selectedArticle.id)}
                className={selectedArticle.isBookmarked ? "text-primary" : "text-muted-foreground"}
              >
                {selectedArticle.isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedArticle.content.split("\n\n").map((paragraph, idx) => (
                <p key={idx} className="text-foreground leading-relaxed">{paragraph}</p>
              ))}
            </div>

            {/* Vocabulary Section */}
            {selectedArticle.vocabulary.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Vocabulary ({selectedArticle.vocabulary.length} terms)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedArticle.vocabulary.map((term, idx) => (
                    <Card key={idx} className="bg-muted/50">
                      <CardContent className="p-4">
                        <p className="font-semibold text-primary">{term}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Rating System */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rate this article</p>
                    <p className="text-sm text-muted-foreground">
                      {userRating > 0 ? `Your rating: ${userRating}/5` : "Click to rate"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRating(star)}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= userRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Newsletter Articles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated articles with quality evaluation
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Articles
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generate AI Articles</DialogTitle>
              <DialogDescription>
                Generate articles using Tavily search and LLM-as-a-Judge evaluation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="topics">Topics (comma-separated)</Label>
                <Input
                  id="topics"
                  placeholder="e.g. Artificial Intelligence, Blockchain, Climate Change"
                  value={genTopics}
                  onChange={(e) => setGenTopics(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter multiple topics separated by commas
                </p>
              </div>
              <div className="space-y-2">
                <Label>Articles per topic: {countPerTopic}</Label>
                <Slider
                  value={[countPerTopic]}
                  onValueChange={([v]) => setCountPerTopic(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How many articles to generate for each topic
                </p>
              </div>
              <div className="space-y-2">
                <Label>Quality threshold: {qualityThreshold}%</Label>
                <Slider
                  value={[qualityThreshold]}
                  onValueChange={([v]) => setQualityThreshold(v)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum quality score required (LLM-as-a-Judge evaluation)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Max regeneration attempts: {maxAttempts}</Label>
                <Slider
                  value={[maxAttempts]}
                  onValueChange={([v]) => setMaxAttempts(v)}
                  min={0}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How many times to retry if quality is below threshold
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isGenerating}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Refresh */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic === "all" ? "All Topics" : topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadArticles} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handleArticleClick(article)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{article.topic}</Badge>
                  {article.quality_score && (
                    <Badge variant="secondary" className="text-xs">
                      {article.quality_score.toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${article.isBookmarked ? "text-primary" : "text-muted-foreground"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(article.id);
                  }}
                >
                  {article.isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">{article.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.content.substring(0, 150)}...
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(article.date).toLocaleDateString()}
                </span>
                {article.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {article.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">
              {articles.length === 0
                ? "No articles available. Generate some articles using the API!"
                : "No articles found matching your criteria."}
            </p>
            {articles.length === 0 && (
              <Button onClick={loadArticles} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
