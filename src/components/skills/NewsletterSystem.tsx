import { useState } from "react";
import { Search, Filter, Calendar, BookOpen, Star, Bookmark, BookmarkCheck, ChevronLeft, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Article {
  id: string;
  title: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  date: string;
  excerpt: string;
  content: string;
  vocabulary: { term: string; definition: string; example: string }[];
  rating: number;
  isBookmarked: boolean;
}

const mockArticles: Article[] = [
  {
    id: "1",
    title: "Legal Translation: Key Principles and Best Practices",
    topic: "Legal",
    difficulty: "advanced",
    date: "2024-01-15",
    excerpt: "Understanding the nuances of legal translation requires both linguistic expertise and legal knowledge...",
    content: `Legal translation is a specialized field that demands precision, accuracy, and a deep understanding of both source and target legal systems. Unlike general translation, legal translation carries significant consequences—a single mistranslated term can alter the meaning of a contract or affect the outcome of legal proceedings.

The fundamental principle of legal translation is functional equivalence. This means that the translated text must have the same legal effect in the target jurisdiction as the original text has in the source jurisdiction. This often requires more than word-for-word translation; it demands a thorough understanding of legal concepts in both cultures.

One of the greatest challenges legal translators face is dealing with system-specific terminology. Legal systems vary significantly across countries, and many legal concepts simply don't exist in other jurisdictions. For example, the common law concept of "trust" has no direct equivalent in civil law systems. In such cases, translators must use techniques like paraphrasing, footnotes, or keeping the original term with an explanation.

Certification and authentication requirements also play a crucial role in legal translation. Many jurisdictions require sworn or certified translations for official documents. Translators must be familiar with these requirements and ensure their work meets all necessary standards.

Quality assurance in legal translation involves multiple revision stages, cross-referencing with legal dictionaries and databases, and sometimes consultation with legal experts. The stakes are too high for errors, making thorough review processes essential.`,
    vocabulary: [
      { term: "Functional equivalence", definition: "Translation approach where the target text achieves the same legal effect as the source", example: "Functional equivalence requires adapting legal concepts to the target legal system." },
      { term: "Sworn translation", definition: "A translation certified by an authorized translator for official use", example: "The court required a sworn translation of the birth certificate." },
      { term: "Source jurisdiction", definition: "The legal system from which the original document originates", example: "Understanding the source jurisdiction helps interpret legal terminology correctly." },
      { term: "Target jurisdiction", definition: "The legal system where the translated document will be used", example: "The translator adapted concepts for the target jurisdiction's requirements." },
      { term: "Civil law system", definition: "Legal system based on codified statutes and legislation", example: "France operates under a civil law system derived from the Napoleonic Code." },
      { term: "Common law", definition: "Legal system based on judicial precedents and case law", example: "The UK and US follow common law traditions." },
      { term: "Paraphrasing", definition: "Expressing meaning using different words when direct translation isn't possible", example: "Complex legal concepts often require paraphrasing for clarity." },
      { term: "Authentication", definition: "Official verification that a document is genuine", example: "The embassy required authentication of all translated documents." },
    ],
    rating: 4.5,
    isBookmarked: false,
  },
  {
    id: "2",
    title: "Medical Translation: Terminology and Precision",
    topic: "Medical",
    difficulty: "advanced",
    date: "2024-01-10",
    excerpt: "Medical translation requires exceptional accuracy as errors can have life-threatening consequences...",
    content: `Medical translation stands as one of the most demanding specializations in the translation industry. The field encompasses everything from patient records and clinical trial documents to pharmaceutical packaging and medical device manuals. Each category presents unique challenges and requires specific expertise.

Accuracy in medical translation is non-negotiable. A misunderstood dosage instruction or incorrectly translated drug interaction warning could have fatal consequences. This is why medical translators must not only be linguistically proficient but also possess substantial knowledge of medical terminology, anatomy, pharmacology, and clinical procedures.

The regulatory landscape adds another layer of complexity. Documents intended for regulatory submissions must comply with strict guidelines set by agencies like the FDA, EMA, or local health authorities. These regulations often specify format requirements, terminology preferences, and even font sizes. Translators must stay current with evolving regulations across different markets.

Terminology consistency is paramount in medical translation. Using "heart attack" in one section and "myocardial infarction" in another might confuse readers or create legal liability. Translation memory tools and terminology databases help maintain consistency across large projects and multiple translators.

Patient-facing materials require special consideration. While maintaining accuracy, translators must also ensure that information is accessible to non-medical audiences. This often means simplifying complex medical jargon while preserving critical information.`,
    vocabulary: [
      { term: "Clinical trial", definition: "Research study to evaluate medical interventions in human participants", example: "The drug completed Phase III clinical trials last year." },
      { term: "Pharmacology", definition: "The science of drugs and their effects on living organisms", example: "Pharmacology knowledge helps translators understand drug interactions." },
      { term: "Regulatory submission", definition: "Documents submitted to authorities for product approval", example: "The regulatory submission included all translated safety data." },
      { term: "Myocardial infarction", definition: "Medical term for heart attack", example: "The patient was diagnosed with acute myocardial infarction." },
      { term: "Translation memory", definition: "Database storing previously translated segments for reuse", example: "Translation memory improved consistency across the 500-page manual." },
      { term: "Contraindication", definition: "Condition that makes a treatment inadvisable", example: "Pregnancy is listed as a contraindication for this medication." },
      { term: "Adverse event", definition: "Undesirable experience occurring during treatment", example: "All adverse events must be reported and translated accurately." },
      { term: "Patient-facing materials", definition: "Documents intended for patient consumption", example: "Patient-facing materials require clear, accessible language." },
    ],
    rating: 4.8,
    isBookmarked: true,
  },
  {
    id: "3",
    title: "Introduction to CAT Tools for Translators",
    topic: "Technology",
    difficulty: "beginner",
    date: "2024-01-05",
    excerpt: "Computer-Assisted Translation tools have revolutionized the translation industry...",
    content: `Computer-Assisted Translation (CAT) tools have become indispensable in the modern translation industry. These software applications help translators work more efficiently, maintain consistency, and manage large projects effectively. Understanding CAT tools is essential for anyone entering the translation profession.

At their core, CAT tools divide text into segments (usually sentences) and present them alongside space for the translation. As you translate, the tool stores these pairs in a translation memory (TM). When similar segments appear later, the tool suggests previous translations, saving time and ensuring consistency.

Terminology databases, or termbases, work alongside translation memories. These glossaries store approved translations for specific terms, ensuring that technical vocabulary is translated consistently throughout a project and across different translators.

Most CAT tools also include quality assurance features. They can check for inconsistencies, missing translations, formatting errors, and terminology violations. Running these checks before delivery helps catch errors that might otherwise slip through.

Popular CAT tools include SDL Trados Studio, memoQ, Wordfast, and cloud-based options like Smartcat and Memsource. Each has its strengths, and many translators work with multiple tools depending on client requirements.

Learning to use CAT tools effectively takes time, but the investment pays off quickly. Productivity gains of 30-50% are common, and the consistency improvements make you more valuable to clients with ongoing translation needs.`,
    vocabulary: [
      { term: "CAT tools", definition: "Software applications that assist human translators", example: "CAT tools help maintain consistency across large documents." },
      { term: "Translation memory", definition: "Database of source-target segment pairs", example: "The translation memory contained 50,000 previously translated segments." },
      { term: "Segment", definition: "A unit of text, typically a sentence, used in CAT tools", example: "Each segment appears with its corresponding translation." },
      { term: "Termbase", definition: "Glossary database for approved terminology", example: "The termbase ensures consistent translation of technical terms." },
      { term: "Quality assurance", definition: "Checks to identify errors before delivery", example: "Quality assurance caught several formatting inconsistencies." },
      { term: "Fuzzy match", definition: "Similar but not identical segment from translation memory", example: "The 85% fuzzy match needed only minor adjustments." },
      { term: "Pre-translation", definition: "Automatic insertion of TM matches before human review", example: "Pre-translation populated 40% of the document automatically." },
      { term: "Alignment", definition: "Creating TM from existing translated documents", example: "Alignment of legacy translations created a valuable resource." },
    ],
    rating: 4.2,
    isBookmarked: false,
  },
  {
    id: "4",
    title: "Financial Translation: Numbers, Culture, and Precision",
    topic: "Finance",
    difficulty: "intermediate",
    date: "2024-01-01",
    excerpt: "Financial translation combines linguistic skills with knowledge of accounting, economics, and regulations...",
    content: `Financial translation is a specialized discipline that bridges languages while navigating the complex world of international finance. From annual reports and audit documents to investment prospectuses and banking regulations, financial translators handle materials that influence major business decisions.

Understanding numerical conventions is fundamental. Different countries use different decimal separators, thousand separators, and date formats. Confusing these can turn millions into billions or completely misrepresent financial data. A translator must be vigilant about converting these correctly while maintaining the precision that financial documents demand.

Regulatory awareness is equally important. Financial markets are heavily regulated, and translated documents often must comply with specific requirements. The EU's PRIIPs regulation, for instance, mandates specific language for key information documents. Securities filings in different countries have their own terminology and format requirements.

Cultural considerations extend beyond language. Financial concepts may carry different connotations or legal implications across jurisdictions. The term "director" in UK corporate governance differs significantly from its meaning in other countries. Translators must understand these nuances to convey accurate information.

Currency translation deserves special attention. Beyond converting currency names, translators must consider whether to include exchange rates, how to handle historical versus current values, and when to keep original currency amounts alongside translations.`,
    vocabulary: [
      { term: "Annual report", definition: "Yearly document detailing company performance and finances", example: "The annual report required translation into five languages." },
      { term: "Prospectus", definition: "Document describing securities offered for sale", example: "The IPO prospectus was translated for European investors." },
      { term: "Decimal separator", definition: "Character separating whole and fractional parts of numbers", example: "Europe uses comma as decimal separator, while the US uses period." },
      { term: "PRIIPs", definition: "EU regulation on packaged retail investment products", example: "PRIIPs requires standardized key information documents." },
      { term: "Securities filing", definition: "Official documents submitted to financial regulators", example: "Securities filings must meet strict accuracy requirements." },
      { term: "Corporate governance", definition: "System of rules and practices directing companies", example: "Corporate governance terms vary between legal systems." },
      { term: "Exchange rate", definition: "Value of one currency expressed in another", example: "The exchange rate was noted for all currency conversions." },
      { term: "Audit", definition: "Official examination of financial accounts", example: "The audit report was translated for international stakeholders." },
    ],
    rating: 4.0,
    isBookmarked: false,
  },
];

export function NewsletterSystem() {
  const [articles, setArticles] = useState(mockArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [userRating, setUserRating] = useState<number>(0);

  const topics = ["all", ...new Set(mockArticles.map((a) => a.topic))];
  const difficulties = ["all", "beginner", "intermediate", "advanced"];

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = topicFilter === "all" || article.topic === topicFilter;
    const matchesDifficulty = difficultyFilter === "all" || article.difficulty === difficultyFilter;
    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  const toggleBookmark = (id: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isBookmarked: !a.isBookmarked } : a))
    );
    if (selectedArticle?.id === id) {
      setSelectedArticle((prev) => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "advanced": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

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
                  <Badge className={getDifficultyColor(selectedArticle.difficulty)}>
                    {selectedArticle.difficulty}
                  </Badge>
                  <Badge variant="outline">{selectedArticle.topic}</Badge>
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

            {/* Vocabulary Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Vocabulary ({selectedArticle.vocabulary.length} terms)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedArticle.vocabulary.map((vocab, idx) => (
                  <Card key={idx} className="bg-muted/50">
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold text-primary">{vocab.term}</h4>
                      <p className="text-sm text-foreground">{vocab.definition}</p>
                      <p className="text-xs text-muted-foreground italic">"{vocab.example}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Rating System */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rate this article</p>
                    <p className="text-sm text-muted-foreground">Average rating: {selectedArticle.rating}/5</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setUserRating(star)}
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
      {/* Filters */}
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
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff} value={diff}>
                    {diff === "all" ? "All Levels" : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedArticle(article)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(article.difficulty)}>
                    {article.difficulty}
                  </Badge>
                  <Badge variant="outline">{article.topic}</Badge>
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
              <h3 className="font-semibold text-lg leading-tight">{article.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(article.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {article.rating}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No articles found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
