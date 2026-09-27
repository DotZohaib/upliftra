import React, { useState } from 'react';
import {
  Rocket,
  Users,
  Building2,
  ExternalLink,
  Plus,
  X,
  Check,
  CheckCircle2,
  Handshake,
} from 'lucide-react';
import { Startup, User } from '../../types';
import { getStartups, addStartup, addNotification, getCurrentUser } from '../../lib/storage';
import confetti from 'canvas-confetti';

export const StartupsView: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>(getStartups());
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectingStartup, setConnectingStartup] = useState<Startup | null>(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [connectSuccess, setConnectSuccess] = useState(false);

  // New startup form
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [industry, setIndustry] = useState('Fintech / SaaS');
  const [stage, setStage] = useState('Seed');
  const [city, setCity] = useState('Lahore, Pakistan');
  const [lookingFor, setLookingFor] = useState('Technical Co-founder, Full-Stack Lead');

  const currentUser: User = getCurrentUser();

  const industries = ['All', 'Fintech / SaaS', 'Agritech & Supply Chain', 'HealthTech & AI'];

  const filteredStartups = startups.filter((s) => {
    if (selectedIndustry === 'All') return true;
    return s.industry.toLowerCase().includes(selectedIndustry.toLowerCase());
  });

  const handleOpenConnect = (s: Startup) => {
    setConnectingStartup(s);
    setConnectMessage(
      `Assalam-o-Alaikum ${s.founders[0]?.name},\n\nI came across ${s.name} on Upliftra Network. I am interested in collaborating on your open roles (${s.lookingFor.join(', ')}). Here is my portfolio.`
    );
    setIsConnectModalOpen(true);
    setConnectSuccess(false);
  };

  const handleSendConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingStartup) return;

    addNotification({
      userId: currentUser.id,
      title: `Intro Requested with ${connectingStartup.name}`,
      description: `Your collaboration note was sent to ${connectingStartup.founders[0]?.name}.`,
      type: 'system',
      linkTo: 'startups-co-founder-matching',
    });

    setConnectSuccess(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    } catch (e) {}

    setTimeout(() => {
      setIsConnectModalOpen(false);
      setConnectSuccess(false);
    }, 1500);
  };

  const handleCreateStartup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pitch) return;

    const newS: Startup = {
      id: `startup_${Date.now()}`,
      name,
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80',
      tagline: pitch,
      description: pitch,
      industry,
      stage,
      city,
      website: 'https://upliftra.pk/startups',
      lookingFor: lookingFor.split(',').map((s) => s.trim()).filter(Boolean),
      founders: [
        {
          name: currentUser.name,
          role: 'Founder & CEO',
          avatar: currentUser.avatar,
        },
      ],
      openRoles: ['Frontend Engineer', 'Growth Specialist'],
      createdAt: new Date().toISOString(),
    };

    addStartup(newS);
    setStartups(getStartups());
    setIsRegisterModalOpen(false);
    setName('');
    setPitch('');
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            Pakistan Startups & Co-Founder Matching
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Discover high-growth Pakistani tech ventures from NIC, Plan9, and Epiphany looking for early team members.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Startup</span>
        </button>
      </div>

      {/* Industries Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setSelectedIndustry(ind)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedIndustry === ind
                ? 'bg-[#005d42] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Startups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredStartups.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={s.logo}
                    alt={s.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900">{s.name}</h3>
                    <span className="text-[11px] text-slate-500">{s.city}</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dae2fd] text-[#131b2e]">
                  {s.stage}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                "{s.tagline}"
              </p>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Actively Seeking:
                </span>
                <div className="flex flex-wrap gap-1">
                  {s.lookingFor.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
                    >
                      ⚡ {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Founders */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <img
                  src={s.founders[0]?.avatar}
                  alt={s.founders[0]?.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">{s.founders[0]?.name}</span>
                  <span className="text-[10px] text-slate-400">{s.founders[0]?.role}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">{s.industry}</span>
              <button
                onClick={() => handleOpenConnect(s)}
                className="px-3 py-1.5 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Connect / Pitch</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Connect Modal */}
      {isConnectModalOpen && connectingStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleSendConnect}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">
                  Founder Collaboration
                </span>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Connect with {connectingStartup.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Intro Note</label>
              <textarea
                required
                rows={5}
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              />
            </div>

            {connectSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-[#047857]" />
                <span>Intro request saved to local notifications!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connectSuccess}
                className="px-5 py-2 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold shadow-xs disabled:opacity-50"
              >
                Send Intro Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register Startup Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateStartup}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Register Your Startup on Upliftra
                </h3>
                <p className="text-xs text-slate-500">
                  List your venture to find technical co-founders, interns, and early talent across Pakistan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Startup Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PakHealth AI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="h-9 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <option value="Idea Stage">Idea Stage</option>
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Bootstrapped">Bootstrapped</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Elevator Pitch / Tagline</label>
              <textarea
                required
                rows={3}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="What problem are you solving in Pakistan?"
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Roles You Are Looking For (comma separated)</label>
              <input
                type="text"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="e.g. Technical Co-Founder, React Native Dev, Growth Marketer"
                className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#047857] text-white hover:bg-[#065f46] text-xs font-bold shadow-xs"
              >
                Register Startup
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
