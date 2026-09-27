import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Send,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  Mail,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { AIChatMessage, User } from '../../types';
import { getAIHistory, addAIMessage, clearAIHistory, getCurrentUser } from '../../lib/storage';
import confetti from 'canvas-confetti';

export const AICoachView: React.FC = () => {
  const [messages, setMessages] = useState<AIChatMessage[]>(getAIHistory());
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // ATS Scanner tab state
  const [activeTab, setActiveTab] = useState<'chat' | 'ats' | 'salary' | 'outreach'>('chat');
  const [resumeText, setResumeText] = useState(
    `Ayesha Khan\nComputer Science Undergrad @ NUST Class of 2025\nSkills: React, Next.js, TypeScript, Tailwind CSS, Python, Node.js, Git\nProjects: E-Commerce Store with Stripe, AI Document Summarizer\nExperience: Frontend Intern at local software house (6 months)\nCGPA: 3.78/4.0`
  );
  const [jobDescription, setJobDescription] = useState(
    `Looking for Associate Full-Stack Engineer in Lahore/Islamabad.\nRequirements: Strong knowledge of TypeScript, React/Next.js, REST APIs, Tailwind CSS, Docker basics, and experience building scalable dashboards.`
  );
  const [atsAnalysis, setAtsAnalysis] = useState<{
    score: number;
    matched: string[];
    missing: string[];
    advice: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Outreach generator state
  const [targetAlumni, setTargetAlumni] = useState('NUST / FAST Alumnus');
  const [targetCompany, setTargetCompany] = useState('Systems Limited');
  const [generatedPitch, setGeneratedPitch] = useState(
    `Assalam-o-Alaikum,\n\nI hope this message finds you well. I am a final-year CS undergrad at NUST and a fellow member of the Pakistani tech community. I have been following the impressive engineering scaling at Systems Limited, particularly your recent cloud modernizations.\n\nWith hands-on experience building Next.js and TypeScript web applications, I would love 10 minutes of your guidance on what hiring managers at Systems Ltd look for in fresh graduates. I have attached my portfolio here: https://upliftra.pk/ayesha-khan\n\nThank you for your valuable time!\n\nBest regards,\nAyesha Khan`
  );

  const currentUser: User = getCurrentUser();

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    // Add user message
    const userMsg = addAIMessage({
      sender: 'user',
      text,
    });
    setMessages(getAIHistory());
    setInputMessage('');
    setIsTyping(true);

    // Dynamic Pakistani-centric simulated coach reply
    setTimeout(() => {
      let reply = '';
      let suggestions: string[] | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('systems') || lower.includes('arbisoft') || lower.includes('lahore')) {
        reply = `For Lahore giants like Systems Ltd, Arbisoft, and Devsinc, technical screenings emphasize clean component architecture, state management (Zustand/Redux), and RESTful API consumption. Your NUST degree gives you great campus leverage. I recommend tailoring your GitHub links to showcase live Vercel deployments.`;
        suggestions = ['Generate Cover Letter for Systems Ltd', 'Top 5 React Interview Questions'];
      } else if (lower.includes('salary') || lower.includes('compensation') || lower.includes('pkr')) {
        reply = `Fresh graduate software engineering packages in Lahore and Islamabad currently benchmark around PKR 100,000 to PKR 160,000/month for top tier firms (Arbisoft, 10Pearls, Careem, Systems). Multinationals paying USD-pegged salaries can offer up to PKR 250,000.`;
        suggestions = ['Negotiation script for fresh grads', 'Tax deductions on tech salary in PK'];
      } else if (lower.includes('fulbright') || lower.includes('scholarship')) {
        reply = `For the Fulbright Foreign Student Program (USEFP) and DAAD Germany, your 3.78 CGPA is highly competitive! Focus your Statement of Purpose (SOP) on how returning to Pakistan will contribute to the national IT digitisation ecosystem.`;
        suggestions = ['Review SOP Structure', 'GRE vs Duolingo for Fulbright'];
      } else {
        reply = `I have analyzed your request based on the current Pakistani talent market. With your active profile at ${currentUser.institution}, continuing to highlight production-ready TypeScript projects will position you in the top 10% of applicants.`;
        suggestions = ['Run full ATS resume audit', 'Compare Pakistani tech salary'];
      }

      addAIMessage({
        sender: 'assistant',
        text: reply,
        suggestions,
      });
      setMessages(getAIHistory());
      setIsTyping(false);
    }, 900);
  };

  const handleRunAtsAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAtsAnalysis({
        score: 91,
        matched: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Scalable Dashboards'],
        missing: ['Docker Basics', 'Microservices', 'Unit Testing (Jest/Vitest)'],
        advice:
          'Your profile is a 91% match! Add 1 bullet point demonstrating Docker containerization or unit tests to lock in an automatic interview shortlist with the recruiter ATS.',
      });
      setIsAnalyzing(false);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
      } catch (e) {}
    }, 1200);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(generatedPitch);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              AI Career Coach & ATS Reviewer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#97f5cc] text-[#002115]">
              Local Browser Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Privacy-first career copilot tailored specifically for the Pakistani job market, HEC scholarships, and alumni outreach.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'chat' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
            }`}
          >
            Chat Coach
          </button>
          <button
            onClick={() => setActiveTab('ats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ats' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
            }`}
          >
            ATS Resume Matcher
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'outreach' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
            }`}
          >
            Alumni Cold Emailer
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'salary' ? 'bg-white text-[#047857] shadow-xs' : 'text-slate-600'
            }`}
          >
            PK Salary Benchmarks
          </button>
        </div>
      </div>

      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Top Banner */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#047857]" />
              <span className="font-bold text-slate-800">
                Upliftra AI Advisor (Pakistan Tech Knowledge Engine)
              </span>
            </div>
            <button
              onClick={() => {
                clearAIHistory();
                setMessages([]);
              }}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold"
            >
              Clear Chat History
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-1 max-w-[85%] ${
                  m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#047857] text-white rounded-br-none shadow-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>

                <span className="text-[10px] text-slate-400 px-1">{m.timestamp}</span>

                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSendMessage(s)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#047857] hover:bg-emerald-100 text-[11px] font-semibold border border-emerald-200 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-slate-100 text-slate-500 rounded-2xl rounded-bl-none self-start text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#047857]" />
                <span>Coach is thinking...</span>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask for resume feedback, interview tips for Careem, or Fulbright SOP pointers..."
              className="flex-1 h-11 px-4 rounded-xl bg-slate-100 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#047857] border border-transparent focus:border-[#047857]"
            />
            <button
              onClick={() => handleSendMessage()}
              className="w-11 h-11 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] flex items-center justify-center shadow-xs transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'ats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-slate-900">
              1. Resume Dossier Content
            </h3>
            <textarea
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
            />

            <h3 className="font-display font-bold text-sm text-slate-900">
              2. Target Job Description (Paste from Pakistani Recruiter)
            </h3>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800"
            />

            <button
              onClick={handleRunAtsAnalysis}
              disabled={isAnalyzing}
              className="py-2.5 px-4 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Match...' : 'Calculate ATS Readiness Score'}</span>
            </button>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            {atsAnalysis ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    ATS Match Analysis
                  </h3>
                  <div className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#97f5cc] text-[#002115]">
                    {atsAnalysis.score}% Readiness
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                    <span>Matched Keywords in CV ({atsAnalysis.matched.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.matched.map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#047857] border border-emerald-200"
                      >
                        ✓ {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Missing High-Impact Keywords ({atsAnalysis.missing.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.missing.map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        + {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Coach Strategy Tip</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed">{atsAnalysis.advice}</p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 flex flex-col items-center gap-2">
                <BrainCircuit className="w-8 h-8 text-slate-300" />
                <span>Click "Calculate ATS Readiness Score" to view keyword breakdown.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'outreach' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Pakistani Alumni Cold Outreach Generator
              </h3>
              <p className="text-xs text-slate-500">
                High-response template formatted for LinkedIn or email outreach to senior tech professionals in Lahore, Karachi, and overseas.
              </p>
            </div>
            <button
              onClick={handleCopyPitch}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copiedEmail ? <Check className="w-4 h-4 text-[#047857]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Template'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed">
            {generatedPitch}
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-5">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Pakistan Tech Salary & Compensation Benchmarks (2025)
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated from verified offers across Lahore, Karachi, Islamabad, and remote global contractors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fresh Graduate (0-1 yrs)
              </span>
              <span className="font-display font-extrabold text-xl text-[#047857]">
                PKR 100K - 160K
              </span>
              <p className="text-[11px] text-slate-500">
                Average across Systems Ltd, Arbisoft, 10Pearls, Devsinc for BS CS grads.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mid-Level Engineer (2-4 yrs)
              </span>
              <span className="font-display font-extrabold text-xl text-[#047857]">
                PKR 250K - 450K
              </span>
              <p className="text-[11px] text-slate-500">
                Proficient in Next.js, Cloud APIs, NestJS, Python microservices.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">
                Remote International (USD)
              </span>
              <span className="font-display font-extrabold text-xl text-[#002115]">
                $1,500 - $4,000 / mo
              </span>
              <p className="text-[11px] text-slate-600">
                PKR 420K to 1.1M per month. Full-time remote contract with US/EU startups.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
