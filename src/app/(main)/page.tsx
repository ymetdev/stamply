import { Bell } from "lucide-react";

export default function HomePage() {
  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back 👋</p>
          <h1 className="text-xl font-bold text-zinc-900">Home</h1>
        </div>
        <button className="relative p-2 rounded-xl bg-white border border-border">
          <Bell className="w-5 h-5 text-zinc-700" />
        </button>
      </div>
      {/* Content coming soon */}
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <span className="text-4xl mb-3">📮</span>
        <p className="text-sm">Your feed will appear here</p>
      </div>
    </div>
  );
}
