import React from 'react';
import { LayoutDashboard, Briefcase, BrainCircuit, MessageSquare, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (path: string) => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenMobileMenu,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-40 lg:hidden flex items-center justify-around px-2 py-1 shadow-lg">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
          currentView === 'dashboard' ? 'text-[#047857] font-bold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => onNavigate('opportunities')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
          currentView === 'opportunities' ? 'text-[#047857] font-bold' : 'text-slate-500'
        }`}
      >
        <Briefcase className="w-5 h-5 mb-0.5" />
        <span>Jobs</span>
      </button>

      <button
        onClick={() => onNavigate('ai-career-coach-ats-reviewer')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
          currentView === 'ai-career-coach-ats-reviewer' ? 'text-[#047857] font-bold' : 'text-slate-500'
        }`}
      >
        <div className="relative">
          <BrainCircuit className="w-5 h-5 mb-0.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] absolute -top-0.5 -right-0.5"></span>
        </div>
        <span>AI Coach</span>
      </button>

      <button
        onClick={() => onNavigate('messages')}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
          currentView === 'messages' ? 'text-[#047857] font-bold' : 'text-slate-500'
        }`}
      >
        <MessageSquare className="w-5 h-5 mb-0.5" />
        <span>Messages</span>
      </button>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium text-slate-500"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
