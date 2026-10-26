'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Building2,
  Home,
  Settings,
  Plus,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  Download,
  Mail,
  UserPlus,
  Layers,
  Calendar,
  Utensils,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { User, College, Hostel, Role } from '@unifest/shared';

interface AdminDashboardProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
}

export function AdminDashboard({ currentUser, onNavigateTab }: AdminDashboardProps) {
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'colleges' | 'hostels' | 'config'>('overview');

  // Stats & Config
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('MANAGER');
  const [newUserGender, setNewUserGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newUserCollegeId, setNewUserCollegeId] = useState('');

  // Colleges State
  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColCode, setNewColCode] = useState('');
  const [newColColor, setNewColColor] = useState('#2563EB');

  // Hostels State
  const [hostelsList, setHostelsList] = useState<any[]>([]);
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);
  const [newHostelName, setNewHostelName] = useState('');
  const [newHostelGender, setNewHostelGender] = useState<'MALE' | 'FEMALE'>('MALE');

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [roomHostelId, setRoomHostelId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomCapacity, setRoomCapacity] = useState('3');

  // Config State
  const [gracePeriod, setGracePeriod] = useState('15');
  const [cutoffHours, setCutoffHours] = useState('2');
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [confRes, usersRes, colRes, hosRes] = await Promise.all([
        fetch('/api/admin/config').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/colleges').then((r) => r.json()),
        fetch('/api/admin/hostels').then((r) => r.json()),
      ]);

      if (confRes.config) {
        setConfigData(confRes);
        setGracePeriod(String(confRes.config.mealGracePeriodMinutes || 15));
        setCutoffHours(String(confRes.config.registrationCutoffHours || 2));
      }
      if (Array.isArray(usersRes)) setUsersList(usersRes);
      if (Array.isArray(colRes)) setCollegesList(colRes);
      if (Array.isArray(hosRes)) setHostelsList(hosRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch {
      alert('Failed to update role');
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emailVerified: !currentStatus }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, emailVerified: !currentStatus } : u))
        );
      }
    } catch {
      alert('Failed to toggle verification');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          role: newUserRole,
          gender: newUserGender,
          collegeId: newUserRole === 'STUDENT' ? newUserCollegeId : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        loadAllAdminData();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newColName,
          code: newColCode,
          color: newColColor,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddCollegeModal(false);
        setNewColName('');
        setNewColCode('');
        loadAllAdminData();
      } else {
        alert(data.error || 'Failed to create college');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_HOSTEL',
          name: newHostelName,
          gender: newHostelGender,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddHostelModal(false);
        setNewHostelName('');
        loadAllAdminData();
      } else {
        alert(data.error || 'Failed to create hostel');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_ROOM',
          hostelId: roomHostelId,
          number: roomNumber,
          floor: roomFloor,
          capacity: roomCapacity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddRoomModal(false);
        setRoomNumber('');
        loadAllAdminData();
      } else {
        alert(data.error || 'Failed to create room');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealGracePeriodMinutes: parseInt(gracePeriod, 10),
          registrationCutoffHours: parseInt(cutoffHours, 10),
        }),
      });
      if (res.ok) {
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 2500);
      }
    } catch {
      alert('Failed to save config');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.college?.code && u.college.code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Admin Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Root System Administrator
              </span>
              <span className="text-xs text-indigo-300 font-medium">Full System Access Granted</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
              System Command Center
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl">
              Manage participating colleges, RBAC permissions, hostel floor plans, global safety rules, and immutable audit logs.
            </p>
          </div>

          {/* Quick Shortcuts to other modules */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('allocation-matrix')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/10"
            >
              <Layers className="w-3.5 h-3.5 text-blue-300" /> Hostel Matrix
            </button>
            <button
              onClick={() => onNavigateTab('event-manager')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/10"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-300" /> Event Manager
            </button>
            <button
              onClick={() => onNavigateTab('audit')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/10"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-300" /> Full Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Admin Sub-Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setAdminTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            adminTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Health & Stats
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            adminTab === 'users' ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Users & RBAC Roles ({usersList.length})
        </button>

        <button
          onClick={() => setAdminTab('colleges')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            adminTab === 'colleges' ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Institutions ({collegesList.length})
        </button>

        <button
          onClick={() => setAdminTab('hostels')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            adminTab === 'hostels' ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Home className="w-3.5 h-3.5" /> Hostels & Beds ({hostelsList.length})
        </button>

        <button
          onClick={() => setAdminTab('config')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            adminTab === 'config' ? 'bg-primary text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Global Parameters
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
      {adminTab === 'overview' && configData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Total User Accounts</span>
              <p className="font-heading font-extrabold text-2xl text-slate-900 mt-1">{configData.stats.usersCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all 4 security roles</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Institutions</span>
              <p className="font-heading font-extrabold text-2xl text-primary mt-1">{configData.stats.collegesCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Participating Universities</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Bed Inventory</span>
              <p className="font-heading font-extrabold text-2xl text-blue-600 mt-1">{configData.stats.bedsCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{configData.stats.roomsCount} rooms across {configData.stats.hostelsCount} hostels</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Audit Trail Depth</span>
              <p className="font-heading font-extrabold text-2xl text-emerald-600 mt-1">{configData.stats.auditLogsCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Immutable audited entries</p>
            </div>
          </div>

          {/* Hard Constraints Safety Checklist (BR-1 to BR-10) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-bold text-sm text-slate-900">System Safety Invariants Health</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                100% Guaranteed Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-800">BR-1: Strict Gender Segregation:</strong>
                  <p className="text-slate-500 text-[11px]">Male and female participants never share a room under any circumstance.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-800">BR-2: Single College Room Lock:</strong>
                  <p className="text-slate-500 text-[11px]">Rooms lock to the first occupant's institution; zero mixed colleges.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-800">BR-6: Minimal Identity-Only QR Tokens:</strong>
                  <p className="text-slate-500 text-[11px]">Tokens hold userId and version only. No room, meal, or PII exposed.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-800">BR-7 & BR-8: Meal Slot Idempotency:</strong>
                  <p className="text-slate-500 text-[11px]">Single redemption per meal slot, verified against (college, gender) window.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER & RBAC MANAGEMENT */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name, email, or college..."
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="MANAGER">Managers</option>
                <option value="SCANNER">Scanners</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Staff / User
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Role (RBAC)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      {user.college ? (
                        <span className="font-semibold text-slate-700">{user.college.code}</span>
                      ) : (
                        <span className="text-slate-400 italic">Festival Staff</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span>{user.gender === 'MALE' ? '♂ Male' : '♀ Female'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className={`text-[11px] font-bold p-1 rounded-lg border ${
                          user.role === 'ADMIN'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : user.role === 'MANAGER'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : user.role === 'SCANNER'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="SCANNER">SCANNER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleVerification(user.id, user.emailVerified)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          user.emailVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {user.id.slice(0, 10)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COLLEGES / INSTITUTIONS */}
      {adminTab === 'colleges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Colleges enrolled in UniFest 2026. Rooms and meal batches partition strictly by these institutions.
            </p>
            <button
              onClick={() => setShowAddCollegeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Register College
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collegesList.map((col) => (
              <div
                key={col.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: col.color || '#2563EB' }}
                />

                <div className="flex items-center justify-between">
                  <span
                    className="font-heading font-black text-sm px-2.5 py-1 rounded-lg text-white"
                    style={{ backgroundColor: col.color || '#2563EB' }}
                  >
                    {col.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {col.lockedRooms || 0} Locked Rooms
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 leading-snug">{col.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span>Total Students: <strong>{col.totalStudents || 0}</strong></span>
                    <span>♂ {col.maleStudents || 0} · ♀ {col.femaleStudents || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOSTELS & ROOMS INVENTORY */}
      {adminTab === 'hostels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Hostel facilities and room capacity. Gender is inherited strictly at the hostel level.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (hostelsList.length > 0) setRoomHostelId(hostelsList[0].id);
                  setShowAddRoomModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Room to Hostel
              </button>
              <button
                onClick={() => setShowAddHostelModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Hostel Facility
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {hostelsList.map((h) => (
              <div key={h.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 font-bold flex items-center justify-center text-sm">
                      {h.gender === 'MALE' ? '♂' : '♀'}
                    </span>
                    <div>
                      <h3 className="font-heading font-extrabold text-base text-slate-900">{h.name}</h3>
                      <p className="text-xs text-slate-400">Gender Policy: {h.gender === 'MALE' ? 'Boys Only' : 'Girls Only'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Total Capacity</span>
                      <p className="font-heading font-bold text-slate-800 text-sm">{h.totalCapacity} beds</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Occupied</span>
                      <p className="font-heading font-bold text-blue-600 text-sm">{h.totalOccupied} beds</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Free Beds</span>
                      <p className="font-heading font-bold text-emerald-600 text-sm">{h.vacantBeds} beds</p>
                    </div>
                  </div>
                </div>

                {/* Rooms Grid inside Hostel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {h.rooms?.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Room {r.number}</span>
                        <span className="text-[10px] text-slate-400">F{r.floor}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {r.occupiedCount}/{r.capacity} beds
                      </p>
                      {r.lockedCollege ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white inline-block" style={{ backgroundColor: r.lockedCollege.color }}>
                          {r.lockedCollege.code}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400">Unlocked</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GLOBAL CONFIGURATION */}
      {adminTab === 'config' && (
        <div className="max-w-2xl bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-heading font-bold text-sm text-slate-900">Festival Global Operational Settings</h3>
            {configSaved && (
              <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                ✓ Parameters Updated!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Meal Grace Period (Minutes)</label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                min="0"
                max="60"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Grace duration students are allowed to redeem meals before and after their official batch window.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Registration Cutoff (Hours Before Event)</label>
              <input
                type="number"
                value={cutoffHours}
                onChange={(e) => setCutoffHours(e.target.value)}
                min="0"
                max="24"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Cutoff window after which students can no longer withdraw or register for sports/folk events.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark transition-all"
              >
                Save Global Parameters
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD USER / STAFF */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Add Account / Staff</h3>
              <button type="button" onClick={() => setShowAddUserModal(false)} className="text-slate-400">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role (RBAC)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="SCANNER">SCANNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STUDENT">STUDENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={newUserGender}
                  onChange={(e) => setNewUserGender(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="MALE">Male (♂)</option>
                  <option value="FEMALE">Female (♀)</option>
                </select>
              </div>
            </div>

            {newUserRole === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College</label>
                <select
                  value={newUserCollegeId}
                  onChange={(e) => setNewUserCollegeId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  required
                >
                  <option value="">-- Select Institution --</option>
                  {collegesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD COLLEGE */}
      {showAddCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateCollege}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Register Participating College</h3>
              <button type="button" onClick={() => setShowAddCollegeModal(false)} className="text-slate-400">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name</label>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g., IIT Bombay"
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College Code</label>
                <input
                  type="text"
                  value={newColCode}
                  onChange={(e) => setNewColCode(e.target.value)}
                  placeholder="e.g., IITB"
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Color</label>
                <input
                  type="color"
                  value={newColColor}
                  onChange={(e) => setNewColColor(e.target.value)}
                  className="w-full h-8 p-1 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setShowAddCollegeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD HOSTEL */}
      {showAddHostelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateHostel}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Add Hostel Facility</h3>
              <button type="button" onClick={() => setShowAddHostelModal(false)} className="text-slate-400">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hostel Name</label>
              <input
                type="text"
                value={newHostelName}
                onChange={(e) => setNewHostelName(e.target.value)}
                placeholder="e.g., Tagore International Boys Hostel"
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender Designation (Strict)</label>
              <select
                value={newHostelGender}
                onChange={(e) => setNewHostelGender(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="MALE">Male (Boys Hostel)</option>
                <option value="FEMALE">Female (Girls Hostel)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setShowAddHostelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md"
              >
                Add Facility
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD ROOM */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateRoom}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">Add Room to Hostel</h3>
              <button type="button" onClick={() => setShowAddRoomModal(false)} className="text-slate-400">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Hostel</label>
              <select
                value={roomHostelId}
                onChange={(e) => setRoomHostelId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                required
              >
                {hostelsList.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} ({h.gender})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room No.</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 301"
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Floor</label>
                <input
                  type="number"
                  value={roomFloor}
                  onChange={(e) => setRoomFloor(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacity (Beds)</label>
                <input
                  type="number"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(e.target.value)}
                  min="1"
                  max="8"
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Beds will automatically be labeled Bed A, Bed B, etc. Gender is inherited from the hostel.
            </p>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md"
              >
                Add Room & Beds
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
