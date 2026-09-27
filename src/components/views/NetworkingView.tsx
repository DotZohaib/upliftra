import React, { useState } from 'react';
import {
  Connection,
  User,
} from '../../types';
import {
  getCurrentUser,
  getUsers,
  getConnections,
  sendConnectionRequest,
  updateConnectionStatus,
  removeConnection,
} from '../../lib/storage';
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  ExternalLink,
  Trash2,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NetworkingViewProps {
  onOpenDirectMessage?: (targetUser: User) => void;
  onNavigateToProfile?: () => void;
}

export const NetworkingView: React.FC<NetworkingViewProps> = ({
  onOpenDirectMessage,
}) => {
  const currentUser = getCurrentUser();
  const allUsers = getUsers().filter((u) => u.id !== currentUser.id);
  const connections = getConnections();

  const [activeTab, setActiveTab] = useState<'discover' | 'my-network' | 'pending'>('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Determine connection status with a specific user
  const getConnectionStatusWith = (otherUserId: string): { status: 'none' | 'pending_sent' | 'pending_received' | 'connected'; connectionId?: string } => {
    const conn = connections.find(
      (c) =>
        (c.requesterId === currentUser.id && c.receiverId === otherUserId) ||
        (c.receiverId === currentUser.id && c.requesterId === otherUserId)
    );

    if (!conn) return { status: 'none' };
    if (conn.status === 'connected') return { status: 'connected', connectionId: conn.id };
    if (conn.requesterId === currentUser.id) return { status: 'pending_sent', connectionId: conn.id };
    return { status: 'pending_received', connectionId: conn.id };
  };

  const handleConnect = (user: User) => {
    sendConnectionRequest(user);
    showNotification(`Connection request sent to ${user.name}!`);
    try {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
    } catch {}
  };

  const handleAccept = (connId: string, name: string) => {
    updateConnectionStatus(connId, 'connected');
    showNotification(`Connected with ${name}!`);
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  const handleReject = (connId: string) => {
    updateConnectionStatus(connId, 'rejected');
    showNotification('Connection request declined.');
  };

  const handleRemove = (connId: string, name: string) => {
    if (confirm(`Are you sure you want to remove connection with ${name}?`)) {
      removeConnection(connId);
      showNotification(`Removed connection with ${name}.`);
    }
  };

  // Filtered users for discovery
  const filteredUsers = allUsers.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.institution || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.skills || []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole = selectedRoleFilter === 'All' || u.role === selectedRoleFilter;
    const matchCity = selectedCityFilter === 'All' || (u.location || '').includes(selectedCityFilter);

    return matchSearch && matchRole && matchCity;
  });

  // Connected users
  const connectedUserIds = connections
    .filter((c) => c.status === 'connected' && (c.requesterId === currentUser.id || c.receiverId === currentUser.id))
    .map((c) => (c.requesterId === currentUser.id ? c.receiverId : c.requesterId));

  const myConnectedUsers = allUsers.filter((u) => connectedUserIds.includes(u.id));

  // Pending incoming requests
  const pendingIncoming = connections.filter(
    (c) => c.status === 'pending' && c.receiverId === currentUser.id
  );

  return (
    <div id="networking_view_container" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          <Check className="h-4 w-4" />
          {actionSuccess}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-md dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Users className="h-3.5 w-3.5" />
              Pakistan Professional Directory
            </span>
            <h1 className="mt-2 text-2xl font-bold">Network & Connect Across Pakistan</h1>
            <p className="mt-1 text-xs text-emerald-100/80 max-w-xl">
              Connect with students from NUST, FAST, LUMS, GIKI, tech recruiters at Systems Ltd & Arbisoft, and Silicon Valley diaspora mentors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-xs">
              <div className="text-xl font-bold">{myConnectedUsers.length}</div>
              <div className="text-[10px] uppercase text-emerald-200 font-semibold tracking-wider">Connections</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-xs">
              <div className="text-xl font-bold">{pendingIncoming.length}</div>
              <div className="text-[10px] uppercase text-amber-200 font-semibold tracking-wider">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('discover')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'discover'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Discover People ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('my-network')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'my-network'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            My Connections ({myConnectedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Pending Requests
            {pendingIncoming.length > 0 && (
              <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
                {pendingIncoming.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Discover People Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, university, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="All">All Roles</option>
              <option value="Student">Students</option>
              <option value="Professional">Professionals</option>
              <option value="Mentor">Mentors</option>
              <option value="Recruiter">Recruiters</option>
              <option value="Startup/Founder">Founders</option>
              <option value="Trainer">Trainers</option>
            </select>

            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="All">All Cities</option>
              <option value="Lahore">Lahore</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Karachi">Karachi</option>
              <option value="Faisalabad">Faisalabad</option>
              <option value="Peshawar">Peshawar</option>
            </select>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((person) => {
              const { status, connectionId } = getConnectionStatusWith(person.id);
              return (
                <div
                  key={person.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-emerald-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {person.name}
                            {person.verificationStatus === 'verified' && (
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </h3>
                          <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {person.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                      {person.title}
                    </p>

                    <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500">
                      {person.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {person.location}
                        </span>
                      )}
                      {person.institution && (
                        <span className="flex items-center gap-1 truncate">
                          <GraduationCap className="h-3 w-3 shrink-0" />
                          {person.institution}
                        </span>
                      )}
                    </div>

                    {/* Skills pills */}
                    {person.skills && person.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {person.skills.slice(0, 3).map((sk, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {status === 'connected' ? (
                      <div className="flex items-center gap-2 w-full">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <UserCheck className="h-4 w-4" />
                          Connected
                        </span>
                        {onOpenDirectMessage && (
                          <button
                            type="button"
                            onClick={() => onOpenDirectMessage(person)}
                            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Message
                          </button>
                        )}
                      </div>
                    ) : status === 'pending_sent' ? (
                      <button
                        type="button"
                        disabled
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed dark:bg-slate-800"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Request Pending
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(person)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Network Tab */}
      {activeTab === 'my-network' && (
        <div className="space-y-4">
          {myConnectedUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No connections yet</h3>
              <p className="text-xs text-slate-500 mt-1">Discover mentors, recruiters, and students to build your circle.</p>
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Discover People
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myConnectedUsers.map((person) => {
                const conn = connections.find(
                  (c) =>
                    (c.requesterId === currentUser.id && c.receiverId === person.id) ||
                    (c.receiverId === currentUser.id && c.requesterId === person.id)
                );
                return (
                  <div
                    key={person.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="h-11 w-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{person.name}</h4>
                          <span className="text-xs text-slate-500 line-clamp-1">{person.title}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {onOpenDirectMessage && (
                        <button
                          type="button"
                          onClick={() => onOpenDirectMessage(person)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat
                        </button>
                      )}
                      {conn && (
                        <button
                          type="button"
                          onClick={() => handleRemove(conn.id, person.name)}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pending Incoming Requests Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingIncoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <UserCheck className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No pending requests</h3>
              <p className="text-xs text-slate-500 mt-1">You’re completely caught up on your connection invitations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIncoming.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.requesterAvatar}
                      alt={req.requesterName}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.requesterName}</h4>
                      <p className="text-xs text-slate-500">{req.requesterTitle} • {req.requesterRole}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(req.id, req.requesterName)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept Connection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
