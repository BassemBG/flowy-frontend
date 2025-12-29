import { Users } from "lucide-react";

export default function Shadowing() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="page-title">Shadowing</h1>
            <p className="page-description">Practice and improve through shadowing exercises</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-muted-foreground">Shadowing content will be configured here.</p>
      </div>
    </div>
  );
}
