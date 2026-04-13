import { useEffect, useState } from 'react';
import { BookOpen, Trash2, Dog, Cat, Gamepad2, Calendar, Star, Home } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { HouseDetails, GamingRule } from '../types';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

export default function FamilyRules() {
  const { user, family } = useStore();
  const [details, setDetails] = useState<HouseDetails>({});
  const [loading, setLoading] = useState(true);
  const isParent = user?.role === 'parent';

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    if (!family?.familyId) return;
    try {
      const data = await api.getFamilyDetails(family.familyId);
      setDetails(data.house_details || {});
    } catch (err) {
      console.error('Error loading family rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChildName = (id: string) => {
    const m = family?.members?.find(m => m.userId === id);
    return m?.firstName || m?.nickname || 'Unknown';
  };

  // Calculate whose turn it is for bin rotation
  const getBinRotationChild = () => {
    const bin = details.bin_schedule;
    if (!bin?.rotation_children?.length || !bin.rotation_week_start) return null;
    const start = new Date(bin.rotation_week_start);
    const now = new Date();
    const weeksDiff = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const idx = weeksDiff % bin.rotation_children.length;
    return bin.rotation_children[idx];
  };

  // Calculate whose turn for pet care today
  const getPetRotationChild = (rotationChildren: string[]) => {
    if (!rotationChildren?.length) return null;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return rotationChildren[dayOfYear % rotationChildren.length];
  };

  const todayDay = WEEKDAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const hasRooms = (details.scanned_rooms || []).length > 0;
  const hasBins = !!details.bin_schedule?.collection_days?.length;
  const hasPets = (details.pets || []).length > 0;
  const hasGaming = Object.keys(details.gaming_schedule || {}).length > 0;
  const hasAnything = hasRooms || hasBins || hasPets || hasGaming;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen size={24} />
          Family Rules
        </h1>
        <p className="text-teal-100 mt-1">Schedules, routines, and house rules for everyone</p>
      </div>

      {!hasAnything && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900">No rules set up yet</h2>
          <p className="text-gray-500 mt-2">
            {isParent ? 'Go to Settings to set up bin schedules, pet care, gaming rules, and scan rooms.' : 'Your parents haven\'t set up any rules yet.'}
          </p>
        </div>
      )}

      {/* Scanned Rooms */}
      {hasRooms && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Home size={18} className="text-teal-600" /> Scanned Rooms</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {details.scanned_rooms!.map((room, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 text-sm">{room.name}</h3>
                {room.assets?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.assets.slice(0, 6).map((asset, j) => (
                      <span key={j} className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{asset}</span>
                    ))}
                    {room.assets.length > 6 && <span className="text-[10px] text-gray-400">+{room.assets.length - 6}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bin Schedule */}
      {hasBins && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Trash2 size={18} className="text-green-600" /> Bin Collection</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Collection Days</p>
              <div className="flex gap-2">
                {WEEKDAYS.map(day => (
                  <div key={day} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                    details.bin_schedule!.collection_days.includes(day)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {DAY_SHORT[day]}
                  </div>
                ))}
              </div>
            </div>
            {details.bin_schedule!.rotation_children?.length > 0 && (() => {
              const currentChild = getBinRotationChild();
              return (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800">
                    <span className="font-bold">This week's turn:</span>{' '}
                    {currentChild ? getChildName(currentChild) : 'Not set'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Rotation: {details.bin_schedule!.rotation_children.map(id => getChildName(id)).join(' → ')}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Pet Care */}
      {hasPets && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Dog size={18} className="text-amber-600" /> Pet Care
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {details.pets!.map(pet => {
              const walkChild = pet.walk_rotation_children ? getPetRotationChild(pet.walk_rotation_children) : null;
              const litterChild = pet.litter_rotation_children ? getPetRotationChild(pet.litter_rotation_children) : null;

              return (
                <div key={pet.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {pet.type === 'dog' ? <Dog size={18} className="text-amber-600" /> : pet.type === 'cat' ? <Cat size={18} className="text-amber-600" /> : <Star size={18} className="text-amber-600" />}
                    <h3 className="font-semibold text-amber-900">{pet.name}</h3>
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{pet.type}</span>
                  </div>
                  {walkChild && (
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Walk today:</span> {getChildName(walkChild)}
                      <span className="text-xs text-amber-600 ml-2">(rotation: {pet.walk_rotation_children!.map(id => getChildName(id)).join(' → ')})</span>
                    </p>
                  )}
                  {litterChild && (
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Litter today:</span> {getChildName(litterChild)}
                      <span className="text-xs text-amber-600 ml-2">(rotation: {pet.litter_rotation_children!.map(id => getChildName(id)).join(' → ')})</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gaming Schedule */}
      {hasGaming && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Gamepad2 size={18} className="text-purple-600" /> Gaming Schedule
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {Object.entries(details.gaming_schedule!).map(([childId, config]) => {
              // If child view, only show own rules
              if (!isParent && childId !== user?.userId) return null;
              const childName = getChildName(childId);

              return (
                <div key={childId}>
                  <h3 className="text-sm font-semibold text-purple-700 mb-2">{childName}</h3>
                  <div className="space-y-2">
                    {(config as any).rules?.map((rule: GamingRule, idx: number) => {
                      const isToday = rule.days.includes(todayDay);
                      return (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isToday ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold uppercase ${isToday ? 'text-purple-700' : 'text-gray-500'}`}>{rule.device}</span>
                            <div className="flex gap-1">
                              {WEEKDAYS.map(day => (
                                <div key={day} className={`w-6 h-6 rounded text-[9px] flex items-center justify-center font-bold ${
                                  rule.days.includes(day)
                                    ? day === todayDay ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-700'
                                    : 'bg-gray-100 text-gray-300'
                                }`}>
                                  {day.charAt(0).toUpperCase()}
                                </div>
                              ))}
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${isToday ? 'text-purple-700' : 'text-gray-500'}`}>
                            {rule.hours}hr{isToday ? ' today!' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today Summary */}
      {(hasBins || hasPets || hasGaming) && (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200">
          <h3 className="font-semibold text-teal-800 flex items-center gap-2 mb-3">
            <Calendar size={18} /> Today's Summary
          </h3>
          <ul className="space-y-2 text-sm text-teal-700">
            {hasBins && details.bin_schedule!.collection_days.includes(todayDay) && (
              <li>Bin collection today! {getBinRotationChild() ? `${getChildName(getBinRotationChild()!)}'s turn` : ''}</li>
            )}
            {hasBins && !details.bin_schedule!.collection_days.includes(todayDay) && (
              <li>No bin collection today</li>
            )}
            {details.pets?.map(pet => {
              if (pet.walk_rotation_children?.length) {
                const child = getPetRotationChild(pet.walk_rotation_children);
                return <li key={pet.id}>{pet.name} walk: {child ? getChildName(child) : 'Not set'}</li>;
              }
              if (pet.litter_rotation_children?.length) {
                const child = getPetRotationChild(pet.litter_rotation_children);
                return <li key={pet.id}>{pet.name} litter: {child ? getChildName(child) : 'Not set'}</li>;
              }
              return null;
            })}
            {hasGaming && Object.entries(details.gaming_schedule!).map(([childId, config]) => {
              if (!isParent && childId !== user?.userId) return null;
              const todayRules = (config as any).rules?.filter((r: GamingRule) => r.days.includes(todayDay));
              if (!todayRules?.length) return <li key={childId}>{getChildName(childId)}: No gaming today</li>;
              return todayRules.map((r: GamingRule, i: number) => (
                <li key={`${childId}-${i}`}>{getChildName(childId)}: {r.device.toUpperCase()} — {r.hours}hr today</li>
              ));
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
