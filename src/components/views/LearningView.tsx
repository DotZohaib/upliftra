import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Star,
  CheckCircle2,
  Award,
  ChevronRight,
  Play,
  FileCheck,
  X,
  Sparkles,
  Plus,
  Search,
  Download,
  Share2,
  Check,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { Course, Certificate, CourseModule } from '../../types';
import {
  getCourses,
  addCourse,
  toggleCourseModule,
  getCertificates,
  issueCertificate,
  getCurrentUser,
} from '../../lib/storage';
import { hasPermission } from '../../lib/permissions';
import confetti from 'canvas-confetti';

export const LearningView: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(() => getCourses());
  const [certificates, setCertificates] = useState<Certificate[]>(() => getCertificates());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(courses[0] || null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'tracks' | 'certificates'>('tracks');

  // Certificate Modal
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  // New Course Modal State (for Trainers)
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Tech & Engineering');
  const [newLevel, setNewLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [newDuration, setNewDuration] = useState('4 Weeks');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('Free');
  const [moduleNamesStr, setModuleNamesStr] = useState('Introduction to Fundamentals, Core Implementations, Capstone Project');

  const currentUser = getCurrentUser();
  const canCreateCourse = hasPermission('createCourses') || currentUser.role === 'Trainer';

  useEffect(() => {
    const handleStorageChange = () => {
      setCourses(getCourses());
      setCertificates(getCertificates());
    };
    window.addEventListener('upliftra_data_changed', handleStorageChange);
    return () => window.removeEventListener('upliftra_data_changed', handleStorageChange);
  }, []);

  const categories = [
    'All',
    'Tech & Engineering',
    'AI & Data',
    'Global Scholarships & Fellowships',
    'Exam Prep (IELTS / GRE / CSS)',
    'Freelancing & High-Ticket Services',
  ];

  const filteredCourses = courses.filter((c) => {
    if (selectedCategory === 'All') return true;
    return c.category.toLowerCase().includes(selectedCategory.toLowerCase()) || selectedCategory.toLowerCase().includes(c.category.toLowerCase());
  });

  const calculateProgress = (course: Course) => {
    const total = course.modules.length;
    if (total === 0) return 0;
    const completed = course.modules.filter((m) => m.completed).length;
    return Math.round((completed / total) * 100);
  };

  const handleToggleModule = (courseId: string, moduleId: string) => {
    toggleCourseModule(courseId, moduleId);
    const updated = getCourses();
    setCourses(updated);
    if (selectedCourse && selectedCourse.id === courseId) {
      const match = updated.find((c) => c.id === courseId);
      if (match) setSelectedCourse(match);
    }
  };

  const handleClaimCertificate = (course: Course) => {
    const newCert = issueCertificate(currentUser, course);
    setCertificates(getCertificates());
    setViewingCert(newCert);
    try {
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.5 } });
    } catch {}
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const modules: CourseModule[] = moduleNamesStr
      .split(',')
      .map((name, i) => ({
        id: `mod_${Date.now()}_${i}`,
        title: name.trim(),
        duration: '45 mins',
        completed: false,
      }))
      .filter((m) => m.title.length > 0);

    const newCourseObj: Course = {
      id: `course_${Date.now()}`,
      title: newTitle,
      instructor: currentUser.name,
      instructorAvatar: currentUser.avatar,
      duration: newDuration,
      category: newCategory,
      rating: 4.9,
      level: newLevel,
      description: newDescription || `Comprehensive masterclass designed for Pakistani developers and graduates.`,
      enrolledCount: 1,
      modules,
    };

    addCourse(newCourseObj);
    setCourses(getCourses());
    setSelectedCourse(newCourseObj);
    setShowAddCourse(false);
    // Reset
    setNewTitle('');
    setNewDescription('');
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <div id="learning_view_container" className="flex flex-col gap-6 w-full pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
            Upliftra Learning Hub & Industry Certifications
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Free career acceleration tracks, exam preparation (IELTS, GRE, CSS), and verified digital certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateCourse && (
            <button
              onClick={() => setShowAddCourse(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
            >
              <Plus className="h-4 w-4" />
              Create Course Track
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher: Tracks vs Earned Certificates */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'tracks'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Explore Learning Tracks ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'certificates'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="h-4 w-4" />
            My Certificates ({certificates.length})
          </button>
        </div>
      </div>

      {/* Tracks View */}
      {activeTab === 'tracks' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 2-Column: Catalog & Interactive Lessons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Tracks Catalog (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tracks ({filteredCourses.length})
              </span>

              {filteredCourses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                const progress = calculateProgress(c);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourse(c)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-emerald-600 shadow-md ring-1 ring-emerald-600/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {c.category} • {c.level}
                        </span>
                        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                          {c.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{c.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {c.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.instructorAvatar}
                          alt={c.instructor}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                          {c.instructor}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {c.duration}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 text-[11px]">
                        {progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Course Modules & Details (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {selectedCourse ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {selectedCourse.category} • {selectedCourse.level}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedCourse.duration}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                      {selectedCourse.title}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedCourse.description}
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={selectedCourse.instructorAvatar}
                        alt={selectedCourse.instructor}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {selectedCourse.instructor}
                        </span>
                        <span className="text-[11px] text-slate-500">Lead Curriculum Instructor</span>
                      </div>
                    </div>
                  </div>

                  {/* Modules Checkbox List */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        Curriculum Modules ({selectedCourse.modules.length})
                      </h3>
                      <span className="text-xs text-slate-500">
                        {calculateProgress(selectedCourse)}% Completed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedCourse.modules.map((mod, idx) => (
                        <div
                          key={mod.id}
                          onClick={() => handleToggleModule(selectedCourse.id, mod.id)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            mod.completed
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                mod.completed
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                              }`}
                            >
                              {mod.completed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span className="text-xs font-semibold">{mod.title}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{mod.duration}</span>
                            <Play className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Claim Certificate CTA when 100% complete */}
                  {calculateProgress(selectedCourse) === 100 ? (
                    <div className="p-4 rounded-xl bg-linear-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-amber-300 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm">Track 100% Completed!</h4>
                          <p className="text-xs text-emerald-100">
                            You qualify for your official verified Upliftra digital certificate.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaimCertificate(selectedCourse)}
                        className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-extrabold transition-all shadow-md shrink-0"
                      >
                        Claim Certificate
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Complete all {selectedCourse.modules.length} lessons to unlock and generate your verified credential.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Select a course to preview its syllabus</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificates View */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
              <Award className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No certificates claimed yet</h3>
              <p className="text-xs text-slate-500 mt-1">Complete 100% of any learning track to earn verified certificates.</p>
              <button
                type="button"
                onClick={() => setActiveTab('tracks')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Go to Courses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        VERIFIED
                      </span>
                      <span className="text-[10px] text-slate-400">{cert.credentialId}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2.5 text-amber-600">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cert.courseTitle}</h4>
                        <p className="text-xs text-slate-500">Awarded to: {cert.studentName}</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <p>Issuer: <strong>{cert.issuer}</strong></p>
                      <p>Issue Date: {cert.issueDate}</p>
                      <p className="text-[10px] text-slate-400 truncate">Verify: {cert.verificationUrl}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewingCert(cert)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      View Certificate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewingCert(cert);
                        setTimeout(() => window.print(), 300);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border-4 border-amber-400 bg-white p-8 shadow-2xl dark:bg-slate-900 text-center space-y-6">
            <button
              onClick={() => setViewingCert(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Certificate Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                UN
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                Upliftra Network Pakistan • Certificate of Achievement
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">This is proudly presented to</p>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                {viewingCert.studentName}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto pt-2">
                for successfully completing the rigorous curriculum, practical assignments, and evaluations in
              </p>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 pt-1">
                {viewingCert.courseTitle}
              </h3>
            </div>

            {/* Certificate Metadata Bar */}
            <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-200 dark:border-slate-800 py-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ISSUER</span>
                <strong className="text-slate-800 dark:text-slate-200">{viewingCert.issuer}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ISSUE DATE</span>
                <strong className="text-slate-800 dark:text-slate-200">{viewingCert.issueDate}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CREDENTIAL ID</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">{viewingCert.credentialId}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Verified Digitally via Upliftra
              </span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Track Modal (For Trainers / Admins) */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Create New Learning Course Track
              </h3>
              <button
                onClick={() => setShowAddCourse(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Track Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js 15 & Cloud Native Microservices"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Tech & Engineering">Tech & Engineering</option>
                    <option value="AI & Data">AI & Data</option>
                    <option value="Global Scholarships & Fellowships">Global Scholarships</option>
                    <option value="Exam Prep (IELTS / GRE / CSS)">Exam Prep (IELTS / GRE)</option>
                    <option value="Freelancing & High-Ticket Services">Freelancing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Level
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="e.g. 6 Weeks"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pricing (PKR)
                  </label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Free / PKR 5,000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Track Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Overview of syllabus, prerequisites, and learning outcomes..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lesson Modules (Comma separated)
                </label>
                <textarea
                  rows={2}
                  value={moduleNamesStr}
                  onChange={(e) => setModuleNamesStr(e.target.value)}
                  placeholder="Module 1: Setup, Module 2: Core Routing, Module 3: Deployment"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
