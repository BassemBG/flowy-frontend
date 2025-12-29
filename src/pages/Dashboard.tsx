import { Link } from "react-router-dom";
import { MessageCircle, BookOpen, Languages, GraduationCap, StickyNote, Headphones, LayoutDashboard } from "lucide-react";

const features = [
  {
    title: "WhatsApp Agent",
    description: "AI-powered conversations for WhatsApp",
    path: "/whatsapp-agent",
    icon: MessageCircle,
  },
  {
    title: "AI Glossary",
    description: "Manage your AI terminology database",
    path: "/glossary",
    icon: BookOpen,
  },
  {
    title: "Auto Translation",
    description: "Seamless automatic translations",
    path: "/translation",
    icon: Languages,
  },
  {
    title: "Skills Development",
    description: "Track and grow your abilities",
    path: "/skills",
    icon: GraduationCap,
  },
  {
    title: "AI NoteKeeper",
    description: "Smart note-taking assistant",
    path: "/notekeeper",
    icon: StickyNote,
  },
  {
    title: "Shadowing",
    description: "Practice with audio shadowing",
    path: "/shadowing",
    icon: Headphones,
  },
];

export default function Dashboard() {
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-border bg-card/50 px-8 py-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back to Flowy</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 mb-8">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome to <span className="text-transparent bg-clip-text gradient-brand">Flowy</span>
            </h2>
            <p className="text-muted-foreground">
              Your all-in-one AI productivity suite. Select a feature below to get started.
            </p>
          </div>
          {/* Gradient decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 via-accent/10 to-transparent pointer-events-none" />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.path}
              to={feature.path}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center mb-4 shadow-glow group-hover:shadow-glow-lg transition-shadow">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
