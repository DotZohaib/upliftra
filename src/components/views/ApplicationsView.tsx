import React, { useState } from 'react';
import {
  ClipboardCheck,
  Send,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Building,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react';
import { Application, ApplicationStatus } from '../../types';
import { getApplications, updateApplicationStatus } from '../../lib/storage';

export const ApplicationsView: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(getApplications());
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const statuses: ApplicationStatus[] = [
    'Submitted',
    'Under Review',
    'Shortlisted',
    'Interview Scheduled',
    'Offer Received',
    'Rejected',
  ];

  const handleStatusChange = (id: string, newStatus: ApplicationStatus) => {
    updateApplicationStatus(id, newStatus);
    setApplications(getApplications());
    if (selectedApp && selectedApp.id === id) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
  };


  const filtered = applications.filter((a) => {
    if (filterStatus === 'All') return true;
    return a.status === filterStatus;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Shortlisted':
        return 'bg-[#97f5cc] text-[#002115] border-emerald-300 font-bold';
      case 'Interview Scheduled':
        return 'bg-[#dae2fd] text-[#131b2e] border-indigo-200 font-bold';
      case 'Offer Received':
        return 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            Applications Pipeline Tracker
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Track stage progress, interview invites, and local application records across Pakistani firms.
          </p>
        </div>

      </div>

      {/* Pipeline Status Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statuses.map((st) => {
          const count = applications.filter((a) => a.status === st).length;
          const isSelected = filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(isSelected ? 'All' : st)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                {st}
              </span>
              <span className="font-display font-extrabold text-xl mt-0.5 block">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#047857]" />
            <span className="text-xs font-bold text-slate-900">
              Active Records ({filtered.length})
            </span>
          </div>
          {filterStatus !== 'All' && (
            <button
              onClick={() => setFilterStatus('All')}
              className="text-xs text-[#047857] hover:underline font-semibold"
            >
              Show all ({applications.length})
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No applications in the "{filterStatus}" stage.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-slate-900">
                        {app.opportunityTitle}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 mt-0.5">{app.company}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Applied on {app.appliedDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <FileText className="w-3.5 h-3.5" />
                        {app.cvName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Updater Control */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <select
                    value={app.status}
                    onChange={(e) =>
                      handleStatusChange(app.id, e.target.value as ApplicationStatus)
                    }
                    className="h-8 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#047857]"
                  >
                    {statuses.map((st) => (
                      <option key={st} value={st}>
                        Move to: {st}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setSelectedApp(app)}
                    className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Application ID: {selectedApp.id}
                </span>
                <h3 className="font-display font-bold text-base text-slate-900 mt-0.5">
                  {selectedApp.opportunityTitle}
                </h3>
                <span className="text-xs font-bold text-slate-600">{selectedApp.company}</span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Stage Status:</span>
                <span className="font-bold text-[#047857]">{selectedApp.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted On:</span>
                <span className="font-bold text-slate-800">{selectedApp.appliedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attached Dossier:</span>
                <span className="font-bold text-slate-800">{selectedApp.cvName}</span>
              </div>
            </div>

            {selectedApp.coverLetter && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">Cover Letter / Note:</span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedApp.coverLetter}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
