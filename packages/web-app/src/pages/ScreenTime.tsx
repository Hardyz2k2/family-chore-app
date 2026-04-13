import { useEffect, useState } from 'react';
import { Monitor, Clock, Star, CheckCircle, XCircle, AlertTriangle, Save, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';

interface ChildScreenTime {
  userId: string;
  name: string;
  settings: {
    dailyLimitMinutes: number;
    mustCompleteDailyChores: boolean;
    minimumPointsRequired: number;
  };
  access: {
    hasAccess: boolean;
    currentPoints: number;
    totalChores: number;
    completedChores: number;
    reason: string | null;
  };
}

export default function ScreenTime() {
  const { user, family } = useStore();
  const isParent = user?.role === 'parent';
  const [children, setChildren] = useState<ChildScreenTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    if (family?.members) {
      loadScreenTimeData();
    }
  }, [family]);

  const loadScreenTimeData = async () => {
    if (!family?.members) return;

    const childMembers = family.members.filter((m: any) => m.role === 'child');
    const childData: ChildScreenTime[] = [];

    for (const child of childMembers) {
      try {
        const [settings, access] = await Promise.all([
          api.getScreenTimeSettings(child.userId),
          api.checkScreenTimeAccess(child.userId)
        ]);

        childData.push({
          userId: child.userId,
          name: child.firstName || child.nickname || 'Child',
          settings: {
            dailyLimitMinutes: settings.dailyLimitMinutes || 120,
            mustCompleteDailyChores: settings.mustCompleteDailyChores ?? true,
            minimumPointsRequired: settings.minimumPointsRequired || 0
          },
          access: {
            hasAccess: access.hasAccess,
            currentPoints: access.currentPoints,
            totalChores: access.totalChores,
            completedChores: access.completedChores,
            reason: access.reason
          }
        });
      } catch (err) {
        childData.push({
          userId: child.userId,
          name: child.firstName || child.nickname || 'Child',
          settings: { dailyLimitMinutes: 120, mustCompleteDailyChores: true, minimumPointsRequired: 0 },
          access: { hasAccess: false, currentPoints: 0, totalChores: 0, completedChores: 0, reason: 'Error loading data' }
        });
      }
    }

    setChildren(childData);
    setLoading(false);
  };

  const updateSettings = async (userId: string, updates: Partial<ChildScreenTime['settings']>) => {
    const child = children.find(c => c.userId === userId);
    if (!child) return;

    setChildren(prev => prev.map(c =>
      c.userId === userId ? { ...c, settings: { ...c.settings, ...updates } } : c
    ));
  };

  const saveSettings = async (userId: string) => {
    const child = children.find(c => c.userId === userId);
    if (!child) return;

    setSaving(userId);
    try {
      await api.updateScreenTimeSettings(userId, {
        daily_limit_minutes: child.settings.dailyLimitMinutes,
        must_complete_daily_chores: child.settings.mustCompleteDailyChores,
        minimum_points_required: child.settings.minimumPointsRequired
      });

      // Reload access status
      const access = await api.checkScreenTimeAccess(userId);
      setChildren(prev => prev.map(c =>
        c.userId === userId ? {
          ...c,
          access: {
            hasAccess: access.hasAccess,
            currentPoints: access.currentPoints,
            totalChores: access.totalChores,
            completedChores: access.completedChores,
            reason: access.reason
          }
        } : c
      ));
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isParent) {
    // Child view - show their own access status
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Screen Time</h1>

        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
            children[0]?.access.hasAccess ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {children[0]?.access.hasAccess ? (
              <CheckCircle className="text-green-600" size={48} />
            ) : (
              <XCircle className="text-red-600" size={48} />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {children[0]?.access.hasAccess ? 'Screen Time Available!' : 'Screen Time Locked'}
          </h2>

          {children[0]?.access.hasAccess ? (
            <p className="text-gray-600">
              Great job completing your chores! You have earned your screen time.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">{children[0]?.access.reason}</p>

              <div className="bg-gray-50 rounded-xl p-4 text-left max-w-sm mx-auto">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Chores Done</span>
                  <span className="font-semibold">{children[0]?.access.completedChores} / {children[0]?.access.totalChores}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Points</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Star size={16} className="text-yellow-500" />
                    {children[0]?.access.currentPoints}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parent view - manage all children
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Screen Time Management</h1>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <Monitor className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900">No Children Added</h2>
          <p className="text-gray-500 mt-2">Add children in Settings to manage their screen time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child) => (
            <div key={child.userId} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {/* Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedChild(selectedChild === child.userId ? null : child.userId)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                    child.access.hasAccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      {child.access.hasAccess ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} />
                          Access Granted
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle size={14} />
                          {child.access.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className={`text-gray-400 transition-transform ${selectedChild === child.userId ? 'rotate-90' : ''}`}
                />
              </div>

              {/* Expanded Settings */}
              {selectedChild === child.userId && (
                <div className="border-t p-6 space-y-6 bg-gray-50">
                  {/* Status Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 text-center">
                      <Clock className="mx-auto text-primary-600 mb-2" size={24} />
                      <p className="text-2xl font-bold text-gray-900">{child.settings.dailyLimitMinutes}</p>
                      <p className="text-xs text-gray-500">Daily Minutes</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <Star className="mx-auto text-yellow-500 mb-2" size={24} />
                      <p className="text-2xl font-bold text-gray-900">{child.access.currentPoints}</p>
                      <p className="text-xs text-gray-500">Current Points</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <CheckCircle className="mx-auto text-green-600 mb-2" size={24} />
                      <p className="text-2xl font-bold text-gray-900">{child.access.completedChores}/{child.access.totalChores}</p>
                      <p className="text-xs text-gray-500">Today's Chores</p>
                    </div>
                  </div>

                  {/* Settings Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Screen Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="480"
                        step="15"
                        value={child.settings.dailyLimitMinutes}
                        onChange={(e) => updateSettings(child.userId, { dailyLimitMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">Require Daily Chores</p>
                        <p className="text-sm text-gray-500">Must complete all daily chores to unlock</p>
                      </div>
                      <button
                        onClick={() => updateSettings(child.userId, { mustCompleteDailyChores: !child.settings.mustCompleteDailyChores })}
                        className={`relative w-12 h-6 rounded-full transition ${
                          child.settings.mustCompleteDailyChores ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                          child.settings.mustCompleteDailyChores ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Points Required
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={child.settings.minimumPointsRequired}
                        onChange={(e) => updateSettings(child.userId, { minimumPointsRequired: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Child needs at least this many points to unlock screen time</p>
                    </div>
                  </div>

                  <button
                    onClick={() => saveSettings(child.userId)}
                    disabled={saving === child.userId}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving === child.userId ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <>
                        <Save size={18} />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-primary-50 rounded-xl p-6">
        <div className="flex gap-4">
          <AlertTriangle className="text-primary-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-primary-900">How Screen Time Works</h3>
            <ul className="text-sm text-primary-700 mt-2 space-y-1">
              <li>• Set daily time limits for each child</li>
              <li>• Require chore completion before unlocking screen time</li>
              <li>• Set minimum point thresholds for access</li>
              <li>• Children can check their status in the app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
