import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Award,
  ExternalLink,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { PlatformEvent } from '../../types';
import { getEvents, registerForEvent } from '../../lib/storage';
import confetti from 'canvas-confetti';

export const EventsView: React.FC = () => {
  const [events, setEvents] = useState<PlatformEvent[]>(getEvents());
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);

  const handleRegister = (eventId: string) => {
    registerForEvent(eventId);
    setEvents(getEvents());
    setRegisteredIds([...registeredIds, eventId]);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    } catch (e) {}
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            Pakistan Tech Summits, Hackathons & Webinars
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Free career masterclasses, coding competitions, and networking events across universities and tech hubs.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((ev) => {
          const isRegistered = registeredIds.includes(ev.id);
          return (
            <div
              key={ev.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dae2fd] text-[#131b2e]">
                    {ev.category}
                  </span>
                  {ev.isOnline ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#047857]">
                      <Video className="w-3.5 h-3.5" />
                      <span>Online / Zoom</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>On-Campus</span>
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-base text-slate-900">{ev.title}</h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {ev.description}
                </p>

                <div className="flex flex-col gap-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#047857]" />
                    <span className="font-semibold text-slate-800">{ev.date}</span>
                    <span>•</span>
                    <span>{ev.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Speaker: {ev.speaker}</span>
                  </div>
                </div>

                {ev.prizePool && (
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Prize Pool: {ev.prizePool}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {ev.registeredCount} Registered
                </span>

                <button
                  onClick={() => handleRegister(ev.id)}
                  disabled={isRegistered}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 ${
                    isRegistered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-[#047857] text-white hover:bg-[#065f46]'
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Pass Confirmed</span>
                    </>
                  ) : (
                    <span>Register Free</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
