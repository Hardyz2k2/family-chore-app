import { useEffect, useState } from 'react';
import {
  Briefcase, Plus, X, Clock, Check, DollarSign, Star, Send,
  Users, AlertCircle, ChevronDown, ChevronUp, Award, Ban
} from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';

interface Job {
  jobId: string;
  familyId: string;
  postedBy: string;
  postedByName: string;
  title: string;
  description: string;
  rewardType: 'points' | 'cash';
  rewardAmount: number;
  jobType: 'open' | 'application';
  dueDate: string | null;
  status: string;
  assignedTo: string | null;
  assignedToName: string | null;
  applicationCount: number;
  createdAt: string;
}

interface Application {
  applicationId: string;
  jobId: string;
  userId: string;
  firstName: string;
  age: number;
  reason: string;
  bidAmount: number | null;
  status: string;
  createdAt: string;
}

export default function Jobs() {
  const { user, family } = useStore();
  const isParent = user?.role === 'parent';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});

  // Create job form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState<'points' | 'cash'>('points');
  const [rewardAmount, setRewardAmount] = useState(50);
  const [jobType, setJobType] = useState<'open' | 'application'>('open');
  const [dueDate, setDueDate] = useState('');

  // Apply form
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applyReason, setApplyReason] = useState('');
  const [applyBid, setApplyBid] = useState<number | ''>('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    if (!family?.familyId) return;
    try {
      const data = await api.getJobs(family.familyId);
      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.familyId || !title.trim()) return;
    setActionLoading('create');
    setError('');
    try {
      await api.createJob({
        family_id: family.familyId,
        title,
        description,
        reward_type: rewardType,
        reward_amount: rewardAmount,
        job_type: jobType,
        due_date: dueDate || undefined,
      });
      setTitle(''); setDescription(''); setRewardAmount(50); setDueDate('');
      setShowCreateForm(false);
      setSuccess('Job posted!');
      setTimeout(() => setSuccess(''), 2000);
      await loadJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApply = async (jobId: string) => {
    setActionLoading(jobId);
    setError('');
    try {
      const result = await api.applyToJob(jobId, {
        reason: applyReason,
        bid_amount: applyBid || undefined,
      });
      setApplyingJobId(null);
      setApplyReason('');
      setApplyBid('');
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 2500);
      await loadJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptOpen = async (jobId: string) => {
    setActionLoading(jobId);
    setError('');
    try {
      const result = await api.applyToJob(jobId, {});
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 2500);
      await loadJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept job');
    } finally {
      setActionLoading(null);
    }
  };

  const loadApplications = async (jobId: string) => {
    try {
      const data = await api.getJobApplications(jobId);
      setApplications(prev => ({ ...prev, [jobId]: data }));
    } catch (err) {
      console.error('Error loading applications:', err);
    }
  };

  const handleAssign = async (jobId: string, applicationId: string) => {
    setActionLoading(applicationId);
    try {
      await api.assignJob(jobId, applicationId);
      setSuccess('Job assigned!');
      setTimeout(() => setSuccess(''), 2000);
      await loadJobs();
      await loadApplications(jobId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      await api.completeJob(jobId);
      setSuccess('Marked as done! Waiting for parent to confirm.');
      setTimeout(() => setSuccess(''), 2500);
      await loadJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark complete');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      const result = await api.confirmJob(jobId);
      setSuccess(result.message);
      setTimeout(() => setSuccess(''), 3000);
      await loadJobs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = async (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
      if (isParent && !applications[jobId]) {
        await loadApplications(jobId);
      }
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-purple-100 text-purple-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'No deadline';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const openJobs = jobs.filter(j => j.status === 'open');
  const myActiveJobs = jobs.filter(j => j.assignedTo === user?.userId && (j.status === 'assigned' || j.status === 'completed'));
  const otherJobs = jobs.filter(j => j.status !== 'open' && !(j.assignedTo === user?.userId && (j.status === 'assigned' || j.status === 'completed')));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase size={24} />
              Jobs Board
            </h1>
            <p className="text-indigo-200 mt-1">
              {isParent ? 'Post jobs for your children to earn extra rewards' : 'Pick up jobs to earn points or cash!'}
            </p>
          </div>
          {isParent && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition text-sm font-semibold backdrop-blur-sm"
            >
              <Plus size={18} />
              Post Job
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Check size={16} /> {success}
        </div>
      )}

      {/* Create Job Form (Parent) */}
      {showCreateForm && isParent && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Post a New Job</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Organise the garage" className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe what needs to be done..." className="w-full px-4 py-2 border rounded-lg" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type</label>
                <select value={rewardType} onChange={e => setRewardType(e.target.value as any)}
                  className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="points">Points</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {rewardType === 'cash' ? 'Amount ($)' : 'Points'}
                </label>
                <input type="number" min="1" value={rewardAmount} onChange={e => setRewardAmount(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select value={jobType} onChange={e => setJobType(e.target.value as any)}
                  className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="open">Open (First come, first served)</option>
                  <option value="application">Application Required</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {jobType === 'open' ? 'Any child can claim it instantly' : 'Children apply with a reason, you choose who gets it'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="flex-1 border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={actionLoading === 'create'}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                {actionLoading === 'create' ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Briefcase className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900">No jobs yet</h2>
          <p className="text-gray-500 mt-2">
            {isParent ? 'Post a job for your children to earn extra rewards!' : 'Check back later for new jobs from your parents!'}
          </p>
        </div>
      ) : (
        <>
          {/* Open Jobs */}
          {openJobs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Open Jobs</h2>
              <div className="space-y-3">
                {openJobs.map(job => (
                  <JobCard key={job.jobId} job={job} expanded={expandedJob === job.jobId}
                    onToggle={() => toggleExpand(job.jobId)}
                    apps={applications[job.jobId]}
                    isParent={isParent} userId={user?.userId}
                    actionLoading={actionLoading}
                    onAccept={() => handleAcceptOpen(job.jobId)}
                    onApply={() => setApplyingJobId(job.jobId)}
                    onAssign={(appId) => handleAssign(job.jobId, appId)}
                    onComplete={() => handleComplete(job.jobId)}
                    onConfirm={() => handleConfirm(job.jobId)}
                    statusColor={statusColor} formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* My Active Jobs (child) */}
          {!isParent && myActiveJobs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">My Active Jobs</h2>
              <div className="space-y-3">
                {myActiveJobs.map(job => (
                  <JobCard key={job.jobId} job={job} expanded={expandedJob === job.jobId}
                    onToggle={() => toggleExpand(job.jobId)}
                    apps={applications[job.jobId]}
                    isParent={isParent} userId={user?.userId}
                    actionLoading={actionLoading}
                    onAccept={() => {}} onApply={() => {}}
                    onAssign={() => {}}
                    onComplete={() => handleComplete(job.jobId)}
                    onConfirm={() => handleConfirm(job.jobId)}
                    statusColor={statusColor} formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past / Other Jobs */}
          {otherJobs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                {isParent ? 'All Jobs' : 'Other Jobs'}
              </h2>
              <div className="space-y-3">
                {otherJobs.map(job => (
                  <JobCard key={job.jobId} job={job} expanded={expandedJob === job.jobId}
                    onToggle={() => toggleExpand(job.jobId)}
                    apps={applications[job.jobId]}
                    isParent={isParent} userId={user?.userId}
                    actionLoading={actionLoading}
                    onAccept={() => {}} onApply={() => {}}
                    onAssign={(appId) => handleAssign(job.jobId, appId)}
                    onComplete={() => handleComplete(job.jobId)}
                    onConfirm={() => handleConfirm(job.jobId)}
                    statusColor={statusColor} formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Apply Modal */}
      {applyingJobId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Apply for Job</h3>
              <button onClick={() => { setApplyingJobId(null); setApplyReason(''); setApplyBid(''); }}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Why are you a good fit?</label>
                <textarea value={applyReason} onChange={e => setApplyReason(e.target.value)}
                  placeholder="Tell your parents why you should get this job..."
                  className="w-full px-4 py-2 border rounded-lg" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Bid (optional)</label>
                <input type="number" min="1" value={applyBid} onChange={e => setApplyBid(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Suggest a different reward amount"
                  className="w-full px-4 py-2 border rounded-lg" />
                <p className="text-xs text-gray-500 mt-1">Leave empty to accept the posted reward</p>
              </div>
              <button
                onClick={() => handleApply(applyingJobId)}
                disabled={actionLoading === applyingJobId}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {actionLoading === applyingJobId ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Job Card Component ───
function JobCard({ job, expanded, onToggle, apps, isParent, userId, actionLoading, onAccept, onApply, onAssign, onComplete, onConfirm, statusColor, formatDate }: {
  job: Job; expanded: boolean; onToggle: () => void;
  apps?: Application[]; isParent: boolean; userId?: string;
  actionLoading: string | null;
  onAccept: () => void; onApply: () => void;
  onAssign: (appId: string) => void;
  onComplete: () => void; onConfirm: () => void;
  statusColor: (s: string) => string; formatDate: (d: string | null) => string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <button onClick={onToggle} className="w-full p-5 text-left">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(job.status)}`}>
                {job.status}
              </span>
            </div>
            {job.description && <p className="text-sm text-gray-500 line-clamp-2">{job.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {job.rewardType === 'cash'
                  ? <><DollarSign size={12} className="text-green-600" /><span className="font-semibold text-green-700">${job.rewardAmount}</span></>
                  : <><Star size={12} className="text-yellow-500" /><span className="font-semibold text-yellow-700">{job.rewardAmount} pts</span></>
                }
              </span>
              <span className="flex items-center gap-1"><Clock size={12} />{formatDate(job.dueDate)}</span>
              {job.jobType === 'application' && (
                <span className="flex items-center gap-1"><Users size={12} />{job.applicationCount} applied</span>
              )}
              {job.assignedToName && (
                <span className="flex items-center gap-1 text-blue-600"><Award size={12} />{job.assignedToName}</span>
              )}
            </div>
          </div>
          <div className="ml-3 shrink-0">
            {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
          {job.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Details</p>
              <p className="text-sm text-gray-700">{job.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              {job.jobType === 'application' ? 'Application required' : 'Open — first come, first served'}
            </span>
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              Posted by {job.postedByName}
            </span>
            {job.dueDate && (
              <span className={`px-2 py-1 rounded-full ${
                new Date(job.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-gray-100'
              }`}>
                Due: {formatDate(job.dueDate)}
              </span>
            )}
          </div>

          {/* CHILD ACTIONS */}
          {!isParent && job.status === 'open' && (
            <div>
              {job.jobType === 'open' ? (
                <button onClick={onAccept} disabled={actionLoading === job.jobId}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading === job.jobId ? 'Accepting...' : <><Check size={16} /> Accept This Job</>}
                </button>
              ) : (
                <button onClick={onApply}
                  className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                  <Send size={16} /> Apply for This Job
                </button>
              )}
            </div>
          )}

          {!isParent && job.assignedTo === userId && job.status === 'assigned' && (
            <button onClick={onComplete} disabled={actionLoading === job.jobId}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {actionLoading === job.jobId ? 'Submitting...' : <><Check size={16} /> Mark as Done</>}
            </button>
          )}

          {!isParent && job.assignedTo === userId && job.status === 'completed' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-sm text-yellow-800 font-medium">Waiting for parent to confirm completion</p>
            </div>
          )}

          {!isParent && job.assignedTo === userId && job.status === 'confirmed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm text-green-800 font-medium">
                {job.rewardType === 'cash'
                  ? `${job.rewardAmount} cash confirmed! Ask your parent to hand it over.`
                  : `${job.rewardAmount} points earned!`
                }
              </p>
            </div>
          )}

          {job.status === 'expired' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center flex items-center justify-center gap-2">
              <Ban size={16} className="text-red-500" />
              <p className="text-sm text-red-700 font-medium">This job expired. Points were deducted for not completing on time.</p>
            </div>
          )}

          {/* PARENT ACTIONS */}
          {isParent && job.status === 'completed' && (
            <button onClick={onConfirm} disabled={actionLoading === job.jobId}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {actionLoading === job.jobId ? 'Confirming...' : <><Check size={16} /> Confirm Completion & Award</>}
            </button>
          )}

          {/* Applications (Parent view for application-type jobs) */}
          {isParent && job.jobType === 'application' && job.status === 'open' && apps && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Applications ({apps.length})</p>
              {apps.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">No applications yet</p>
              ) : (
                <div className="space-y-2">
                  {apps.map(app => (
                    <div key={app.applicationId} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{app.firstName} (age {app.age})</p>
                          {app.reason && <p className="text-xs text-gray-600 mt-1">"{app.reason}"</p>}
                          {app.bidAmount && (
                            <p className="text-xs text-purple-600 font-medium mt-1">
                              Bid: {job.rewardType === 'cash' ? `$${app.bidAmount}` : `${app.bidAmount} pts`}
                            </p>
                          )}
                        </div>
                        {app.status === 'pending' && (
                          <button
                            onClick={() => onAssign(app.applicationId)}
                            disabled={actionLoading === app.applicationId}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                          >
                            {actionLoading === app.applicationId ? '...' : 'Pick'}
                          </button>
                        )}
                        {app.status === 'accepted' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">Accepted</span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">Not selected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isParent && job.jobType === 'application' && apps && apps.length === 0 && job.status === 'open' && (
            <p className="text-xs text-gray-400 text-center">Loading applications...</p>
          )}
        </div>
      )}
    </div>
  );
}
