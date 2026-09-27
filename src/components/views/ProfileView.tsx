import React, { useState, useRef } from 'react';
import {
  User,
  SkillItem,
  EducationRecord,
  ExperienceRecord,
  SkillLevel,
} from '../../types';
import {
  getCurrentUser,
  updateUser,
  calculateProfileCompletion,
} from '../../lib/storage';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Globe,
  Github,
  Linkedin,
  Award,
  CheckCircle,
  AlertCircle,
  Save,
  Check,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

export const ProfileView: React.FC = () => {
  const [user, setUser] = useState<User>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<'basic' | 'professional' | 'education' | 'experience' | 'skills'>('basic');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Basic & Professional
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [title, setTitle] = useState(user.title);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || 'Pakistan');
  const [location, setLocation] = useState(user.location);
  const [bio, setBio] = useState(user.bio);
  const [industry, setIndustry] = useState(user.industry || 'Information Technology');
  const [careerGoals, setCareerGoals] = useState(user.careerGoals || '');
  const [portfolio, setPortfolio] = useState(user.portfolio || '');
  const [linkedin, setLinkedin] = useState(user.linkedin || '');
  const [github, setGithub] = useState(user.github || '');
  const [website, setWebsite] = useState(user.website || '');
  const [interestsStr, setInterestsStr] = useState((user.interests || []).join(', '));
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Invalid image format. Please select JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setPhotoError('Image size exceeds 3 MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      showToast('Profile photo updated! Click "Save All Changes" to persist.');
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar(DEFAULT_AVATAR_URL);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Profile photo reverted to standard default avatar.');
  };

  // Education list state
  const [educationList, setEducationList] = useState<EducationRecord[]>(
    user.educationList || [
      {
        id: 'edu_default',
        institution: user.institution || 'University of Karachi / NUST',
        degree: 'BS Computer Science',
        field: 'Software Engineering',
        startYear: '2021',
        endYear: '2025',
        grade: 'CGPA 3.8 / 4.0',
        description: 'Studying modern distributed computing and AI architectures.',
      },
    ]
  );

  // Experience list state
  const [experienceList, setExperienceList] = useState<ExperienceRecord[]>(
    user.experienceList || [
      {
        id: 'exp_default',
        company: 'Systems Limited / Arbisoft',
        position: 'Software Engineering Intern',
        employmentType: 'Internship',
        startDate: 'Jun 2024',
        endDate: 'Aug 2024',
        isCurrent: false,
        description: 'Developed scalable frontend web components in React and TypeScript.',
      },
    ]
  );

  // Skill items state
  const [skillItems, setSkillItems] = useState<SkillItem[]>(
    user.skillItems && user.skillItems.length > 0
      ? user.skillItems
      : (user.skills || ['React', 'TypeScript', 'Tailwind CSS']).map((s, i) => ({
          id: `sk_${i}`,
          name: s,
          level: 'Advanced' as SkillLevel,
        }))
  );

  // Modal / Inline forms for adding new items
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Intermediate');

  const [newEdu, setNewEdu] = useState<Partial<EducationRecord>>({
    institution: '',
    degree: '',
    field: '',
    startYear: '2022',
    endYear: '2026',
    grade: '',
    description: '',
  });
  const [showAddEdu, setShowAddEdu] = useState(false);

  const [newExp, setNewExp] = useState<Partial<ExperienceRecord>>({
    company: '',
    position: '',
    employmentType: 'Full-time',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });
  const [showAddExp, setShowAddExp] = useState(false);

  // Dynamic Profile Completion Calculation
  const completionData = calculateProfileCompletion({
    ...user,
    name,
    avatar,
    email,
    phone,
    location,
    bio,
    educationList,
    experienceList,
    skillItems,
    linkedin,
    github,
    portfolio,
    careerGoals,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = () => {
    const interests = interestsStr
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const skills = skillItems.map((s) => s.name);

    const updated: User = {
      ...user,
      name,
      avatar,
      title,
      email,
      phone,
      city,
      country,
      location: location || `${city}, ${country}`,
      bio,
      industry,
      careerGoals,
      portfolio,
      linkedin,
      github,
      website,
      interests,
      skills,
      skillItems,
      educationList,
      experienceList,
      education: educationList[0]
        ? `${educationList[0].degree} @ ${educationList[0].institution}`
        : user.education,
      experience: experienceList[0]
        ? `${experienceList[0].position} @ ${experienceList[0].company}`
        : user.experience,
      profileCompletion: completionData.percentage,
      updatedAt: new Date().toISOString(),
    };

    updateUser(updated);
    setUser(updated);
    showToast('Profile updated successfully!');
    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    } catch {
      // Ignore confetti errors
    }
  };

  // Skill Handlers
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const item: SkillItem = {
      id: `sk_${Date.now()}`,
      name: newSkillName.trim(),
      level: newSkillLevel,
    };
    const nextSkills = [...skillItems, item];
    setSkillItems(nextSkills);
    setNewSkillName('');
    showToast(`Added skill: ${item.name}`);
  };

  const handleDeleteSkill = (id: string) => {
    setSkillItems(skillItems.filter((s) => s.id !== id));
  };

  const handleUpdateSkillLevel = (id: string, level: SkillLevel) => {
    setSkillItems(
      skillItems.map((s) => (s.id === id ? { ...s, level } : s))
    );
  };

  // Education Handlers
  const handleAddEducation = () => {
    if (!newEdu.institution || !newEdu.degree) {
      alert('Please provide institution and degree.');
      return;
    }
    const item: EducationRecord = {
      id: `edu_${Date.now()}`,
      institution: newEdu.institution,
      degree: newEdu.degree,
      field: newEdu.field || '',
      startYear: newEdu.startYear || '',
      endYear: newEdu.endYear || '',
      grade: newEdu.grade || '',
      description: newEdu.description || '',
    };
    setEducationList([...educationList, item]);
    setShowAddEdu(false);
    setNewEdu({ institution: '', degree: '', field: '', startYear: '2022', endYear: '2026', grade: '', description: '' });
    showToast('Education record added!');
  };

  const handleDeleteEducation = (id: string) => {
    setEducationList(educationList.filter((e) => e.id !== id));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    if (!newExp.company || !newExp.position) {
      alert('Please provide company and position.');
      return;
    }
    const item: ExperienceRecord = {
      id: `exp_${Date.now()}`,
      company: newExp.company,
      position: newExp.position,
      employmentType: newExp.employmentType || 'Full-time',
      startDate: newExp.startDate || '',
      endDate: newExp.isCurrent ? 'Present' : newExp.endDate || '',
      isCurrent: Boolean(newExp.isCurrent),
      description: newExp.description || '',
    };
    setExperienceList([...experienceList, item]);
    setShowAddExp(false);
    setNewExp({ company: '', position: '', employmentType: 'Full-time', startDate: '', endDate: '', isCurrent: false, description: '' });
    showToast('Experience record added!');
  };

  const handleDeleteExperience = (id: string) => {
    setExperienceList(experienceList.filter((e) => e.id !== id));
  };

  return (
    <div id="profile_view_container" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <Check className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {/* Header Profile Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute top-0 left-0 right-0 h-28 bg-linear-to-r from-emerald-800 via-teal-700 to-slate-900 opacity-90" />
        <div className="relative pt-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={name}
                className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md dark:border-slate-800"
              />
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{name}</h1>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {user.role}
                </span>
                {user.verificationStatus === 'verified' && (
                  <span className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">{title}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {location || `${city}, ${country}`}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                </span>
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 transition"
            >
              <Save className="h-4 w-4" />
              Save All Changes
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Profile Completion Meter */}
      <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-emerald-50 via-white to-teal-50/40 p-5 shadow-xs dark:border-slate-800 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Profile Strength & Readiness</span>
          </div>
          <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
            {completionData.percentage}% Complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full bg-linear-to-r from-emerald-600 to-teal-500 transition-all duration-500"
            style={{ width: `${completionData.percentage}%` }}
          />
        </div>

        {completionData.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/40">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Complete your profile to rank higher for recruiters and scholarships:
            </p>
            <div className="flex flex-wrap gap-2">
              {completionData.recommendations.slice(0, 3).map((rec, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-xs dark:bg-slate-800 dark:text-slate-300"
                >
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  {rec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 pb-1">
        {[
          { id: 'basic', label: 'Basic Information', icon: UserIcon },
          { id: 'professional', label: 'Professional & Links', icon: Briefcase },
          { id: 'education', label: `Education (${educationList.length})`, icon: GraduationCap },
          { id: 'experience', label: `Experience (${experienceList.length})`, icon: Award },
          { id: 'skills', label: `Skills (${skillItems.length})`, icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Basic Information */}
      {activeTab === 'basic' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Basic Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Profile Photo (Upload file or provide image URL)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/80 bg-slate-200 shrink-0 shadow-xs">
                  <img
                    src={avatar || DEFAULT_AVATAR_URL}
                    alt={name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{avatar && avatar !== DEFAULT_AVATAR_URL ? 'Replace Photo' : 'Upload Photo'}</span>
                    </button>
                    {avatar && avatar !== DEFAULT_AVATAR_URL && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports JPEG, PNG, or WebP. Max file size: 3 MB.
                  </p>
                  {photoError && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{photoError}</p>
                  )}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="Or paste an image URL (https://...)"
                      className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Professional Headline / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CS Undergrad @ NUST / Aspiring Software Engineer"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore / Islamabad / Karachi"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location Display Label
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Islamabad, Pakistan"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              About / Professional Bio
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Introduce your skills, university background, and career trajectory..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Professional & Online Links */}
      {activeTab === 'professional' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Professional Details & Portfolios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Information Technology / Fintech / Edtech"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Career Interests (Comma Separated)
              </label>
              <input
                type="text"
                value={interestsStr}
                onChange={(e) => setInterestsStr(e.target.value)}
                placeholder="Next.js, Generative AI, Cloud, Distributed Systems"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Profile URL
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Portfolio Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://myportfolio.dev"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization / Personal Website
              </label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Career Goals
            </label>
            <textarea
              rows={3}
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              placeholder="What are your short and long-term career aspirations?"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Education */}
      {activeTab === 'education' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Education History</h2>
              <p className="text-xs text-slate-500">Add your university degrees, colleges, and academic honors</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddEdu(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
            >
              <Plus className="h-4 w-4" />
              Add Education
            </button>
          </div>

          {/* New Education Inline Modal */}
          {showAddEdu && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30 space-y-3">
              <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                New Education Record
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Institution (e.g. NUST / FAST / LUMS)"
                  value={newEdu.institution}
                  onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Degree (e.g. Bachelor of Science)"
                  value={newEdu.degree}
                  onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Field of Study (e.g. Computer Science)"
                  value={newEdu.field}
                  onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Start Year"
                    value={newEdu.startYear}
                    onChange={(e) => setNewEdu({ ...newEdu, startYear: e.target.value })}
                    className="w-1/2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="End Year / Grad"
                    value={newEdu.endYear}
                    onChange={(e) => setNewEdu({ ...newEdu, endYear: e.target.value })}
                    className="w-1/2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Grade / CGPA (e.g. 3.82 / 4.0)"
                value={newEdu.grade}
                onChange={(e) => setNewEdu({ ...newEdu, grade: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <textarea
                placeholder="Academic description, honors, societies..."
                rows={2}
                value={newEdu.description}
                onChange={(e) => setNewEdu({ ...newEdu, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEdu(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save Education
                </button>
              </div>
            </div>
          )}

          {/* Education Records List */}
          <div className="space-y-3">
            {educationList.map((edu) => (
              <div
                key={edu.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 p-4 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h4>
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400">{edu.institution}</p>
                    <p className="text-[11px] text-slate-500">
                      {edu.startYear} - {edu.endYear} {edu.grade && `• Grade: ${edu.grade}`}
                    </p>
                    {edu.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{edu.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Experience */}
      {activeTab === 'experience' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Work Experience & Internships</h2>
              <p className="text-xs text-slate-500">Companies, technical roles, contracts and startup experience</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddExp(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
            >
              <Plus className="h-4 w-4" />
              Add Experience
            </button>
          </div>

          {/* New Experience Inline Modal */}
          {showAddExp && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30 space-y-3">
              <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                New Experience Record
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Company (e.g. Systems Ltd / Careem)"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Position / Title (e.g. Associate Software Engineer)"
                  value={newExp.position}
                  onChange={(e) => setNewExp({ ...newExp, position: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <select
                  value={newExp.employmentType}
                  onChange={(e) => setNewExp({ ...newExp, employmentType: e.target.value as any })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Start (e.g. Jun 2024)"
                    value={newExp.startDate}
                    onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                    className="w-1/2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="End (e.g. Aug 2024)"
                    disabled={newExp.isCurrent}
                    value={newExp.isCurrent ? 'Present' : newExp.endDate}
                    onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                    className="w-1/2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(newExp.isCurrent)}
                  onChange={(e) => setNewExp({ ...newExp, isCurrent: e.target.checked })}
                  className="rounded-sm border-slate-300 text-emerald-600"
                />
                I currently work here
              </label>
              <textarea
                placeholder="Key accomplishments, technologies used, responsibilities..."
                rows={2}
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExp(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Save Experience
                </button>
              </div>
            </div>
          )}

          {/* Experience Records List */}
          <div className="space-y-3">
            {experienceList.map((exp) => (
              <div
                key={exp.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 p-4 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{exp.position}</h4>
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
                      {exp.company} • <span className="text-slate-500">{exp.employmentType}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {exp.startDate} — {exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{exp.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Skills with Proficiency Levels */}
      {activeTab === 'skills' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Technical & Domain Skills</h2>
            <p className="text-xs text-slate-500">
              Add skills with proficiency levels (Beginner, Intermediate, Advanced, Expert)
            </p>
          </div>

          {/* Add Skill Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. Next.js / TypeScript / Docker / Python"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
            <button
              type="button"
              onClick={handleAddSkill}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </button>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {skillItems.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{skill.name}</span>
                  <div className="mt-1">
                    <select
                      value={skill.level}
                      onChange={(e) => handleUpdateSkillLevel(skill.id, e.target.value as SkillLevel)}
                      className={`text-[10px] font-semibold rounded-md px-1.5 py-0.5 border-none cursor-pointer ${
                        skill.level === 'Expert'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : skill.level === 'Advanced'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : skill.level === 'Intermediate'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
