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
  Trash2,
  Activity,
  Check,
  Copy,
  Zap,
  Sliders,
  Server,
  KeyRound,
  ExternalLink,
  Sparkles,
  UserCheck,
  UserX,
  Phone,
  BarChart3,
  BadgeCheck,
  Clock,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { User, College, Hostel, Role, NORTH_INDIA_COLLEGES, NorthIndiaCollegeItem, Gender } from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';

const COLLEGE_REGIONS: Array<NorthIndiaCollegeItem['region']> = [
  'Punjab & Chandigarh',
  'Delhi NCR',
  'Haryana',
  'HP, Uttarakhand & J&K',
  'Uttar Pradesh',
  'Rajasthan',
  'Other',
];

interface AdminDashboardProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
}

export function AdminDashboard({ currentUser, onNavigateTab }: AdminDashboardProps) {
  const toast = useToast();
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'colleges' | 'hostels' | 'config'>('overview');

  // Stats & Config
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [userCollegeFilter, setUserCollegeFilter] = useState<string>('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('MANAGER');
  const [newUserGender, setNewUserGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newUserCollegeId, setNewUserCollegeId] = useState('');

  // Colleges State
  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);
  const [selectedDirectoryCollegeId, setSelectedDirectoryCollegeId] = useState('');
  const [newColName, setNewColName] = useState('');
  const [newColCode, setNewColCode] = useState('');
  const [newColColor, setNewColColor] = useState('#2563EB');

  // Hostels State
  const [hostelsList, setHostelsList] = useState<any[]>([]);
  const [hostelSearch, setHostelSearch] = useState('');
  const [hostelGenderFilter, setHostelGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);
  const [newHostelName, setNewHostelName] = useState('');
  const [newHostelGender, setNewHostelGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newHostelCollegeId, setNewHostelCollegeId] = useState('');
  const [newHostelCustomCollege, setNewHostelCustomCollege] = useState('');

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllAdminData();
    setIsRefreshing(false);
    toast.success('Live State Synchronized', 'Real-time database records and metrics updated.');
  };

  const handleCopyUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedUserId(id);
    toast.success('Copied to Clipboard', `User ID: ${id}`);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const handleDirectoryCollegeSelect = (selectedId: string) => {
    setSelectedDirectoryCollegeId(selectedId);
    if (!selectedId || selectedId === 'custom') {
      return;
    }
    const matched = NORTH_INDIA_COLLEGES.find((c) => c.id === selectedId);
    if (matched) {
      setNewColName(matched.name);
      const codeSuggestion = (matched.shortName.match(/\b([A-Z0-9]+)\b/g)?.join('') || matched.shortName.replace(/[^A-Za-z0-9]/g, ''))
        .slice(0, 8)
        .toUpperCase();
      setNewColCode(codeSuggestion || 'COL');
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
        toast.success('Role Updated', `User role changed to ${newRole}`);
      } else {
        toast.error('Update Failed', 'Failed to update user role');
      }
    } catch {
      toast.error('Network Error', 'Failed to update role');
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
        toast.success('Status Updated', `User marked as ${!currentStatus ? 'Verified' : 'Unverified'}`);
      } else {
        toast.error('Update Failed', 'Failed to toggle verification status');
      }
    } catch {
      toast.error('Network Error', 'Failed to toggle verification');
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
        toast.success('User Created', `User ${newUserName || ''} added successfully`);
        loadAllAdminData();
      } else {
        toast.error('Create User Failed', data.error || 'Failed to create user');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server');
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDirectoryCollegeId && selectedDirectoryCollegeId !== 'custom' ? selectedDirectoryCollegeId : undefined,
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
        setSelectedDirectoryCollegeId('');
        toast.success('College Created', `College ${newColName || ''} registered successfully`);
        loadAllAdminData();
      } else {
        toast.error('Create College Failed', data.error || 'Failed to create college');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server');
    }
  };

  const handleDeleteCollege = async (collegeId: string, collegeName: string) => {
    if (!confirm(`Are you sure you want to remove ${collegeName}? This will unlink related rooms and meal batches.`)) return;
    try {
      const res = await fetch(`/api/admin/colleges?id=${encodeURIComponent(collegeId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCollegesList((prev) => prev.filter((c) => c.id !== collegeId));
        toast.success('College Removed', `${collegeName} was deleted.`);
      } else {
        const err = await res.json();
        toast.error('Failed to remove college', err.error);
      }
    } catch {
      toast.error('Error', 'Failed to communicate with server.');
    }
  };

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalCollegeName = '';
      let finalCollegeId: string | null = null;

      if (newHostelCollegeId === 'custom') {
        finalCollegeName = newHostelCustomCollege.trim();
      } else if (newHostelCollegeId) {
        const regCol = collegesList.find((c) => c.id === newHostelCollegeId);
        if (regCol) {
          finalCollegeId = regCol.id;
          finalCollegeName = regCol.name;
        } else {
          const dirCol = NORTH_INDIA_COLLEGES.find((c) => c.id === newHostelCollegeId);
          if (dirCol) {
            finalCollegeId = dirCol.id;
            finalCollegeName = dirCol.name;
          }
        }
      }

      const res = await fetch('/api/admin/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_HOSTEL',
          name: newHostelName,
          gender: newHostelGender,
          collegeId: finalCollegeId,
          collegeName: finalCollegeName || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddHostelModal(false);
        setNewHostelName('');
        setNewHostelCollegeId('');
        setNewHostelCustomCollege('');
        toast.success('Hostel Created', `Hostel ${newHostelName || ''} registered successfully`);
        loadAllAdminData();
      } else {
        toast.error('Create Hostel Failed', data.error || 'Failed to create hostel');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server');
    }
  };

  const handleDeleteHostel = async (hostelId: string, hostelName: string) => {
    if (!confirm(`Are you sure you want to remove ${hostelName} and all its rooms & beds?`)) return;
    try {
      const res = await fetch(`/api/admin/hostels?hostelId=${encodeURIComponent(hostelId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHostelsList((prev) => prev.filter((h) => h.id !== hostelId));
        toast.success('Hostel Removed', `${hostelName} has been deleted.`);
      } else {
        const err = await res.json();
        toast.error('Failed to remove hostel', err.error);
      }
    } catch {
      toast.error('Error', 'Failed to communicate with server.');
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
        toast.success('Room Added', `Room ${roomNumber || ''} created with ${roomCapacity} beds.`);
        loadAllAdminData();
      } else {
        toast.error('Add Room Failed', data.error || 'Failed to create room');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server');
    }
  };

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    if (!confirm(`Delete Room ${roomNumber}? This will unallocate any beds in this room.`)) return;
    try {
      const res = await fetch(`/api/admin/hostels?roomId=${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHostelsList((prev) =>
          prev.map((h) => ({
            ...h,
            rooms: h.rooms?.filter((r: any) => r.id !== roomId),
          }))
        );
        toast.success('Room Deleted', `Room ${roomNumber} deleted.`);
      } else {
        const err = await res.json();
        toast.error('Failed to remove room', err.error);
      }
    } catch {
      toast.error('Error', 'Failed to communicate with server.');
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
        toast.success('Settings Saved', 'System configuration updated successfully');
        setTimeout(() => setConfigSaved(false), 2500);
      } else {
        toast.error('Save Failed', 'Failed to save configuration');
      }
    } catch {
      toast.error('Network Error', 'Failed to save config');
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('No Data', 'No users found matching current filters to export.');
      return;
    }
    const headers = ['User ID', 'Name', 'Email', 'Phone', 'College Code', 'College Name', 'Gender', 'Role', 'Verified'];
    const rows = filteredUsers.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || '').replace(/"/g, '""')}"`,
      `"${(u.college?.code || '').replace(/"/g, '""')}"`,
      `"${(u.collegeName || u.college?.name || '').replace(/"/g, '""')}"`,
      `"${u.gender || ''}"`,
      `"${u.role || ''}"`,
      `"${u.emailVerified ? 'VERIFIED' : 'UNVERIFIED'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unifest_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Generated', `Exported ${filteredUsers.length} records to CSV.`);
  };

  // Filtered queries
  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userStatusFilter === 'VERIFIED' && !u.emailVerified) return false;
    if (userStatusFilter === 'UNVERIFIED' && u.emailVerified) return false;
    if (userCollegeFilter !== 'ALL') {
      const uColId = u.collegeId || u.college?.id;
      const uColName = u.collegeName || u.college?.name;
      if (uColId !== userCollegeFilter && uColName !== userCollegeFilter) return false;
    }
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.collegeName && u.collegeName.toLowerCase().includes(q)) ||
        (u.college?.name && u.college.name.toLowerCase().includes(q)) ||
        (u.college?.code && u.college.code.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredColleges = collegesList.filter((col) => {
    if (!collegeSearch.trim()) return true;
    const q = collegeSearch.toLowerCase();
    return col.name.toLowerCase().includes(q) || col.code.toLowerCase().includes(q);
  });

  const filteredHostels = hostelsList.filter((h) => {
    if (hostelGenderFilter !== 'ALL' && h.gender !== hostelGenderFilter) return false;
    if (hostelSearch.trim()) {
      const q = hostelSearch.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        (h.collegeName && h.collegeName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Role pill counts
  const studentCount = usersList.filter((u) => u.role === 'STUDENT').length;
  const managerCount = usersList.filter((u) => u.role === 'MANAGER').length;
  const scannerCount = usersList.filter((u) => u.role === 'SCANNER').length;
  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length;

  // Fleet stats
  const totalFleetCapacity = hostelsList.reduce((acc, h) => acc + (h.totalCapacity || 0), 0);
  const totalFleetOccupied = hostelsList.reduce((acc, h) => acc + (h.totalOccupied || 0), 0);
  const totalFleetFree = totalFleetCapacity - totalFleetOccupied;
  const fleetOccupancyPct = totalFleetCapacity > 0 ? Math.round((totalFleetOccupied / totalFleetCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── 1. MODERN COMMAND CENTER HERO ── */}
      <div className="relative rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950 via-[#0B1120] to-[#1E1B4B]">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm backdrop-blur-md">
                <Shield className="w-3.5 h-3.5 text-rose-400" /> Root Authority
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Active
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Signed in as <strong className="text-slate-200">{currentUser.name}</strong>
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-tight">
              Administrator Control Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Full cryptographic authority over festival institutions, multi-campus student identity, gender-segregated bed grids, and audit immutability.
            </p>
          </div>

          {/* Header Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all shadow-sm backdrop-blur-md active:scale-95 disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('allocation-matrix')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 text-xs font-bold border border-blue-500/30 transition-all shadow-sm backdrop-blur-md active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Hostel Matrix</span>
            </button>

            <button
              onClick={() => onNavigateTab('event-manager')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 text-xs font-bold border border-amber-500/30 transition-all shadow-sm backdrop-blur-md active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Event Manager</span>
            </button>

            <button
              onClick={() => onNavigateTab('audit')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 text-xs font-bold border border-emerald-500/30 transition-all shadow-sm backdrop-blur-md active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SEGMENTED NAVIGATION TABS ── */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-500" />
          <span>Health & Stats</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'users'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Users & Roles</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${adminTab === 'users' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-100 text-slate-700'}`}>
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('colleges')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'colleges'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-500" />
          <span>Institutions</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${adminTab === 'colleges' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-100 text-slate-700'}`}>
            {collegesList.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('hostels')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'hostels'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Home className="w-4 h-4 text-emerald-500" />
          <span>Hostels & Beds</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${adminTab === 'hostels' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
            {hostelsList.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('config')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'config'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 text-amber-500" />
          <span>Global Settings</span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & SYSTEM HEALTH ── */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1: User Accounts */}
            <div 
              onClick={() => setAdminTab('users')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-0.5">
                  View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">User Directory</span>
              <p className="font-heading font-black text-3xl text-slate-900 mt-1">
                {configData?.stats?.usersCount ?? usersList.length}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                <span className="text-indigo-600">Students: {studentCount}</span>
                <span>·</span>
                <span className="text-amber-600">Staff: {managerCount + scannerCount}</span>
                <span>·</span>
                <span className="text-rose-600">Admins: {adminCount}</span>
              </div>
            </div>

            {/* Tile 2: Colleges */}
            <div 
              onClick={() => setAdminTab('colleges')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-0.5">
                  Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Participating Colleges</span>
              <p className="font-heading font-black text-3xl text-primary mt-1">
                {collegesList.length}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                <span>Multi-Campus Identity Partitioned</span>
              </div>
            </div>

            {/* Tile 3: Bed Inventory Fleet */}
            <div 
              onClick={() => setAdminTab('hostels')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {fleetOccupancyPct}% Occupied
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bed Inventory</span>
              <p className="font-heading font-black text-3xl text-slate-900 mt-1">
                {totalFleetCapacity} <span className="text-xs font-bold text-slate-400">Total Beds</span>
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                <span className="text-blue-600">Occupied: {totalFleetOccupied}</span>
                <span className="text-emerald-600">Vacant: {totalFleetFree}</span>
                <span>{hostelsList.length} Facilities</span>
              </div>
            </div>

            {/* Tile 4: Security Audit Ledger */}
            <div 
              onClick={() => onNavigateTab('audit')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-0.5">
                  Ledger <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Audit Trail Depth</span>
              <p className="font-heading font-black text-3xl text-rose-600 mt-1">
                {configData?.stats?.auditLogsCount ?? 0}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                <span className="text-emerald-600">✓ Immutable & Timestamped</span>
              </div>
            </div>
          </div>

          {/* Quick Control Launchpad */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">Administrator Launchpad</h3>
                <p className="text-xs text-slate-400 mt-0.5">Direct shortcuts to add entities and trigger automated operations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => setShowAddCollegeModal(true)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-primary hover:bg-slate-50/80 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900">Register College</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Add institution from profile directory or custom.</p>
              </button>

              <button
                onClick={() => setShowAddHostelModal(true)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-primary hover:bg-slate-50/80 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Home className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900">Add Hostel Facility</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Create facility with campus & gender designation.</p>
              </button>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-primary hover:bg-slate-50/80 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900">Add Staff Account</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Provision Manager, Scanner, or Admin privileges.</p>
              </button>

              <button
                onClick={() => onNavigateTab('allocation-matrix')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-primary hover:bg-slate-50/80 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900">Run Room Allocation</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Inspect allocation matrix and lock status.</p>
              </button>
            </div>
          </div>

          {/* Hard Constraints Safety Invariants */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-heading font-black text-sm text-slate-900">System Safety Invariants Health</h3>
                  <p className="text-xs text-slate-400">Database constraints strictly verified on every operation.</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                100% Operational
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 text-xs">BR-1: Strict Gender Segregation</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">Male and female participants never share a room under any circumstance. Inherited strictly at hostel level.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 text-xs">BR-2: Single College Room Lock</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">Rooms lock to the first occupant's institution; zero mixed colleges allowed in student rooms.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 text-xs">BR-6: Minimal Identity-Only QR Tokens</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">Tokens store userId & token version only. No room, meal or PII is exposed on printed or digital QR badges.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 text-xs">BR-7 & BR-8: Meal Slot Idempotency</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">Enforces single redemption per meal slot, verified strictly against the assigned college batch window.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: USER & RBAC MANAGEMENT ── */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          {/* Filters & Action Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, phone, or college..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                  title="Export filtered users to CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Staff / User
                </button>
              </div>
            </div>

            {/* Role & Verification Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
              <span className="text-[11px] text-slate-400 mr-1">Filter Role:</span>
              <button
                onClick={() => setUserRoleFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({usersList.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('STUDENT')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'STUDENT'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Students ({studentCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('MANAGER')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'MANAGER'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Managers ({managerCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('SCANNER')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'SCANNER'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Scanners ({scannerCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('ADMIN')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'ADMIN'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Admins ({adminCount})
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">College:</span>
              <select
                value={userCollegeFilter}
                onChange={(e) => setUserCollegeFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL">All Colleges ({collegesList.length})</option>
                {collegesList.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.code} - {col.name}
                  </option>
                ))}
              </select>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Verification:</span>
              <button
                onClick={() => setUserStatusFilter(userStatusFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  userStatusFilter === 'VERIFIED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ✓ Verified
              </button>
              <button
                onClick={() => setUserStatusFilter(userStatusFilter === 'UNVERIFIED' ? 'ALL' : 'UNVERIFIED')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  userStatusFilter === 'UNVERIFIED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ⚠ Unverified
              </button>
            </div>

            {/* Results Status Line */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-medium">
              <span>
                Showing <strong className="text-slate-700">{filteredUsers.length}</strong> of{' '}
                <strong className="text-slate-700">{usersList.length}</strong> registered accounts
              </span>
              {(userSearch || userRoleFilter !== 'ALL' || userStatusFilter !== 'ALL' || userCollegeFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setUserSearch('');
                    setUserRoleFilter('ALL');
                    setUserStatusFilter('ALL');
                    setUserCollegeFilter('ALL');
                  }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">College / Institution</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Role (RBAC)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Identifier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-heading font-bold text-sm text-slate-700">No matching users found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters.</p>
                        <button
                          onClick={() => {
                            setUserSearch('');
                            setUserRoleFilter('ALL');
                            setUserStatusFilter('ALL');
                            setUserCollegeFilter('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const initials = (user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-primary text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {initials}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{user.name}</p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{user.email}</span>
                                  {user.phone && (
                                    <>
                                      <span>·</span>
                                      <span className="font-mono">{user.phone}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {user.collegeName || user.college?.name ? (
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">
                                  {user.college?.code || 'INST'}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate max-w-[200px] block">
                                  {user.collegeName || user.college?.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 italic">
                                Campus Staff
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            <span>{user.gender === 'MALE' ? '♂ Male' : '♀ Female'}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                              className={`text-xs font-bold py-1 px-2.5 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                                user.role === 'ADMIN'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : user.role === 'MANAGER'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : user.role === 'SCANNER'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="SCANNER">SCANNER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleVerification(user.id, user.emailVerified)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                                user.emailVerified
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleCopyUserId(user.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Click to copy full user ID"
                            >
                              {copiedUserId === user.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{user.id.slice(0, 10)}...</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: COLLEGES / INSTITUTIONS ── */}
      {adminTab === 'colleges' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                placeholder="Search college by name or code..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
              {collegeSearch && (
                <button
                  onClick={() => setCollegeSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddCollegeModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all self-start sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Register College
            </button>
          </div>

          {filteredColleges.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 shadow-sm">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-heading font-black text-slate-800 text-base">
                {collegesList.length === 0 ? 'No Colleges Registered Yet' : 'No Colleges Match Your Search'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {collegesList.length === 0 
                  ? 'Enroll participating institutions to activate automated same-college room locks and meal schedules.'
                  : 'Try clearing your search query to see all participating institutions.'}
              </p>
              {collegesList.length === 0 ? (
                <button
                  onClick={() => setShowAddCollegeModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-dark transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Register College
                </button>
              ) : (
                <button
                  onClick={() => setCollegeSearch('')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                >
                  Reset Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredColleges.map((col) => {
                const totalStudents = col.totalStudents || 0;
                const maleStudents = col.maleStudents || 0;
                const femaleStudents = col.femaleStudents || 0;
                const malePct = totalStudents > 0 ? (maleStudents / totalStudents) * 100 : 50;

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
                  >
                    {/* Brand Top Stripe */}
                    <div
                      className="absolute top-0 left-0 right-0 h-2"
                      style={{ backgroundColor: col.color || '#2563EB' }}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className="font-heading font-black text-xs px-2.5 py-1 rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: col.color || '#2563EB' }}
                      >
                        {col.code}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" /> {col.lockedRooms || 0} Locked Rooms
                        </span>
                        <button
                          onClick={() => handleDeleteCollege(col.id, col.name)}
                          title="Delete College"
                          className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-heading font-black text-sm text-slate-900 leading-snug">{col.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {col.id}</p>
                    </div>

                    {/* Student Gender Bar & Quick Action */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>Students Enrolled: <strong>{totalStudents}</strong></span>
                        <span>♂ {maleStudents} · ♀ {femaleStudents}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${totalStudents > 0 ? malePct : 50}%` }}
                          title={`Male: ${maleStudents}`}
                        />
                        <div 
                          className="h-full bg-rose-500" 
                          style={{ width: `${totalStudents > 0 ? 100 - malePct : 50}%` }}
                          title={`Female: ${femaleStudents}`}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <button
                          onClick={() => {
                            setUserCollegeFilter(col.id);
                            setAdminTab('users');
                          }}
                          className="font-bold text-primary hover:text-primary-dark hover:underline flex items-center gap-1 transition-colors"
                        >
                          View Students ({totalStudents}) →
                        </button>
                        {hostelsList.filter((h) => h.collegeId === col.id || h.collegeName === col.name).length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Home className="w-2.5 h-2.5" />
                            {hostelsList.filter((h) => h.collegeId === col.id || h.collegeName === col.name).length} Facilities
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: HOSTELS & ROOMS INVENTORY ── */}
      {adminTab === 'hostels' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={hostelSearch}
                  onChange={(e) => setHostelSearch(e.target.value)}
                  placeholder="Search hostel by name or campus..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
                {hostelSearch && (
                  <button
                    onClick={() => setHostelSearch('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Gender Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setHostelGenderFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    hostelGenderFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setHostelGenderFilter('MALE')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    hostelGenderFilter === 'MALE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  ♂ Boys
                </button>
                <button
                  onClick={() => setHostelGenderFilter('FEMALE')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    hostelGenderFilter === 'FEMALE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  ♀ Girls
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={() => {
                  if (hostelsList.length > 0) setRoomHostelId(hostelsList[0].id);
                  setShowAddRoomModal(true);
                }}
                disabled={hostelsList.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Add Room
              </button>
              <button
                onClick={() => setShowAddHostelModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Facility
              </button>
            </div>
          </div>

          {filteredHostels.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 shadow-sm">
              <Home className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-heading font-black text-slate-800 text-base">
                {hostelsList.length === 0 ? 'No Hostels Configured Yet' : 'No Hostels Match Your Filter'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {hostelsList.length === 0
                  ? 'Set up accommodation buildings to configure floor plans, rooms, and automatic bed allocation.'
                  : 'Try resetting your search or gender filter.'}
              </p>
              {hostelsList.length === 0 ? (
                <button
                  onClick={() => setShowAddHostelModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-dark transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Hostel Facility
                </button>
              ) : (
                <button
                  onClick={() => {
                    setHostelSearch('');
                    setHostelGenderFilter('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHostels.map((h) => {
                const totalCap = h.totalCapacity || 0;
                const totalOcc = h.totalOccupied || 0;
                const freeBeds = totalCap - totalOcc;
                const occPct = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;

                return (
                  <div key={h.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-sm shadow-sm ${
                          h.gender === 'MALE' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {h.gender === 'MALE' ? '♂' : '♀'}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading font-black text-base text-slate-900">{h.name}</h3>
                            {h.collegeName ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" /> {h.collegeName}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Shared Campus
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Gender Rule: <strong className="text-slate-600">{h.gender === 'MALE' ? 'Boys Only' : 'Girls Only'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Capacity</span>
                          <p className="font-heading font-black text-slate-800 text-sm">{totalCap} beds</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Occupied</span>
                          <p className="font-heading font-black text-blue-600 text-sm">{totalOcc} beds</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Free Beds</span>
                          <p className="font-heading font-black text-emerald-600 text-sm">{freeBeds} beds</p>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => {
                              setRoomHostelId(h.id);
                              setShowAddRoomModal(true);
                            }}
                            title="Add Room to this Hostel"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-600 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHostel(h.id, h.name)}
                            title="Delete Hostel Facility"
                            className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Occupancy Rate Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>Facility Utilization</span>
                        <span className={occPct >= 90 ? 'text-rose-600' : occPct >= 70 ? 'text-amber-600' : 'text-emerald-600'}>
                          {occPct}% Full
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            occPct >= 90 ? 'bg-rose-500' : occPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${occPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Rooms Grid */}
                    {h.rooms && h.rooms.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
                        {h.rooms.map((r: any) => (
                          <div
                            key={r.id}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-xs space-y-1.5 relative group transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-black text-slate-800">Room {r.number}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600">
                                  F{r.floor}
                                </span>
                                <button
                                  onClick={() => handleDeleteRoom(r.id, r.number)}
                                  title="Delete Room"
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-opacity"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 font-semibold">
                              {r.occupiedCount || 0}/{r.capacity} beds
                            </p>

                            {/* Bed visual dots */}
                            <div className="flex items-center gap-1 py-0.5">
                              {Array.from({ length: r.capacity || 2 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < (r.occupiedCount || 0)
                                      ? 'bg-blue-600'
                                      : 'border border-slate-300 bg-white'
                                  }`}
                                  title={i < (r.occupiedCount || 0) ? 'Occupied' : 'Vacant'}
                                />
                              ))}
                            </div>

                            {r.lockedCollege ? (
                              <span 
                                className="text-[9px] font-black px-1.5 py-0.5 rounded text-white inline-block shadow-sm"
                                style={{ backgroundColor: r.lockedCollege.color || '#4F46E5' }}
                              >
                                {r.lockedCollege.code}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-semibold">Unlocked</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500">No rooms added to this hostel yet.</p>
                        <p className="text-[11px] text-slate-400">Add rooms to generate bed inventory and activate allocation.</p>
                        <button
                          onClick={() => {
                            setRoomHostelId(h.id);
                            setShowAddRoomModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add First Room
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: GLOBAL CONFIGURATION ── */}
      {adminTab === 'config' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">Festival Global Operational Parameters</h3>
                <p className="text-xs text-slate-400 mt-0.5">Parameters apply across all participating colleges, meal halls, and sports venues.</p>
              </div>
              {configSaved && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-in fade-in flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Parameters Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-slate-900 text-xs">
                    Meal Grace Period (Minutes)
                  </label>
                  <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-primary">
                    {gracePeriod} min
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  className="w-full accent-primary cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Time tolerance granted by scanners before and after a student's assigned college meal batch window.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-slate-900 text-xs">
                    Event Registration Cutoff Window (Hours Before Event)
                  </label>
                  <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-primary">
                    {cutoffHours} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={cutoffHours}
                  onChange={(e) => setCutoffHours(e.target.value)}
                  className="w-full accent-primary cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cutoff threshold after which participants can no longer register or withdraw from scheduled sports and folk competitions.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-white font-heading font-black text-xs rounded-2xl shadow-md hover:bg-primary-dark transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Global Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* MODAL 1: ADD USER / STAFF */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">Add Account / Staff Member</h3>
              <button 
                type="button" 
                onClick={() => setShowAddUserModal(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="e.g. manager@unifest.org"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role (RBAC) *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="SCANNER">SCANNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STUDENT">STUDENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                <select
                  value={newUserGender}
                  onChange={(e) => setNewUserGender(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="MALE">Male (♂)</option>
                  <option value="FEMALE">Female (♀)</option>
                </select>
              </div>
            </div>

            {newUserRole === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enrolled College *</label>
                <select
                  value={newUserCollegeId}
                  onChange={(e) => setNewUserCollegeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: REGISTER COLLEGE */}
      {showAddCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateCollege}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">Register Participating College</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddCollegeModal(false);
                  setSelectedDirectoryCollegeId('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Dropdown for colleges from User Profile Directory */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select from User Profile Colleges Directory
              </label>
              <select
                value={selectedDirectoryCollegeId}
                onChange={(e) => handleDirectoryCollegeSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              >
                <option value="">-- Choose from Directory or Enter Custom Below --</option>
                {COLLEGE_REGIONS.map((region) => {
                  const collegesInRegion = NORTH_INDIA_COLLEGES.filter((c) => c.region === region);
                  if (collegesInRegion.length === 0) return null;
                  return (
                    <optgroup key={region} label={region}>
                      {collegesInRegion.map((col) => {
                        const isAlreadyAdded = collegesList.some(
                          (c) => c.id === col.id || c.name.toLowerCase() === col.name.toLowerCase()
                        );
                        return (
                          <option key={col.id} value={col.id} disabled={isAlreadyAdded}>
                            {col.name} ({col.shortName}) {isAlreadyAdded ? '✓ Added' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  );
                })}
                <option value="custom">✍️ Custom College (Enter Manually Below)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecting a college automatically fills the name and code. You can also edit them directly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name *</label>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g., CGC University, Mohali"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College Code *</label>
                <input
                  type="text"
                  value={newColCode}
                  onChange={(e) => setNewColCode(e.target.value)}
                  placeholder="e.g., CGC-M"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs uppercase focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Color</label>
                <input
                  type="color"
                  value={newColColor}
                  onChange={(e) => setNewColColor(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowAddCollegeModal(false);
                  setSelectedDirectoryCollegeId('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
              >
                Register College
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ADD HOSTEL */}
      {showAddHostelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateHostel}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">Add Hostel Facility</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddHostelModal(false);
                  setNewHostelCollegeId('');
                  setNewHostelCustomCollege('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hostel Name *</label>
              <input
                type="text"
                value={newHostelName}
                onChange={(e) => setNewHostelName(e.target.value)}
                placeholder="e.g., Tagore International Boys Hostel"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            {/* College / University Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                College / University (Campus Designation)
              </label>
              <select
                value={newHostelCollegeId}
                onChange={(e) => setNewHostelCollegeId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              >
                <option value="">-- Central Campus / All Colleges (General) --</option>
                {collegesList.length > 0 && (
                  <optgroup label="Registered UniFest Colleges">
                    {collegesList.map((col) => (
                      <option key={col.id} value={col.id}>
                        ⭐ {col.name} ({col.code})
                      </option>
                    ))}
                  </optgroup>
                )}
                {COLLEGE_REGIONS.map((region) => {
                  const collegesInRegion = NORTH_INDIA_COLLEGES.filter((c) => c.region === region);
                  if (collegesInRegion.length === 0) return null;
                  return (
                    <optgroup key={region} label={`Directory: ${region}`}>
                      {collegesInRegion.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name} ({col.shortName})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                <option value="custom">✍️ Other / Custom College Name</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Designate if this hostel facility belongs to a specific institution or is general festival accommodation.
              </p>
            </div>

            {newHostelCollegeId === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom College / University Name *
                </label>
                <input
                  type="text"
                  value={newHostelCustomCollege}
                  onChange={(e) => setNewHostelCustomCollege(e.target.value)}
                  placeholder="e.g., CGC University, Mohali"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender Designation (Strict) *</label>
              <select
                value={newHostelGender}
                onChange={(e) => setNewHostelGender(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="MALE">Male (Boys Hostel)</option>
                <option value="FEMALE">Female (Girls Hostel)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowAddHostelModal(false);
                  setNewHostelCollegeId('');
                  setNewHostelCustomCollege('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
              >
                Add Facility
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: ADD ROOM */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateRoom}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">Add Room to Hostel</h3>
              <button 
                type="button" 
                onClick={() => setShowAddRoomModal(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Hostel Facility *</label>
              <select
                value={roomHostelId}
                onChange={(e) => setRoomHostelId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                required
              >
                {hostelsList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.gender === 'MALE' ? '♂ Boys' : '♀ Girls'}) {h.collegeName ? `· ${h.collegeName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room No. *</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Floor</label>
                <input
                  type="number"
                  value={roomFloor}
                  onChange={(e) => setRoomFloor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Beds *</label>
                <input
                  type="number"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(e.target.value)}
                  min="1"
                  max="8"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
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
