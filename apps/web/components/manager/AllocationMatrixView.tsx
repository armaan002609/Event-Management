'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  Users,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Move,
  X,
  Play,
  Check,
  Eye,
} from 'lucide-react';
import {
  AllocationMatrixHostel,
  AllocationRunResult,
  User,
} from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';

interface AllocationMatrixViewProps {
  currentUser: User;
}

export function AllocationMatrixView({ currentUser }: AllocationMatrixViewProps) {
  const toast = useToast();
  const [matrixData, setMatrixData] = useState<{
    matrix: AllocationMatrixHostel[];
    stats: {
      totalBeds: number;
      occupiedBeds: number;
      vacantBeds: number;
      unallocatedCount: number;
      shortfalls: Array<{ collegeCode: string; gender: string; count: number }>;
    };
    unallocatedStudents: Array<{
      id: string;
      name: string;
      gender: string;
      collegeCode: string;
      collegeName: string;
      collegeColor: string;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');

  // Auto-Allocation Modal State
  const [showAutoAllocModal, setShowAutoAllocModal] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<AllocationRunResult | null>(null);
  const [isRunningDryRun, setIsRunningDryRun] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Manual Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTargetBedId, setSelectedTargetBedId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [forceException, setForceException] = useState<boolean>(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/allocations/matrix');
      const data = await res.json();
      setMatrixData(data);
      if (data.matrix && data.matrix.length > 0 && !selectedHostelId) {
        setSelectedHostelId(data.matrix[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAutoAllocation = async () => {
    setShowAutoAllocModal(true);
    setIsRunningDryRun(true);
    setDryRunResult(null);
    try {
      const res = await fetch('/api/allocations/run?dryRun=true', { method: 'POST' });
      const data = await res.json();
      setDryRunResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningDryRun(false);
    }
  };

  const handleCommitAllocation = async () => {
    setIsCommitting(true);
    try {
      const res = await fetch('/api/allocations/run?dryRun=false', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setShowAutoAllocModal(false);
        toast.success('Allocation Committed', 'Room allocations have been finalized and committed.');
        loadMatrix();
      } else {
        toast.error('Commit Failed', data.error || 'Commit failed');
      }
    } catch {
      toast.error('Network Error', 'Network error while committing allocations');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleOpenOverride = (studentId?: string) => {
    setSelectedStudentId(studentId || '');
    setSelectedTargetBedId('');
    setOverrideReason('');
    setForceException(false);
    setOverrideError(null);
    setShowOverrideModal(true);
  };

  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedTargetBedId || !overrideReason.trim()) {
      setOverrideError('Please select a student, target bed, and enter an audit reason.');
      return;
    }

    setIsSubmittingOverride(true);
    setOverrideError(null);

    try {
      const res = await fetch('/api/allocations/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStudentId,
          targetBedId: selectedTargetBedId,
          reason: overrideReason,
          forceException,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOverrideError(data.error || 'Failed to move student.');
      } else {
        setShowOverrideModal(false);
        loadMatrix();
      }
    } catch (err: unknown) {
      setOverrideError((err as Error).message || 'Network error');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Find all vacant beds across hostels
  const vacantBedsList: Array<{
    bedId: string;
    bedLabel: string;
    roomNumber: string;
    roomGender: string;
    roomLockedCollegeCode: string | null;
    hostelName: string;
  }> = [];

  if (matrixData?.matrix) {
    matrixData.matrix.forEach((h) => {
      h.floors.forEach((f) => {
        f.rooms.forEach((r) => {
          r.beds.forEach((b) => {
            if (!b.allocation) {
              vacantBedsList.push({
                bedId: b.id,
                bedLabel: b.label,
                roomNumber: r.number,
                roomGender: r.gender,
                roomLockedCollegeCode: r.lockedCollegeCode,
                hostelName: h.name,
              });
            }
          });
        });
      });
    });
  }

  // Find all students (both allocated and unallocated) for the override picker
  const allMovableStudents: Array<{
    id: string;
    name: string;
    gender: string;
    collegeCode: string;
    currentLocation: string;
  }> = [];

  if (matrixData?.matrix) {
    matrixData.matrix.forEach((h) => {
      h.floors.forEach((f) => {
        f.rooms.forEach((r) => {
          r.beds.forEach((b) => {
            if (b.allocation) {
              allMovableStudents.push({
                id: b.allocation.userId,
                name: b.allocation.userName,
                gender: b.allocation.gender,
                collegeCode: b.allocation.collegeCode,
                currentLocation: `${h.name} · Room ${r.number} (${b.label})`,
              });
            }
          });
        });
      });
    });
  }

  if (matrixData?.unallocatedStudents) {
    matrixData.unallocatedStudents.forEach((u) => {
      allMovableStudents.push({
        id: u.id,
        name: u.name,
        gender: u.gender,
        collegeCode: u.collegeCode,
        currentLocation: 'Unallocated',
      });
    });
  }

  const activeHostel = matrixData?.matrix?.find((h) => h.id === selectedHostelId) || matrixData?.matrix?.[0];

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-2xl text-slate-900">Hostel Allocation Matrix</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-primary border border-primary/20">
              Deterministic Algorithm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict safety enforcement: Same Gender, Same College, Room Capacity Locked (BR-1 to BR-5).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenOverride()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold shadow-sm transition-all"
          >
            <Move className="w-3.5 h-3.5" /> Move Student
          </button>

          <button
            onClick={handleStartAutoAllocation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark text-xs font-bold shadow-md transition-all active:scale-95 shadow-primary/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Run Auto-Allocation
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      {matrixData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs transition-colors">
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Total Beds</span>
            <p className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">{matrixData.stats.totalBeds}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Occupied Beds</span>
            <p className="font-heading font-extrabold text-lg text-blue-600 dark:text-blue-400">{matrixData.stats.occupiedBeds}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Free Vacant Beds</span>
            <p className="font-heading font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{matrixData.stats.vacantBeds}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Unallocated Students</span>
            <p className={`font-heading font-extrabold text-lg ${matrixData.stats.unallocatedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {matrixData.stats.unallocatedCount}
            </p>
          </div>
        </div>
      )}

      {/* Shortfalls Warning Banner (if any) */}
      {matrixData?.stats.shortfalls && matrixData.stats.shortfalls.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
            <span className="font-bold">Capacity Shortfall Detected (Safety Rules Never Relaxed):</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {matrixData.stats.shortfalls.map((s, idx) => (
                <span key={idx} className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 font-semibold text-[11px] text-rose-800 dark:text-rose-300">
                  {s.collegeCode} ({s.gender === 'MALE' ? '♂' : '♀'}): {s.count} beds short
                </span>
              ))}
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">
              The engine safely leaves students unallocated instead of mixing genders or colleges.
            </p>
          </div>
        </div>
      )}

      {/* Hostel Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {matrixData?.matrix.map((hostel) => (
          <button
            key={hostel.id}
            onClick={() => setSelectedHostelId(hostel.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              selectedHostelId === hostel.id
                ? 'bg-slate-900 dark:bg-primary text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>{hostel.gender === 'MALE' ? '♂' : '♀'}</span>
            <span>{hostel.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">
              {hostel.gender}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid: Floors & Rooms */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Rendering allocation matrix...</p>
        </div>
      ) : activeHostel ? (
        <div className="space-y-6">
          {activeHostel.floors.map((floor) => (
            <div key={floor.floor} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="font-heading font-bold text-sm text-slate-800">
                  Floor {floor.floor} ({floor.rooms.length} Rooms)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {floor.rooms.map((room) => {
                  const occupiedCount = room.beds.filter((b) => b.allocation !== null).length;
                  const isFull = occupiedCount === room.capacity;

                  return (
                    <div
                      key={room.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      {/* Room Header */}
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                              Room {room.number}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                              ({occupiedCount}/{room.capacity})
                            </span>
                          </div>

                          {/* College Lock Badge */}
                          {room.isLocked ? (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-white shadow-xs"
                              style={{ backgroundColor: room.lockedCollegeColor || '#3B3FD9' }}
                            >
                              <Lock className="w-2.5 h-2.5" /> {room.lockedCollegeCode}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5" /> Empty
                            </span>
                          )}
                        </div>

                        {/* Beds Container */}
                        <div className="space-y-2 mt-2">
                          {room.beds.map((bed) => {
                            const alloc = bed.allocation;
                            return (
                              <div
                                key={bed.id}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                                  alloc
                                    ? 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'
                                    : 'bg-emerald-50/40 dark:bg-emerald-950/30 border-dashed border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                    {bed.label}
                                  </span>

                                  {alloc ? (
                                    <div className="truncate">
                                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                                        {alloc.userName}
                                      </span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white inline-block" style={{ backgroundColor: alloc.collegeColor }}>
                                        {alloc.collegeCode}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      Vacant Bed
                                    </span>
                                  )}
                                </div>

                                {/* Right status / move action */}
                                {alloc ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    {alloc.checkedIn && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Checked In" />
                                    )}
                                    <button
                                      onClick={() => handleOpenOverride(alloc.userId)}
                                      title="Move this student"
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
                                    >
                                      <Move className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-emerald-500 font-bold">FREE</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                        <span>Gender: {room.gender === 'MALE' ? '♂ Male' : '♀ Female'}</span>
                        <span>{isFull ? 'Full' : `${room.capacity - occupiedCount} free`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Auto-Allocation Dry-Run / Commit Modal */}
      {showAutoAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-extrabold text-lg text-slate-900">
                  Deterministic Auto-Allocation
                </h3>
              </div>
              <button
                onClick={() => setShowAutoAllocModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-500">
                The algorithm packs students by descending group size into matching rooms, prioritizing partially filled rooms before empty ones. Hard constraints (BR-1 to BR-5) are guaranteed.
              </p>

              {isRunningDryRun ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Running dry-run simulation...</p>
                </div>
              ) : dryRunResult ? (
                <div className="space-y-4">
                  {/* Results Summary Box */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl text-xs">
                    <div>
                      <span className="text-slate-400">Total Unallocated</span>
                      <p className="font-heading font-bold text-slate-900 text-base">{dryRunResult.totalUnallocatedInitial}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Can Be Allocated</span>
                      <p className="font-heading font-bold text-emerald-600 text-base">{dryRunResult.allocatedCount}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Shortfall Remainder</span>
                      <p className="font-heading font-bold text-rose-600 text-base">{dryRunResult.unallocatedCount}</p>
                    </div>
                  </div>

                  {/* Shortfalls Alert */}
                  {dryRunResult.shortfalls.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900">
                      <span className="font-bold block mb-1">Capacity Shortfall Detected:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {dryRunResult.shortfalls.map((s, i) => (
                          <li key={i}>
                            <strong>{s.collegeCode} ({s.gender}):</strong> {s.shortfall} students cannot be placed without violating safety constraints.
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Proposed Allocations Table */}
                  <div>
                    <h4 className="font-heading font-bold text-xs text-slate-800 mb-2">
                      Proposed Bed Placements ({dryRunResult.allocations.length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                          <tr>
                            <th className="py-2 px-3">Student</th>
                            <th className="py-2 px-3">College</th>
                            <th className="py-2 px-3">Gender</th>
                            <th className="py-2 px-3">Hostel</th>
                            <th className="py-2 px-3">Room & Bed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dryRunResult.allocations.map((a, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-800">{a.userName}</td>
                              <td className="py-2 px-3">{a.collegeCode}</td>
                              <td className="py-2 px-3">{a.gender === 'MALE' ? '♂ M' : '♀ F'}</td>
                              <td className="py-2 px-3 text-slate-500">{a.hostelName}</td>
                              <td className="py-2 px-3 font-bold text-primary">
                                Room {a.roomNumber} ({a.bedLabel})
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setShowAutoAllocModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleCommitAllocation}
                disabled={isCommitting || !dryRunResult || dryRunResult.allocations.length === 0}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCommitting ? 'Committing...' : 'Commit & Notify Students'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Override / Move Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitOverride}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Move className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Override Student Bed Allocation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message Alert */}
            {overrideError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                {overrideError}
              </div>
            )}

            {/* Student Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Choose Student --</option>
                {allMovableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.collegeCode} · {s.gender}) — {s.currentLocation}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Bed Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Vacant Bed</label>
              <select
                value={selectedTargetBedId}
                onChange={(e) => setSelectedTargetBedId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Choose Vacant Bed --</option>
                {vacantBedsList.map((b) => (
                  <option key={b.bedId} value={b.bedId}>
                    {b.hostelName} · Room {b.roomNumber} ({b.bedLabel}) · {b.roomGender}
                    {b.roomLockedCollegeCode ? ` · Locked: ${b.roomLockedCollegeCode}` : ' · Empty Room'}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Force Exception (Only visible if admin) */}
            {currentUser.role === 'ADMIN' && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="forceException"
                  checked={forceException}
                  onChange={(e) => setForceException(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="forceException" className="text-xs text-amber-900 leading-tight">
                  <span className="font-bold">Admin Force Exception:</span> Bypass safety rules (gender/college lock) with an audited justification.
                </label>
              </div>
            )}

            {/* Mandatory Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Reason (Audited under BR-10)
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                placeholder="e.g., Medical necessity, warden special request, team captain relocation..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingOverride}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {isSubmittingOverride ? 'Validating & Moving...' : 'Apply Move'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
