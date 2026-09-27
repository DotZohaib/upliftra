import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Search,
  Plus,
  Phone,
  Video,
  MoreVertical,
  Trash2,
  User,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  X,
  Smile,
  Paperclip,
} from 'lucide-react';
import {
  getCurrentUser,
  getDirectMessages,
  sendDirectMessage,
  deleteDirectMessage,
  getUsers,
  getConnections,
} from '../../lib/storage';
import { DirectMessage, User as UserType } from '../../types';

interface ConversationMeta {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerRole: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

export const MessagesView: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType>(() => getCurrentUser());
  const [allMessages, setAllMessages] = useState<DirectMessage[]>(() => getDirectMessages());
  const [activePartnerId, setActivePartnerId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [activeCallModal, setActiveCallModal] = useState<'audio' | 'video' | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with local storage events
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(getCurrentUser());
      setAllMessages(getDirectMessages());
    };

    window.addEventListener('upliftra_data_changed', handleStorageChange);
    return () => window.removeEventListener('upliftra_data_changed', handleStorageChange);
  }, []);

  // Ensure initial seed messages if list is empty
  useEffect(() => {
    const msgs = getDirectMessages();
    if (msgs.length === 0) {
      // Seed a couple of realistic conversations
      sendDirectMessage(
        'user_bilal',
        'Bilal Ahmed',
        'Assalam-o-Alaikum! Looking forward to our mock interview session tomorrow at 7 PM PKT.'
      );
      sendDirectMessage(
        'user_recruiter',
        'Zainab Malik',
        'Hello! Your profile was shortlisted for the Graduate Software Engineer Trainee batch.'
      );
      setAllMessages(getDirectMessages());
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, activePartnerId]);

  // Derive conversation list for current user
  const allUsers = getUsers();
  const connections = getConnections();

  const conversationMap = new Map<string, ConversationMeta>();

  allMessages.forEach((msg) => {
    const isSender = msg.senderId === currentUser.id;
    const isReceiver = msg.receiverId === currentUser.id;

    if (!isSender && !isReceiver) return;

    const partnerId = isSender ? msg.receiverId : msg.senderId;
    const partnerName = isSender ? msg.receiverName : msg.senderName;
    const partnerObj = allUsers.find((u) => u.id === partnerId);

    const partnerAvatar =
      partnerObj?.avatar ||
      msg.senderAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const partnerRole = partnerObj ? `${partnerObj.role} • ${partnerObj.institution || partnerObj.city}` : 'Upliftra Member';

    const existing = conversationMap.get(partnerId);
    if (!existing) {
      conversationMap.set(partnerId, {
        partnerId,
        partnerName: partnerObj?.name || partnerName,
        partnerAvatar,
        partnerRole,
        lastMessage: msg.content,
        lastTimestamp: msg.timestamp,
        unreadCount: !isSender && !msg.read ? 1 : 0,
      });
    } else {
      existing.lastMessage = msg.content;
      existing.lastTimestamp = msg.timestamp;
      if (!isSender && !msg.read) {
        existing.unreadCount += 1;
      }
    }
  });

  const conversations = Array.from(conversationMap.values()).filter(
    (c) =>
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Default active conversation
  useEffect(() => {
    if (!activePartnerId && conversations.length > 0) {
      setActivePartnerId(conversations[0].partnerId);
    }
  }, [conversations, activePartnerId]);

  const activePartner =
    allUsers.find((u) => u.id === activePartnerId) ||
    conversations.find((c) => c.partnerId === activePartnerId) || {
      id: activePartnerId,
      name: 'Upliftra Member',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      role: 'Professional Member',
      institution: 'Pakistan',
    };

  const activePartnerMessages = allMessages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.receiverId === activePartnerId) ||
      (m.senderId === activePartnerId && m.receiverId === currentUser.id)
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartnerId) return;

    const partnerName =
      'name' in activePartner ? activePartner.name : 'partnerName' in activePartner ? (activePartner as any).partnerName : 'Contact';

    sendDirectMessage(activePartnerId, partnerName, inputText.trim());
    setInputText('');
    setAllMessages(getDirectMessages());

    // Auto simulated reply for realistic responsiveness
    setTimeout(() => {
      const replies = [
        'Walaikum Assalam! Received your note. I will review and get back to you shortly.',
        'Thank you for reaching out! Let me check my calendar for our next discussion.',
        'Great point. We value your interest and will coordinate with the team.',
        'Understood! I will forward the relevant details to your registered email as well.',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const currentMsgs = getDirectMessages();
      const convId = [currentUser.id, activePartnerId].sort().join('_');
      const autoMsg: DirectMessage = {
        id: `msg_auto_${Date.now()}`,
        conversationId: `conv_${convId}`,
        senderId: activePartnerId,
        senderName: partnerName,
        senderAvatar:
          'avatar' in activePartner ? activePartner.avatar : (activePartner as any).partnerAvatar,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
        content: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true,
      };

      currentMsgs.push(autoMsg);
      localStorage.setItem('upliftra_messages', JSON.stringify(currentMsgs));
      setAllMessages(getDirectMessages());
      window.dispatchEvent(new CustomEvent('upliftra_data_changed', { detail: { key: 'upliftra_messages' } }));
    }, 1200);
  };

  const handleDeleteMessage = (msgId: string) => {
    deleteDirectMessage(msgId);
    setAllMessages(getDirectMessages());
  };

  const handleStartNewChat = (user: UserType) => {
    setActivePartnerId(user.id);
    setIsNewChatModalOpen(false);
    setMobileShowChat(true);

    // If no prior message, send a warm introductory icebreaker
    const hasPrior = allMessages.some(
      (m) =>
        (m.senderId === currentUser.id && m.receiverId === user.id) ||
        (m.senderId === user.id && m.receiverId === currentUser.id)
    );
    if (!hasPrior) {
      sendDirectMessage(
        user.id,
        user.name,
        `Assalam-o-Alaikum ${user.name}! I connected with you on Upliftra Network.`
      );
      setAllMessages(getDirectMessages());
    }
  };

  return (
    <div id="messages_view_container" className="flex flex-col gap-6 w-full pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
            Direct Messages & Networking Inquiries
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time encrypted communication with recruiters, verified mentors, university liaisons, and peers.
          </p>
        </div>

        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Main Messaging Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-12 h-[680px] overflow-hidden">
        {/* Left: Conversations Directory (4 cols) */}
        <div
          className={`md:col-span-4 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages or contacts..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-transparent focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chats ({conversations.length})
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified Network
              </span>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-emerald-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No conversations found</p>
                <p className="text-[11px] text-slate-400 mt-1">Start a conversation from your network!</p>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
                >
                  Start Chat
                </button>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.partnerId === activePartnerId;
                return (
                  <div
                    key={c.partnerId}
                    onClick={() => {
                      setActivePartnerId(c.partnerId);
                      setMobileShowChat(true);
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-700'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <img
                      src={c.partnerAvatar}
                      alt={c.partnerName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white truncate">
                          {c.partnerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">{c.lastTimestamp}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate block">
                        {c.partnerRole}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                        {c.lastMessage}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat View (8 cols) */}
        <div
          className={`md:col-span-8 flex flex-col h-full bg-slate-50/30 dark:bg-slate-900/30 ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activePartnerId ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={
                      'avatar' in activePartner
                        ? activePartner.avatar
                        : (activePartner as any).partnerAvatar
                    }
                    alt={'name' in activePartner ? activePartner.name : (activePartner as any).partnerName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <h3 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                      {'name' in activePartner ? activePartner.name : (activePartner as any).partnerName}
                    </h3>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      {'role' in activePartner ? activePartner.role : (activePartner as any).partnerRole}
                    </span>
                  </div>
                </div>

                {/* Call & Action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveCallModal('audio')}
                    title="Start Voice Call"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveCallModal('video')}
                    title="Start Video Meeting"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ml-1">
                    Active on Upliftra
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                <div className="flex justify-center my-2">
                  <span className="text-[10px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    This is the start of your direct conversation on Upliftra Network
                  </span>
                </div>

                {activePartnerMessages.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs my-auto">
                    No messages in this chat yet. Send your greetings below!
                  </div>
                ) : (
                  activePartnerMessages.map((m) => {
                    const isMe = m.senderId === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[82%] sm:max-w-[70%] group ${
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed relative ${
                            isMe
                              ? 'bg-emerald-700 text-white rounded-br-none shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-xs'
                          }`}
                        >
                          <p>{m.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 px-1">
                          <span>{m.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          <button
                            onClick={() => handleDeleteMessage(m.id)}
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:underline text-[9px] transition ml-1"
                            title="Delete message"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message (e.g. follow-up on opportunity, mentorship session)..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-700 border border-transparent focus:border-emerald-700 transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 flex items-center justify-center shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 text-emerald-700 opacity-60" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Select a Conversation</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Choose a conversation from the sidebar or click "New Conversation" to message Pakistani professionals, recruiters, and mentors.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Start New Conversation
              </h3>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select any verified Pakistani student, recruiter, founder, or mentor from the platform directory:
            </p>

            <div className="overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {allUsers
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartNewChat(u)}
                    className="pt-2 pb-1 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 p-2 rounded-xl cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{u.name}</h4>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                          {u.role} • {u.institution || u.location}
                        </span>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition">
                      Chat
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Call / Video Simulation Modal */}
      {activeCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 animate-pulse">
              {activeCallModal === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
            </div>

            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Connecting {activeCallModal === 'video' ? 'Video Meeting' : 'Voice Call'}...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Calling{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {'name' in activePartner ? activePartner.name : (activePartner as any).partnerName}
                </strong>
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-1">
                Upliftra WebRTC Peer-to-Peer Link Active
              </span>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setActiveCallModal(null)}
                className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
