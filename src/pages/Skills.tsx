import { GraduationCap, Newspaper, Sparkles, Mic, Hand } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsletterSystem } from "@/components/skills/NewsletterSystem";
import { SmartRecommendations } from "@/components/skills/SmartRecommendations";
import { TranslationEvaluator } from "@/components/skills/TranslationEvaluator";
import { ASLTranslator } from "@/components/skills/ASLTranslator";

export default function Skills() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">Skills Development</h1>
            <p className="page-description">Track and improve your learning journey</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="newsletter" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="newsletter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3">
            <Newspaper className="h-4 w-4" />
            <span className="hidden sm:inline">Newsletter</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="evaluator" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Evaluator</span>
          </TabsTrigger>
          <TabsTrigger value="asl" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-3">
            <Hand className="h-4 w-4" />
            <span className="hidden sm:inline">ASL Translator</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="newsletter">
          <NewsletterSystem />
        </TabsContent>
        <TabsContent value="recommendations">
          <SmartRecommendations />
        </TabsContent>
        <TabsContent value="evaluator">
          <TranslationEvaluator />
        </TabsContent>
        <TabsContent value="asl">
          <ASLTranslator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
