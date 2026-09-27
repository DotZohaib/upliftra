import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  ExternalLink,
  Plus,
  X,
  FileSpreadsheet,
  Upload,
  Sparkles,
  Check,
  Building,
  Briefcase,
  Share2,
} from 'lucide-react';
import { Opportunity, OpportunityType, User } from '../../types';
import {
  getOpportunities,
  addOpportunity,
  submitApplication,
  getCurrentUser,
  getSavedOpportunityIds,
  toggleSaveOpportunity,
  isOpportunitySaved,
} from '../../lib/storage';
import { hasPermission } from '../../lib/permissions';
import confetti from 'canvas-confetti';

interface OpportunitiesViewProps {
  onSelectOpportunity?: (opp: Opportunity) => void;
  searchQuery?: string;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  searchQuery = '',
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(getOpportunities());
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [workplaceType, setWorkplaceType] = useState<string>('All');
  const [experienceLevel, setExperienceLevel] = useState<string>('All');
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedOpportunityIds());
  const [selectedOppForModal, setSelectedOppForModal] = useState<Opportunity | null>(null);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyingOpp, setApplyingOpp] = useState<Opportunity | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedCv, setSelectedCv] = useState('CV_Resume_2025.pdf');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Post Opportunity Modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newType, setNewType] = useState<OpportunityType>('Job');
  const [newLocation, setNewLocation] = useState('Lahore, Pakistan');
  const [newSalary, setNewSalary] = useState('PKR 150,000 / month');
  const [newDeadline, setNewDeadline] = useState('2025-08-31');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newSource, setNewSource] = useState('https://');

  const currentUser: User = getCurrentUser();
  const canPost = hasPermission('postOpportunities');

  useEffect(() => {
    const handleStorageChange = () => {
      setOpportunities(getOpportunities());
      setSavedIds(getSavedOpportunityIds());
    };
    window.addEventListener('upliftra_data_changed', handleStorageChange);
    return () => window.removeEventListener('upliftra_data_changed', handleStorageChange);
  }, []);

  // Filter opportunities
  const filtered = opportunities.filter((opp) => {
    // Saved only
    if (showSavedOnly && !savedIds.includes(opp.id)) return false;

    // Type
    if (selectedType !== 'All' && opp.type !== selectedType) return false;

    // City
    if (selectedCity !== 'All') {
      if (selectedCity === 'Remote' && !opp.remote) return false;
      if (selectedCity !== 'Remote' && !opp.location.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
    }

    // Workplace type (Remote / Onsite / Hybrid)
    if (workplaceType === 'Remote' && !opp.remote) return false;
    if (workplaceType === 'Onsite' && opp.remote) return false;
    if (workplaceType === 'Hybrid' && !opp.location.toLowerCase().includes('hybrid')) return false;

    // Experience level
    if (experienceLevel === 'Entry-level' && !(opp.tags.some(t => t.toLowerCase().includes('entry') || t.toLowerCase().includes('fresh') || t.toLowerCase().includes('intern')) || opp.type === 'Internship')) {
      return false;
    }
    if (experienceLevel === 'Mid/Senior' && (opp.type === 'Internship' || opp.tags.some(t => t.toLowerCase().includes('fresh')))) {
      return false;
    }

    // Search query
    const query = (localSearch || searchQuery).toLowerCase();
    if (query) {
      const matchTitle = opp.title.toLowerCase().includes(query);
      const matchCompany = opp.company.toLowerCase().includes(query);
      const matchLocation = opp.location.toLowerCase().includes(query);
      const matchTags = opp.tags.some((t) => t.toLowerCase().includes(query));
      if (!matchTitle && !matchCompany && !matchLocation && !matchTags) return false;
    }

    return true;
  });

  const handleBookmarkToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleSaveOpportunity(id);
    setSavedIds(updated);
  };

  const handleOpenApplyModal = (opp: Opportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    setApplyingOpp(opp);
    setCoverLetter(
      `Dear Hiring Team at ${opp.company},\n\nI am writing to apply for the ${opp.title} position on Upliftra Network. With my background in ${currentUser.skills?.slice(0, 3).join(', ') || 'Software Development'}, I am confident I will be a strong addition to your team.`
    );
    setIsApplyModalOpen(true);
    setAppliedSuccess(false);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingOpp) return;
    setIsSubmittingApp(true);

    setTimeout(() => {
      submitApplication({
        opportunityId: applyingOpp.id,
        opportunityTitle: applyingOpp.title,
        company: applyingOpp.company,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantEmail: currentUser.email,
        status: 'Submitted',
        cvName: selectedCv,
        coverLetter: coverLetter,
      });

      setIsSubmittingApp(false);
      setAppliedSuccess(true);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      } catch {}

      setTimeout(() => {
        setIsApplyModalOpen(false);
        setAppliedSuccess(false);
      }, 1400);
    }, 500);
  };

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCompany) return;

    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      title: newTitle,
      type: newType,
      company: newCompany,
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80',
      description: newDescription || `Exciting opportunity at ${newCompany} published via Upliftra Network.`,
      location: newLocation,
      remote: newLocation.toLowerCase().includes('remote'),
      salary: newSalary,
      deadline: newDeadline,
      category: 'Software & Technology',
      officialSource: newSource || 'https://upliftra.pk',
      applicationLink: newSource || 'https://upliftra.pk',
      verificationStatus: 'verified',
      partnerType: 'Accredited Partner',
      aiMatchScore: 94,
      tags: ['New Listing', 'Direct Application', 'Verified'],
      requirements: newRequirements
        ? newRequirements.split('\n').filter(Boolean)
        : ['Demonstrated excellence in relevant skills', 'Strong analytical mindset'],
      createdAt: new Date().toISOString(),
    };

    addOpportunity(newOpp);
    setOpportunities(getOpportunities());
    setIsPostModalOpen(false);
    setNewTitle('');
    setNewCompany('');
    setNewDescription('');
    setNewRequirements('');
  };

  return (
    <div id="opportunities_view_container" className="flex flex-col gap-6 w-full pb-16 max-w-7xl mx-auto">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
            Pakistan Opportunities & Fellowships
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Browse verified tech jobs, paid internships, HEC scholarships, and national competitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Post Opportunity</span>
            </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        {/* Type pills + Saved Only toggle */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5">
            {['All', 'Job', 'Internship', 'Scholarship', 'Fellowship', 'Competition'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedType === type
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {type === 'All' ? 'All Types' : `${type}s`}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              showSavedOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-current' : ''}`} />
            <span>Saved ({savedIds.length})</span>
          </button>
        </div>

        {/* Secondary Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Keyword Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by role, company, skill (e.g. Next.js, Python, HEC, FAST)..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 border border-transparent"
            />
          </div>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-600"
          >
            <option value="All">All Pakistani Cities</option>
            <option value="Lahore">Lahore</option>
            <option value="Karachi">Karachi</option>
            <option value="Islamabad">Islamabad / Rawalpindi</option>
            <option value="Peshawar">Peshawar</option>
            <option value="Faisalabad">Faisalabad</option>
            <option value="Remote">Remote</option>
          </select>

          {/* Workplace Type */}
          <select
            value={workplaceType}
            onChange={(e) => setWorkplaceType(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-600"
          >
            <option value="All">Any Workplace Type</option>
            <option value="Remote">Remote Only</option>
            <option value="Onsite">On-site Only</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Opportunities Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 flex flex-col items-center gap-2">
            <Building className="w-8 h-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No opportunities match this filter.</p>
            <button
              onClick={() => {
                setSelectedType('All');
                setSelectedCity('All');
                setWorkplaceType('All');
                setShowSavedOnly(false);
                setLocalSearch('');
              }}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filtered.map((opp) => {
            const isBookmarked = savedIds.includes(opp.id);
            return (
              <div
                key={opp.id}
                onClick={() => setSelectedOppForModal(opp)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between gap-3 group cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <img
                        src={opp.logo}
                        alt={opp.company}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{opp.company}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {opp.type}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                          {opp.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleBookmarkToggle(opp.id, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {opp.location}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{opp.salary}</span>
                    <span>•</span>
                    <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {opp.deadline}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {opp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">Source: {opp.partnerType || 'Direct'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleOpenApplyModal(opp, e)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                    >
                      <span>1-Click Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOppForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedOppForModal.logo}
                  alt={selectedOppForModal.company}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <span className="text-xs font-bold text-slate-500">{selectedOppForModal.company}</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    {selectedOppForModal.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{selectedOppForModal.location}</span>
                    <span>•</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedOppForModal.salary}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOppForModal(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Overview</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedOppForModal.description}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Requirements & Eligibility
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                {selectedOppForModal.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Link</span>
                <a
                  href={selectedOppForModal.officialSource}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                >
                  <span>Visit Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Deadline</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedOppForModal.deadline}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOppForModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={(e) => {
                  const opp = selectedOppForModal;
                  setSelectedOppForModal(null);
                  handleOpenApplyModal(opp, e);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <span>Proceed to Apply</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Application Modal */}
      {isApplyModalOpen && applyingOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Apply for {applyingOpp.title}
                </h3>
                <p className="text-xs text-slate-500">{applyingOpp.company} • {applyingOpp.location}</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {appliedSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Application Successfully Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Your profile and resume were forwarded to {applyingOpp.company}. You can track this in your Applications tab.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Uploaded CV
                  </label>
                  <select
                    value={selectedCv}
                    onChange={(e) => setSelectedCv(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Ayesha_Khan_CV_FullStack_2025.pdf">Ayesha_Khan_CV_FullStack_2025.pdf (Verified)</option>
                    <option value="Ayesha_Khan_Academic_Resume.pdf">Ayesha_Khan_Academic_Resume.pdf</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cover Note / Intro
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Your verified Upliftra Profile badges will be attached to this submission.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApp}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-2"
                  >
                    {isSubmittingApp ? 'Submitting Application...' : 'Confirm & Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post Opportunity Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Post Opportunity on Upliftra
              </h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Position / Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Associate Cloud Architect / Summer Intern"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Careem / Systems Ltd"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Type *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as OpportunityType)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Job">Job</option>
                    <option value="Internship">Internship</option>
                    <option value="Scholarship">Scholarship</option>
                    <option value="Fellowship">Fellowship</option>
                    <option value="Competition">Competition</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Location / Work mode
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Lahore, Pakistan (Hybrid)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Compensation / Stipend
                  </label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="e.g. PKR 180,000 / month"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Role Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide background on the responsibilities, project scope, and perks..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Requirements (One per line)
                </label>
                <textarea
                  rows={2}
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  placeholder="Degree in CS or related field&#10;Proficiency in TypeScript & modern web frameworks"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
