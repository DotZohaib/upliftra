import React, { useState, useEffect } from 'react';
import {
  Handshake,
  Star,
  CheckCircle2,
  Clock,
  Video,
  Calendar,
  Search,
  Filter,
  X,
  MessageSquare,
  Award,
  Sparkles,
  Check,
  Send,
  UserCheck,
  AlertCircle,
  ThumbsUp,
  FileText,
} from 'lucide-react';
import {
  Mentor,
  MentorshipSession,
  MentorshipRequest,
  User,
} from '../../types';
import {
  getMentors,
  getMentorshipSessions,
  getMentorshipRequests,
  sendMentorshipRequest,
  updateMentorshipRequestStatus,
  bookMentorshipSession,
  updateMentorshipSessionStatus,
  rateMentorshipSession,
  getCurrentUser,
} from '../../lib/storage';
import { isMentor } from '../../lib/permissions';
import confetti from 'canvas-confetti';

export const MentorshipView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(() => getCurrentUser());
  const [mentors] = useState<Mentor[]>(() => getMentors());
  const [sessions, setSessions] = useState<MentorshipSession[]>(() => getMentorshipSessions());
  const [requests, setRequests] = useState<MentorshipRequest[]>(() => getMentorshipRequests());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [activeTab, setActiveTab] = useState<'directory' | 'my-sessions' | 'requests'>('directory');

  // Booking / Request Modal State
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestTopic, setRequestTopic] = useState('Career advice & portfolio review');
  const [requestDate, setRequestDate] = useState('2025-06-20');
  const [requestGoals, setRequestGoals] = useState('Prepare for software engineering internships and tech screenings in Pakistan.');
  const [requestNotes, setRequestNotes] = useState('Available in evening PKT hours.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rating Modal State
  const [ratingSession, setRatingSession] = useState<MentorshipSession | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingReview, setRatingReview] = useState('');

  const domains = [
    'All',
    'Full-Stack Engineering',
    'Product Management',
    'Data Science & AI',
    'Global Scholarships',
    'Fintech & Cloud',
  ];

  const userIsMentor = isMentor(currentUser.role);

  useEffect(() => {
    const handleStorageChange = () => {
      setSessions(getMentorshipSessions());
      setRequests(getMentorshipRequests());
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('upliftra_data_changed', handleStorageChange);
    return () => window.removeEventListener('upliftra_data_changed', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredMentors = mentors.filter((m) => {
    if (selectedDomain !== 'All') {
      const match =
        m.expertise.some((e) => e.toLowerCase().includes(selectedDomain.toLowerCase())) ||
        m.roleTitle.toLowerCase().includes(selectedDomain.toLowerCase());
      if (!match) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.almaMater.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenRequestModal = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setRequestTopic(`Mentorship on ${mentor.expertise[0] || 'Tech Careers'} & guidance`);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;
    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Create Mentorship Request
      sendMentorshipRequest({
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        mentorAvatar: selectedMentor.avatar,
        menteeId: currentUser.id,
        menteeName: currentUser.name,
        menteeAvatar: currentUser.avatar,
        topic: requestTopic,
        preferredDate: requestDate,
        goals: requestGoals,
        notes: requestNotes,
      });

      // 2. Also register in upcoming sessions as pending
      bookMentorshipSession({
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        mentorAvatar: selectedMentor.avatar,
        menteeId: currentUser.id,
        menteeName: currentUser.name,
        topic: requestTopic,
        scheduledTime: `${requestDate} at 07:00 PM PKT`,
        meetingLink: 'https://meet.google.com/upliftra-session',
      });

      setIsSubmitting(false);
      setSelectedMentor(null);
      showToast(`Mentorship request sent to ${selectedMentor.name}!`);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch {}
      setActiveTab('my-sessions');
    }, 500);
  };

  // Mentor Actions on Requests
  const handleAcceptRequest = (req: MentorshipRequest) => {
    updateMentorshipRequestStatus(req.id, 'accepted');
    showToast(`Accepted mentorship request from ${req.menteeName}!`);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } });
    } catch {}
  };

  const handleRejectRequest = (req: MentorshipRequest) => {
    updateMentorshipRequestStatus(req.id, 'rejected');
    showToast('Mentorship request declined.');
  };

  const handleCompleteSession = (session: MentorshipSession) => {
    updateMentorshipSessionStatus(session.id, 'Completed');
    showToast(`Session marked as completed!`);
  };

  const handleOpenRateModal = (session: MentorshipSession) => {
    setRatingSession(session);
    setRatingStars(session.rating || 5);
    setRatingReview(session.review || '');
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingSession) return;

    rateMentorshipSession(ratingSession.id, ratingStars, ratingReview);
    setRatingSession(null);
    showToast('Thank you for rating your mentor!');
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // Filtered requests and sessions
  const userRequests = requests.filter(
    (r) => r.menteeId === currentUser.id || r.mentorId === currentUser.id
  );

  const userSessions = sessions.filter(
    (s) => s.menteeId === currentUser.id || s.mentorId === currentUser.id
  );

  return (
    <div id="mentorship_view_container" className="flex flex-col gap-6 w-full pb-16 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          <Check className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-200 bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-md dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <Handshake className="h-3.5 w-3.5" />
                1-on-1 Guidance
              </span>
              <span className="text-xs text-emerald-200">100% Free for Students</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold">Upliftra Mentorship Ecosystem</h1>
            <p className="mt-1 text-xs text-emerald-100/80 max-w-xl">
              Connect directly with software engineers, engineering managers, and overseas Pakistani scholars from Google, Amazon, Careem, and Systems Ltd.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-xs">
              <div className="text-xl font-bold">{mentors.length}</div>
              <div className="text-[10px] uppercase text-emerald-200 font-semibold tracking-wider">Mentors</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-xs">
              <div className="text-xl font-bold">{userSessions.length}</div>
              <div className="text-[10px] uppercase text-emerald-200 font-semibold tracking-wider">My Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'directory'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Find a Mentor ({filteredMentors.length})
          </button>
          <button
            onClick={() => setActiveTab('my-sessions')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'my-sessions'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            My Sessions ({userSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Mentorship Requests
            {userRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
                {userRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Find a Mentor Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentors by name, company (e.g. Careem, Google), alma mater (e.g. NUST, FAST)..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {domains.map((dom) => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedDomain === dom
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          {/* Mentors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-emerald-500/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="h-14 w-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mentor.name}</h3>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{mentor.roleTitle}</p>
                        <p className="text-[11px] text-slate-500">{mentor.company} • {mentor.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{mentor.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({mentor.totalMentees} mentees)</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {mentor.almaMater}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {mentor.bio}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {mentor.expertise.map((exp, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Next: <strong className="text-slate-700 dark:text-slate-300">{mentor.nextAvailable}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRequestModal(mentor)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: My Scheduled & Completed Sessions */}
      {activeTab === 'my-sessions' && (
        <div className="space-y-4">
          {userSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No mentorship sessions yet</h3>
              <p className="text-xs text-slate-500 mt-1">Book a session with a mentor from the directory to get 1-on-1 guidance.</p>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Find a Mentor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userSessions.map((session) => {
                const isUpcoming = session.status === 'Scheduled';
                return (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={session.mentorAvatar}
                        alt={session.mentorName}
                        className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{session.topic}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isUpcoming
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Mentor: <strong className="text-slate-700 dark:text-slate-300">{session.mentorName}</strong> • Mentee: {session.menteeName}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {session.scheduledTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isUpcoming ? (
                        <>
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Join Video Call
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCompleteSession(session)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Mark Completed
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          {session.rating ? (
                            <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                              <Star className="h-4 w-4 fill-amber-400" />
                              {session.rating}/5 Rated
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRateModal(session)}
                              className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
                            >
                              <Star className="h-3.5 w-3.5" />
                              Rate Mentor
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mentorship Requests Management */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {userRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No mentorship requests</h3>
              <p className="text-xs text-slate-500 mt-1">Incoming and submitted mentorship request proposals will be listed here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.menteeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={req.menteeName}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.topic}</h4>
                        <p className="text-xs text-slate-500">
                          Mentee: <strong>{req.menteeName}</strong> → Mentor: <strong>{req.mentorName}</strong>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold self-start sm:self-auto ${
                        req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1">
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Goals:</strong> {req.goals}
                    </p>
                    {req.notes && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <strong>Notes:</strong> {req.notes}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Preferred Date: {req.preferredDate}
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req)}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(req)}
                        className="rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                      >
                        Accept Proposal
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book / Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedMentor.avatar}
                  alt={selectedMentor.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Request Mentorship with {selectedMentor.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedMentor.roleTitle} @ {selectedMentor.company}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Topic / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Learning Objectives / Goals *
                </label>
                <textarea
                  rows={2}
                  required
                  value={requestGoals}
                  onChange={(e) => setRequestGoals(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Availability Notes
                </label>
                <input
                  type="text"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. Evenings after 6 PM PKT"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Mentorship Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Mentor Modal */}
      {ratingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Rate Session with {ratingSession.mentorName}
              </h3>
              <button
                type="button"
                onClick={() => setRatingSession(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Star Rating (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 text-2xl transition hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= ratingStars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    {ratingStars} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Feedback & Review
                </label>
                <textarea
                  rows={3}
                  value={ratingReview}
                  onChange={(e) => setRatingReview(e.target.value)}
                  placeholder="Share how this session helped your career trajectory..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRatingSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
