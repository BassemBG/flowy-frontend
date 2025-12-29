import { Home, MessageCircle, BookOpen, Languages, GraduationCap, StickyNote, Headphones } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import flowyLogo from "@/assets/flowy-logo.png";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    title: "WhatsApp Agent",
    path: "/whatsapp-agent",
    icon: MessageCircle,
  },
  {
    title: "AI Glossary",
    path: "/glossary",
    icon: BookOpen,
  },
  {
    title: "Auto Translation",
    path: "/translation",
    icon: Languages,
  },
  {
    title: "Skills Development",
    path: "/skills",
    icon: GraduationCap,
  },
  {
    title: "AI NoteKeeper",
    path: "/notekeeper",
    icon: StickyNote,
  },
  {
    title: "Shadowing",
    path: "/shadowing",
    icon: Headphones,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={flowyLogo} alt="Flowy" className="h-10 w-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "gradient-brand text-primary-foreground shadow-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-4 py-2">
          <p className="text-xs text-muted-foreground">© 2024 Flowy</p>
        </div>
      </div>
    </aside>
  );
}
