import React, { useState, useEffect } from 'react';
import {
  MessageSquareShare,
  ThumbsUp,
  MessageCircle,
  Share2,
  Tag,
  Plus,
  Send,
  UserCheck,
  X,
  Sparkles,
  Pin,
  Flag,
  Trash2,
  AlertCircle,
  Check,
  Shield,
  ShieldAlert,
  MoreVertical,
  CornerDownRight,
} from 'lucide-react';
import { CommunityPost, CommunityReport, User } from '../../types';
import {
  getCommunityPosts,
  addCommunityPost,
  toggleUpvote,
  addComment,
  getCurrentUser,
  reportCommunityPost,
  deleteCommunityPost,
  pinCommunityPost,
  getCommunityReports,
  resolveCommunityReport,
} from '../../lib/storage';
import { isModerator, isAdmin } from '../../lib/permissions';
import confetti from 'canvas-confetti';

export const CommunityView: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>(() => getCommunityPosts());
  const [reports, setReports] = useState<CommunityReport[]>(() => getCommunityReports());
  const [selectedTag, setSelectedTag] = useState('All');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('#TechJobsPK, #CareerAdvice');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'moderation'>('feed');

  // Report Modal
  const [reportingPost, setReportingPost] = useState<CommunityPost | null>(null);
  const [reportReason, setReportReason] = useState('Spam / Misleading Information');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentUser: User = getCurrentUser();
  const canModerate = isModerator(currentUser.role) || isAdmin(currentUser.role);

  useEffect(() => {
    const handleStorageChange = () => {
      setPosts(getCommunityPosts());
      setReports(getCommunityReports());
    };
    window.addEventListener('upliftra_data_changed', handleStorageChange);
    return () => window.removeEventListener('upliftra_data_changed', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const allTags = [
    'All',
    '#CareerAdvice',
    '#TechJobsPK',
    '#StudyAbroad',
    '#Fulbright',
    '#StartupStories',
    '#NUST',
    '#DSA',
  ];

  const filteredPosts = posts
    .filter((p) => {
      if (selectedTag === 'All') return true;
      return p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const handleToggleUpvote = (postId: string) => {
    toggleUpvote(postId);
    setPosts(getCommunityPosts());
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const tags = newPostTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addCommunityPost(newPostContent, tags);
    setPosts(getCommunityPosts());
    setNewPostContent('');
    setIsNewPostModalOpen(false);
    showToast('Post published to community!');
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch {}
  };

  const handleSendComment = (postId: string) => {
    if (!commentInput.trim()) return;
    addComment(postId, commentInput);
    setPosts(getCommunityPosts());
    setCommentInput('');
    showToast('Comment added!');
  };

  const handlePinPost = (postId: string) => {
    pinCommunityPost(postId);
    setPosts(getCommunityPosts());
    showToast('Post pin status updated.');
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Are you sure you want to delete this community post?')) {
      deleteCommunityPost(postId);
      setPosts(getCommunityPosts());
      showToast('Post removed.');
    }
  };

  const handleOpenReport = (post: CommunityPost) => {
    setReportingPost(post);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;

    reportCommunityPost(reportingPost.id, reportingPost.author, reportingPost.content, reportReason);
    setReports(getCommunityReports());
    setReportingPost(null);
    showToast('Report submitted for moderator review. Thank you for keeping Upliftra safe.');
  };

  const handleDismissReport = (reportId: string) => {
    resolveCommunityReport(reportId, 'dismissed');
    setReports(getCommunityReports());
    showToast('Report dismissed.');
  };

  const handleRemoveReportedPost = (report: CommunityReport) => {
    deleteCommunityPost(report.postId);
    resolveCommunityReport(report.id, 'action_taken');
    setPosts(getCommunityPosts());
    setReports(getCommunityReports());
    showToast('Reported post deleted and report resolved.');
  };

  return (
    <div id="community_view_container" className="flex flex-col gap-6 w-full pb-16 max-w-5xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          <Check className="h-4 w-4" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
            Pakistan Career Community & Discussions
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Exchange tips on interview experiences, university degrees, scholarships, and startup hiring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canModerate && (
            <button
              onClick={() => setActiveTab(activeTab === 'feed' ? 'moderation' : 'feed')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Moderation Queue ({reports.filter((r) => r.status === 'pending').length})</span>
            </button>
          )}

          <button
            onClick={() => setIsNewPostModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discussion Post</span>
          </button>
        </div>
      </div>

      {/* Moderation Hub Tab (For Moderator & Admins) */}
      {activeTab === 'moderation' && canModerate && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Community Moderation Dashboard</h2>
            </div>
            <button
              onClick={() => setActiveTab('feed')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Back to Public Feed
            </button>
          </div>

          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No community reports logged. Everything is peaceful!</p>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-500">
                        Reported by: <strong>{rep.reporterName}</strong> on {rep.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                      "{rep.postSnippet}"
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Author: {rep.postAuthor} • Status: <strong className="uppercase">{rep.status}</strong>
                    </span>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDismissReport(rep.id)}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        onClick={() => handleRemoveReportedPost(rep)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tags Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTag === tag
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="flex flex-col gap-4">
        {filteredPosts.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No posts in this category yet.</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to share an insight or question with the community!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isOwner = post.authorId === currentUser.id || post.author === currentUser.name;
            const canDelete = isOwner || canModerate;
            const isCommentOpen = activeCommentPostId === post.id;

            return (
              <div
                key={post.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs transition-all flex flex-col gap-4 ${
                  post.isPinned
                    ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/10 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {post.author}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {post.authorRole}
                        </span>
                        {post.isPinned && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                            <Pin className="w-3 h-3 fill-current" />
                            Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {post.authorTitle} • {post.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown / Menu */}
                  <div className="flex items-center gap-1">
                    {canModerate && (
                      <button
                        onClick={() => handlePinPost(post.id)}
                        title={post.isPinned ? 'Unpin post' : 'Pin post to top'}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          post.isPinned
                            ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        title="Delete post"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {!isOwner && (
                      <button
                        onClick={() => handleOpenReport(post)}
                        title="Report post"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 transition"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Interaction Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleUpvote(post.id)}
                      className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-semibold"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.upvotes} Upvotes</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPostId(isCommentOpen ? null : post.id)}
                      className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length} Comments</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400">Verified Pakistan Community</span>
                </div>

                {/* Comments Expandable Section */}
                {isCommentOpen && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                    {/* Existing Comments */}
                    {post.comments.length > 0 && (
                      <div className="space-y-2.5">
                        {post.comments.map((comm) => (
                          <div
                            key={comm.id}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                          >
                            <img
                              src={comm.authorAvatar}
                              alt={comm.author}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {comm.author}
                                </span>
                                <span className="text-[10px] text-slate-400">{comm.timestamp}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 mt-0.5">{comm.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendComment(post.id);
                          }
                        }}
                        placeholder="Add a constructive reply..."
                        className="flex-1 h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden border border-transparent focus:border-emerald-600"
                      />
                      <button
                        onClick={() => handleSendComment(post.id)}
                        className="h-9 px-3 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Post Modal */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Share Discussion with Pakistan Network
              </h3>
              <button
                onClick={() => setIsNewPostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  What would you like to share or ask?
                </label>
                <textarea
                  rows={5}
                  required
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share interview questions from Systems Ltd, scholarship tips for Fulbright/Erasmus, or hiring insights..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Hashtags (Comma separated)
                </label>
                <input
                  type="text"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  placeholder="#TechJobsPK, #CareerAdvice, #NUST, #FAST"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-600" />
                Report Community Post
              </h3>
              <button
                onClick={() => setReportingPost(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please help keep Upliftra Network safe and authentic by reporting inappropriate or misleading posts.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Spam / Commercial Advertising">Spam / Commercial Advertising</option>
                  <option value="Misleading / Fake Job Listing">Misleading / Fake Job Listing</option>
                  <option value="Harassment / Uncivil Content">Harassment / Uncivil Content</option>
                  <option value="Plagiarized Material">Plagiarized Material</option>
                  <option value="Irrelevant to Pakistani Tech">Irrelevant to Pakistani Tech</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
