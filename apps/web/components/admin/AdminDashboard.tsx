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
  Upload,
  FileSpreadsheet,
  Eye,
  Info,
  LogOut,
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

  // Bulk Student Allotment Modal State
  const [showBulkAllotModal, setShowBulkAllotModal] = useState(false);
  const [uploadedStudentsPreview, setUploadedStudentsPreview] = useState<any[]>([]);
  const [isBulkAllotting, setIsBulkAllotting] = useState(false);
  const [bulkAllotResult, setBulkAllotResult] = useState<any>(null);

  // Room Occupants Modal State
  const [showRoomDetailsModal, setShowRoomDetailsModal] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<any>(null);
  const [selectedRoomHostel, setSelectedRoomHostel] = useState<any>(null);

  // Hostel Roster Modal State
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [selectedRosterHostelId, setSelectedRosterHostelId] = useState<string>('ALL');
  const [rosterSearch, setRosterSearch] = useState('');

  // Event Registrations Roster State
  const [eventRegistrationsData, setEventRegistrationsData] = useState<any>(null);
  const [showEventRosterModal, setShowEventRosterModal] = useState(false);
  const [selectedEventIdForRoster, setSelectedEventIdForRoster] = useState<string>('ALL');
  const [eventRosterSearch, setEventRosterSearch] = useState('');
  const [eventToDeleteAdmin, setEventToDeleteAdmin] = useState<{ id: string; title: string; count?: number } | null>(null);
  const [isDeletingEventAdmin, setIsDeletingEventAdmin] = useState(false);

  useEffect(() => {
    loadAllAdminData();

    const refreshRegistrations = () => {
      fetch('/api/admin/events/registrations')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.events) setEventRegistrationsData(data);
        })
        .catch(() => {});
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unifest:event-registered', refreshRegistrations);
      window.addEventListener('unifest:event-unregistered', refreshRegistrations);
    }

    // Live polling every 5s so registrations reflect immediately on admin dashboard
    const poll = setInterval(refreshRegistrations, 5000);

    return () => {
      clearInterval(poll);
      if (typeof window !== 'undefined') {
        window.removeEventListener('unifest:event-registered', refreshRegistrations);
        window.removeEventListener('unifest:event-unregistered', refreshRegistrations);
      }
    };
  }, []);

  const loadAllAdminData = async () => {
    try {
      const [confRes, usersRes, colRes, hosRes, evRegRes] = await Promise.all([
        fetch('/api/admin/config').then((r) => r.json()).catch(() => ({})),
        fetch('/api/admin/users').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/colleges').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/hostels').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/events/registrations').then((r) => r.json()).catch(() => null),
      ]);

      if (confRes?.config) {
        setConfigData(confRes);
        setGracePeriod(String(confRes.config.mealGracePeriodMinutes || 15));
        setCutoffHours(String(confRes.config.registrationCutoffHours || 2));
      }
      if (Array.isArray(usersRes)) setUsersList(usersRes);
      if (Array.isArray(colRes)) setCollegesList(colRes);
      if (Array.isArray(hosRes)) setHostelsList(hosRes);
      if (evRegRes?.events) setEventRegistrationsData(evRegRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportEventRosterCSV = () => {
    if (!eventRegistrationsData?.events) return;
    const eventsToExport = selectedEventIdForRoster === 'ALL'
      ? eventRegistrationsData.events
      : eventRegistrationsData.events.filter((e: any) => e.id === selectedEventIdForRoster);

    const headers = ['Event ID', 'Event Title', 'Type', 'Student Name', 'College', 'Roll Number', 'Gender', 'Email', 'Phone', 'Registered At', 'Status'];
    const rows: string[][] = [];
    for (const ev of eventsToExport) {
      for (const p of (ev.participants || [])) {
        rows.push([
          `"${ev.id}"`,
          `"${ev.title}"`,
          `"${ev.type}"`,
          `"${p.name || ''}"`,
          `"${p.college?.name || p.college?.code || 'N/A'}"`,
          `"${p.rollNo || ''}"`,
          `"${p.gender || ''}"`,
          `"${p.email || ''}"`,
          `"${p.phone || ''}"`,
          `"${new Date(p.registeredAt).toLocaleString()}"`,
          `"${p.status || 'CONFIRMED'}"`,
        ]);
      }
    }
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Event_Registrations_Roster_${selectedEventIdForRoster}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Roster Exported', 'Event attendees CSV spreadsheet exported successfully.');
  };

  const handleDeleteEventAdmin = (eventId: string) => {
    const targetEvent = eventRegistrationsData?.events?.find((e: any) => e.id === eventId);
    setEventToDeleteAdmin({
      id: eventId,
      title: targetEvent?.title || eventId,
      count: targetEvent?.participants?.length || 0,
    });
  };

  const executeDeleteEventAdmin = async (eventId: string) => {
    setIsDeletingEventAdmin(true);
    const targetEvent = eventRegistrationsData?.events?.find((e: any) => e.id === eventId);
    const eventName = targetEvent?.title || eventId;
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Event Deleted', `"${eventName}" was permanently deleted.`);
        setSelectedEventIdForRoster('ALL');
        setEventToDeleteAdmin(null);
        const evRegRes = await fetch('/api/admin/events/registrations').then((r) => r.json()).catch(() => null);
        if (evRegRes?.events) setEventRegistrationsData(evRegRes);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unifest:event-unregistered'));
          window.dispatchEvent(new CustomEvent('unifest:event-deleted', { detail: { eventId } }));
        }
      } else {
        toast.error('Deletion Failed', data.error || 'Failed to delete event');
      }
    } catch {
      toast.error('Network Error', 'Failed to delete event');
    } finally {
      setIsDeletingEventAdmin(false);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!data || data.length < 2) {
          toast.error('Empty File', 'Uploaded file has no data rows.');
          return;
        }

        // Header mapping for the 11-column template:
        // Student Roll No, Name, Gender, Age, College/University, City, State/UT, Course, Year, Activity Category, Specific Activity
        const headers = (data[0] as string[]).map((h) => String(h || '').trim().toLowerCase());
        const rollNoIdx = headers.findIndex((h) => h.includes('roll') || h.includes('reg') || h.includes('enroll') || h.includes('student roll'));
        const nameIdx = headers.findIndex((h) => h === 'name' || h === 'student name' || (h.includes('name') && !h.includes('college') && !h.includes('univ')));
        const genderIdx = headers.findIndex((h) => h.includes('gender') || h.includes('sex'));
        const ageIdx = headers.findIndex((h) => h === 'age' || h.includes('age'));
        const collegeIdx = headers.findIndex((h) => h.includes('college') || h.includes('univ') || h.includes('inst'));
        const cityIdx = headers.findIndex((h) => h.includes('city') || h.includes('district'));
        const stateIdx = headers.findIndex((h) => h.includes('state') || h.includes('ut'));
        const courseIdx = headers.findIndex((h) => h.includes('course') || h.includes('degree') || h.includes('branch'));
        const yearIdx = headers.findIndex((h) => h === 'year' || (h.includes('year') && !h.includes('passing')) || h.includes('sem'));
        const categoryIdx = headers.findIndex((h) => h.includes('activity category') || h.includes('category'));
        const activityIdx = headers.findIndex((h) => h.includes('specific activity') || (h.includes('activity') && !h.includes('category')) || h.includes('event'));
        const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
        const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('contact'));

        if (nameIdx === -1 || genderIdx === -1 || collegeIdx === -1) {
          toast.error(
            'Missing Required Headers',
            'File must contain: Student Roll No, Name, Gender, Age, College/University, City, State/UT, Course, Year, Activity Category, Specific Activity.'
          );
          return;
        }

        const parsed: any[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          const name = String(row[nameIdx] || '').trim();
          const gender = String(row[genderIdx] || '').trim();
          const collegeName = String(row[collegeIdx] || '').trim();
          if (!name || !gender || !collegeName) continue;

          parsed.push({
            rollNo: rollNoIdx !== -1 ? String(row[rollNoIdx] || '').trim() : undefined,
            name,
            gender,
            age: ageIdx !== -1 ? String(row[ageIdx] || '').trim() : undefined,
            collegeName,
            city: cityIdx !== -1 ? String(row[cityIdx] || '').trim() : undefined,
            state: stateIdx !== -1 ? String(row[stateIdx] || '').trim() : undefined,
            course: courseIdx !== -1 ? String(row[courseIdx] || '').trim() : undefined,
            year: yearIdx !== -1 ? String(row[yearIdx] || '').trim() : undefined,
            activityCategory: categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() : undefined,
            specificActivity: activityIdx !== -1 ? String(row[activityIdx] || '').trim() : undefined,
            email: emailIdx !== -1 ? String(row[emailIdx] || '').trim() : undefined,
            phone: phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : undefined,
          });
        }

        if (parsed.length === 0) {
          toast.error('No Records Found', 'No valid student rows found in file.');
          return;
        }

        setUploadedStudentsPreview(parsed);
        setBulkAllotResult(null);
        toast.success('File Loaded', `Parsed ${parsed.length} student records with academic and activity data.`);
      } catch (err: any) {
        toast.error('File Error', err.message || 'Could not parse spreadsheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Student Roll No,Name,Gender,Age,College/University,City,State/UT,Course,Year,Activity Category,Specific Activity',
        'ROLL-001,Full Name,Male,20,College or University Name,City,State,B.Tech CSE,1st Year,Sports,100m Sprint Men',
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'unifest_students_room_allotment_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template Downloaded', 'Use this 11-column template to prepare your student records.');
  };

  const handleExecuteBulkAllotment = async () => {
    if (uploadedStudentsPreview.length === 0) return;
    setIsBulkAllotting(true);
    try {
      const res = await fetch('/api/admin/hostels/bulk-allot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: uploadedStudentsPreview }),
      });
      const result = await res.json();
      if (res.ok) {
        setBulkAllotResult(result);
        toast.success(
          'Allotment Finished',
          `Allotted ${result.allottedCount} students! Same-college room condition strictly preserved.`
        );
        loadAllAdminData();
      } else {
        toast.error('Allotment Failed', result.error || 'Failed to allot rooms.');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server.');
    } finally {
      setIsBulkAllotting(false);
    }
  };

  const handleUnassignBed = async (allocationId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unassign ${studentName} from this bed?`)) return;
    try {
      const res = await fetch(`/api/admin/hostels?allocationId=${encodeURIComponent(allocationId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Bed Unassigned', `${studentName} was removed from this room.`);
        if (selectedRoomDetails) {
          setSelectedRoomDetails((prev: any) => ({
            ...prev,
            occupiedCount: Math.max(0, (prev.occupiedCount || 1) - 1),
            occupants: prev.occupants?.filter((o: any) => o.allocationId !== allocationId) || [],
          }));
        }
        loadAllAdminData();
      } else {
        const err = await res.json();
        toast.error('Failed to unassign', err.error);
      }
    } catch {
      toast.error('Error', 'Failed to reach server.');
    }
  };

  const handleCheckoutAllFleet = async () => {
    if (totalFleetOccupied === 0) {
      toast.error('No Occupants', 'All hostel rooms are already vacant.');
      return;
    }
    if (
      !confirm(
        `Are you sure you want to checkout ALL ${totalFleetOccupied} students from all rooms across all hostels?\n\nThis will clear all bed allocations and unlock all rooms for new assignments.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/admin/hostels?action=checkout-all', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('All Rooms Checked Out', data.message || 'All hostel rooms are now vacant and unlocked.');
        if (selectedRoomDetails) {
          setSelectedRoomDetails(null);
          setShowRoomDetailsModal(false);
        }
        loadAllAdminData();
      } else {
        toast.error('Checkout Failed', data.error || 'Failed to checkout rooms.');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server.');
    }
  };

  const handleCheckoutHostel = async (hostelId: string, hostelName: string, occupiedCount: number) => {
    if (occupiedCount === 0) {
      toast.error('No Occupants', `${hostelName} is already completely vacant.`);
      return;
    }
    if (
      !confirm(
        `Are you sure you want to checkout all ${occupiedCount} occupants from ${hostelName}?\n\nAll rooms in this facility will be vacated and unlocked.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/hostels?action=checkout-hostel&hostelId=${encodeURIComponent(hostelId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Facility Checked Out', `All rooms in ${hostelName} are now vacant and unlocked.`);
        if (selectedRoomDetails && selectedRoomHostel?.id === hostelId) {
          setSelectedRoomDetails(null);
          setShowRoomDetailsModal(false);
        }
        loadAllAdminData();
      } else {
        toast.error('Checkout Failed', data.error || 'Failed to checkout hostel.');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server.');
    }
  };

  const handleCheckoutRoom = async (roomId: string, roomNumber: string) => {
    if (
      !confirm(
        `Are you sure you want to checkout all students from Room ${roomNumber}?\n\nThis room will be completely vacated and unlocked.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/hostels?action=checkout-room&roomId=${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Room Checked Out', `Room ${roomNumber} has been vacated and unlocked.`);
        if (selectedRoomDetails) {
          setSelectedRoomDetails((prev: any) => ({
            ...prev,
            occupiedCount: 0,
            occupants: [],
            lockedCollegeId: null,
            lockedCollege: null,
          }));
        }
        loadAllAdminData();
      } else {
        toast.error('Checkout Failed', data.error || 'Failed to checkout room.');
      }
    } catch {
      toast.error('Network Error', 'Failed to reach server.');
    }
  };

  const handleDownloadAllotmentReport = () => {
    if (!bulkAllotResult?.allocations || bulkAllotResult.allocations.length === 0) {
      toast.error('No Report', 'No allocations data available to download.');
      return;
    }
    const headers = [
      'Student Roll No',
      'Name',
      'Gender',
      'Age',
      'College/University',
      'City',
      'State/UT',
      'Course',
      'Year',
      'Activity Category',
      'Specific Activity',
      'Hostel Facility',
      'Room Number',
      'Bed',
    ];
    const rows = bulkAllotResult.allocations.map((a: any) => [
      `"${(a.rollNo || '').replace(/"/g, '""')}"`,
      `"${(a.userName || '').replace(/"/g, '""')}"`,
      `"${a.gender || ''}"`,
      `"${a.age || ''}"`,
      `"${(a.collegeName || '').replace(/"/g, '""')}"`,
      `"${(a.city || '').replace(/"/g, '""')}"`,
      `"${(a.state || '').replace(/"/g, '""')}"`,
      `"${(a.course || '').replace(/"/g, '""')}"`,
      `"${(a.year || '').replace(/"/g, '""')}"`,
      `"${(a.activityCategory || '').replace(/"/g, '""')}"`,
      `"${(a.specificActivity || '').replace(/"/g, '""')}"`,
      `"${(a.hostelName || '').replace(/"/g, '""')}"`,
      `"${a.roomNumber || ''}"`,
      `"${a.bedLabel || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unifest_room_allotments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report Exported', 'Room allotments report downloaded as CSV.');
  };

  const handleExportHostelRoster = (hostelId: string, hostelName: string) => {
    const targetHostel = hostelsList.find((h) => h.id === hostelId);
    const allOccupants: any[] = [];
    if (targetHostel?.rooms) {
      targetHostel.rooms.forEach((r: any) => {
        (r.occupants || []).forEach((occ: any) => {
          allOccupants.push({
            ...occ,
            roomNumber: r.number,
            floor: r.floor,
            hostelName: targetHostel.name,
          });
        });
      });
    }

    if (allOccupants.length === 0) {
      toast.error('Empty Roster', `No students currently allotted to ${hostelName}.`);
      return;
    }

    const headers = [
      'Hostel',
      'Room No',
      'Floor',
      'Bed',
      'Student Roll No',
      'Student Name',
      'Gender',
      'Age',
      'College',
      'City',
      'State/UT',
      'Course',
      'Year',
      'Activity Category',
      'Specific Activity',
      'Email',
      'Phone',
    ];
    const rows = allOccupants.map((o: any) => [
      `"${(o.hostelName || '').replace(/"/g, '""')}"`,
      `"${o.roomNumber || ''}"`,
      `"${o.floor || ''}"`,
      `"${o.bedLabel || ''}"`,
      `"${(o.rollNo || '').replace(/"/g, '""')}"`,
      `"${(o.userName || '').replace(/"/g, '""')}"`,
      `"${o.userGender || ''}"`,
      `"${o.age || ''}"`,
      `"${(o.collegeName || '').replace(/"/g, '""')}"`,
      `"${(o.city || '').replace(/"/g, '""')}"`,
      `"${(o.state || '').replace(/"/g, '""')}"`,
      `"${(o.course || '').replace(/"/g, '""')}"`,
      `"${(o.year || '').replace(/"/g, '""')}"`,
      `"${(o.activityCategory || '').replace(/"/g, '""')}"`,
      `"${(o.specificActivity || '').replace(/"/g, '""')}"`,
      `"${(o.userEmail || '').replace(/"/g, '""')}"`,
      `"${(o.userPhone || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${hostelName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_occupants_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Roster Downloaded', `Exported ${allOccupants.length} occupants for ${hostelName}.`);
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
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs font-bold transition-colors">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'overview'
              ? 'bg-slate-900 dark:bg-primary text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-500" />
          <span>Health & Stats</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'users'
              ? 'bg-slate-900 dark:bg-primary text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Users & Roles</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${adminTab === 'users' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('colleges')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'colleges'
              ? 'bg-slate-900 dark:bg-primary text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-500" />
          <span>Institutions</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${adminTab === 'colleges' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {collegesList.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('hostels')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'hostels'
              ? 'bg-slate-900 dark:bg-primary text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Home className="w-4 h-4 text-emerald-500" />
          <span>Hostels & Beds</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${adminTab === 'hostels' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            {hostelsList.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('config')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'config'
              ? 'bg-slate-900 dark:bg-primary text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Tile 1: User Accounts */}
            <div 
              onClick={() => setAdminTab('users')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-0.5">
                  View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">User Directory</span>
              <p className="font-heading font-black text-3xl text-slate-900 dark:text-white mt-1">
                {configData?.stats?.usersCount ?? usersList.length}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span className="text-indigo-600 dark:text-indigo-400">Students: {studentCount}</span>
                <span>·</span>
                <span className="text-amber-600 dark:text-amber-400">Staff: {managerCount + scannerCount}</span>
                <span>·</span>
                <span className="text-rose-600 dark:text-rose-400">Admins: {adminCount}</span>
              </div>
            </div>

            {/* Tile 2: Colleges */}
            <div 
              onClick={() => setAdminTab('colleges')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-0.5">
                  Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Participating Colleges</span>
              <p className="font-heading font-black text-3xl text-primary dark:text-primary-400 mt-1">
                {collegesList.length}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span>Multi-Campus Identity Partitioned</span>
              </div>
            </div>

            {/* Tile 3: Bed Inventory Fleet */}
            <div 
              onClick={() => setAdminTab('hostels')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {fleetOccupancyPct}% Occupied
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bed Inventory</span>
              <p className="font-heading font-black text-3xl text-slate-900 dark:text-white mt-1">
                {totalFleetCapacity} <span className="text-xs font-bold text-slate-400">Total Beds</span>
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span className="text-blue-600 dark:text-blue-400">Occupied: {totalFleetOccupied}</span>
                <span className="text-emerald-600 dark:text-emerald-400">Vacant: {totalFleetFree}</span>
                <span>{hostelsList.length} Facilities</span>
              </div>
            </div>

            {/* Tile 4: Event Registrations */}
            <div 
              onClick={() => {
                setSelectedEventIdForRoster('ALL');
                setEventRosterSearch('');
                setShowEventRosterModal(true);
              }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline flex items-center gap-0.5">
                  Roster <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event Registrations</span>
              <p className="font-heading font-black text-3xl text-purple-600 dark:text-purple-400 mt-1">
                {eventRegistrationsData?.stats?.totalRegistrations ?? 0}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span className="text-purple-600 dark:text-purple-400">{eventRegistrationsData?.stats?.uniqueStudentsCount ?? 0} Students</span>
                <span>·</span>
                <span>{eventRegistrationsData?.stats?.totalEvents ?? 0} Events</span>
              </div>
            </div>

            {/* Tile 5: Security Audit Ledger */}
            <div 
              onClick={() => onNavigateTab('audit')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-0.5">
                  Ledger <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Audit Trail Depth</span>
              <p className="font-heading font-black text-3xl text-rose-600 dark:text-rose-400 mt-1">
                {configData?.stats?.auditLogsCount ?? 0}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">✓ Immutable & Timestamped</span>
              </div>
            </div>
          </div>

          {/* Quick Control Launchpad */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">Administrator Launchpad</h3>
                <p className="text-xs text-slate-400 mt-0.5">Direct shortcuts to add entities and trigger automated operations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <button
                onClick={() => setShowAddCollegeModal(true)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">Register College</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Add institution from profile directory or custom.</p>
              </button>

              <button
                onClick={() => setShowAddHostelModal(true)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Home className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">Add Hostel Facility</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Create facility with campus & gender designation.</p>
              </button>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">Add Staff Account</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Provision Manager, Scanner, or Admin privileges.</p>
              </button>

              <button
                onClick={() => {
                  setSelectedEventIdForRoster('ALL');
                  setEventRosterSearch('');
                  setShowEventRosterModal(true);
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">Event Attendees Roster</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Inspect student registrations per competition & export CSV.</p>
              </button>

              <button
                onClick={() => onNavigateTab('allocation-matrix')}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all text-left space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100">Run Room Allocation</h4>
                <p className="text-[11px] text-slate-400 leading-snug">Inspect allocation matrix and lock status.</p>
              </button>
            </div>
          </div>

          {/* Hard Constraints Safety Invariants */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white">System Safety Invariants Health</h3>
                  <p className="text-xs text-slate-400">Database constraints strictly verified on every operation.</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                100% Operational
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">BR-1: Strict Gender Segregation</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Male and female participants never share a room under any circumstance. Inherited strictly at hostel level.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">BR-2: Single College Room Lock</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Rooms lock to the first occupant's institution; zero mixed colleges allowed in student rooms.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">BR-6: Minimal Identity-Only QR Tokens</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Tokens store userId & token version only. No room, meal or PII is exposed on printed or digital QR badges.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">BR-7 & BR-8: Meal Slot Idempotency</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Enforces single redemption per meal slot, verified strictly against the assigned college batch window.</p>
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
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, phone, or college..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm"
                  title="Export filtered users to CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
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
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
              <span className="text-[11px] text-slate-400 mr-1">Filter Role:</span>
              <button
                onClick={() => setUserRoleFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'ALL'
                    ? 'bg-slate-900 dark:bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All ({usersList.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('STUDENT')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'STUDENT'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                }`}
              >
                Students ({studentCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('MANAGER')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'MANAGER'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                }`}
              >
                Managers ({managerCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('SCANNER')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'SCANNER'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                }`}
              >
                Scanners ({scannerCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('ADMIN')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  userRoleFilter === 'ADMIN'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                }`}
              >
                Admins ({adminCount})
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">College:</span>
              <select
                value={userCollegeFilter}
                onChange={(e) => setUserCollegeFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL">All Colleges ({collegesList.length})</option>
                {collegesList.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.code} - {col.name}
                  </option>
                ))}
              </select>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Verification:</span>
              <button
                onClick={() => setUserStatusFilter(userStatusFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  userStatusFilter === 'VERIFIED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                ✓ Verified
              </button>
              <button
                onClick={() => setUserStatusFilter(userStatusFilter === 'UNVERIFIED' ? 'ALL' : 'UNVERIFIED')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  userStatusFilter === 'UNVERIFIED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                ⚠ Unverified
              </button>
            </div>

            {/* Results Status Line */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-medium">
              <span>
                Showing <strong className="text-slate-700 dark:text-slate-200">{filteredUsers.length}</strong> of{' '}
                <strong className="text-slate-700 dark:text-slate-200">{usersList.length}</strong> registered accounts
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">College / Institution</th>
                    <th className="py-3 px-4">Events</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Role (RBAC)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Identifier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="font-heading font-bold text-sm text-slate-700 dark:text-slate-200">No matching users found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters.</p>
                        <button
                          onClick={() => {
                            setUserSearch('');
                            setUserRoleFilter('ALL');
                            setUserStatusFilter('ALL');
                            setUserCollegeFilter('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const initials = (user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      const registeredEventsCount = eventRegistrationsData?.events?.filter((ev: any) =>
                        ev.participants?.some((p: any) => p.id === user.id)
                      ).length || 0;
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-primary text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {initials}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white leading-snug">{user.name}</p>
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
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
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
                          <td className="py-3.5 px-4">
                            {user.role === 'STUDENT' && registeredEventsCount > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedEventIdForRoster('ALL');
                                  setEventRosterSearch(user.email || user.name || '');
                                  setShowEventRosterModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                                title="Click to view enrolled events"
                              >
                                <Calendar className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>{registeredEventsCount} {registeredEventsCount === 1 ? 'Event' : 'Events'}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 italic">
                                {user.role === 'STUDENT' ? '0 Events' : '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                            <span>{user.gender === 'MALE' ? '♂ Male' : '♀ Female'}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                              className={`text-xs font-bold py-1 px-2.5 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                                user.role === 'ADMIN'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                  : user.role === 'MANAGER'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                  : user.role === 'SCANNER'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
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
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                              }`}
                            >
                              {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleCopyUserId(user.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Click to copy full user ID"
                            >
                              {copiedUserId === user.id ? (
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                placeholder="Search college by name or code..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {collegeSearch && (
                <button
                  onClick={() => setCollegeSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="font-heading font-black text-slate-800 dark:text-slate-200 text-base">
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
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
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
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-slate-700 transition-all space-y-3 relative overflow-hidden group"
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
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" /> {col.lockedRooms || 0} Locked Rooms
                        </span>
                        <button
                          onClick={() => handleDeleteCollege(col.id, col.name)}
                          title="Delete College"
                          className="p-1.5 rounded-xl text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white leading-snug">{col.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {col.id}</p>
                    </div>

                    {/* Student Gender Bar & Quick Action */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        <span>Students Enrolled: <strong className="text-slate-800 dark:text-slate-200">{totalStudents}</strong></span>
                        <span>♂ {maleStudents} · ♀ {femaleStudents}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
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
                          className="font-bold text-primary dark:text-primary-400 hover:text-primary-dark hover:underline flex items-center gap-1 transition-colors"
                        >
                          View Students ({totalStudents}) →
                        </button>
                        {hostelsList.filter((h) => h.collegeId === col.id || h.collegeName === col.name).length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
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
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={hostelSearch}
                  onChange={(e) => setHostelSearch(e.target.value)}
                  placeholder="Search hostel by name or campus..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {hostelSearch && (
                  <button
                    onClick={() => setHostelSearch('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Gender Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setHostelGenderFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    hostelGenderFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setHostelGenderFilter('MALE')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    hostelGenderFilter === 'MALE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ♂ Boys
                </button>
                <button
                  onClick={() => setHostelGenderFilter('FEMALE')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    hostelGenderFilter === 'FEMALE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ♀ Girls
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleCheckoutAllFleet}
                disabled={totalFleetOccupied === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-40 disabled:hover:bg-amber-50 dark:disabled:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 rounded-xl text-xs font-bold transition-all shadow-sm disabled:cursor-not-allowed"
                title={totalFleetOccupied === 0 ? 'All rooms are already vacant' : `Checkout all ${totalFleetOccupied} occupants across all rooms`}
              >
                <LogOut className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Checkout All Rooms ({totalFleetOccupied})</span>
              </button>
              <button
                onClick={() => {
                  setUploadedStudentsPreview([]);
                  setBulkAllotResult(null);
                  setShowBulkAllotModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-primary text-white rounded-xl text-xs font-bold shadow-md hover:from-indigo-700 hover:to-primary-dark transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" /> Allot from Excel / CSV
              </button>
              <button
                onClick={() => {
                  setSelectedRosterHostelId('ALL');
                  setRosterSearch('');
                  setShowRosterModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="View full occupant roster across all hostels"
              >
                <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> All Roster
              </button>
              <button
                onClick={() => {
                  if (hostelsList.length > 0) setRoomHostelId(hostelsList[0].id);
                  setShowAddRoomModal(true);
                }}
                disabled={hostelsList.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
              <Home className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="font-heading font-black text-slate-800 dark:text-slate-200 text-base">
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
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
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
                  <div key={h.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-sm shadow-sm ${
                          h.gender === 'MALE' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60'
                        }`}>
                          {h.gender === 'MALE' ? '♂' : '♀'}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">{h.name}</h3>
                            {h.collegeName ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" /> {h.collegeName}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                Shared Campus
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Gender Rule: <strong className="text-slate-600 dark:text-slate-300">{h.gender === 'MALE' ? 'Boys Only' : 'Girls Only'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Capacity</span>
                          <p className="font-heading font-black text-slate-800 dark:text-slate-200 text-sm">{totalCap} beds</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Occupied</span>
                          <p className="font-heading font-black text-blue-600 dark:text-blue-400 text-sm">{totalOcc} beds</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Free Beds</span>
                          <p className="font-heading font-black text-emerald-600 dark:text-emerald-400 text-sm">{freeBeds} beds</p>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => {
                              setSelectedRosterHostelId(h.id);
                              setRosterSearch('');
                              setShowRosterModal(true);
                            }}
                            title={`View Occupants Roster for ${h.name}`}
                            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 transition-colors flex items-center gap-1 text-xs font-bold"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Roster</span>
                          </button>
                          <button
                            onClick={() => handleExportHostelRoster(h.id, h.name)}
                            title={`Export Roster CSV for ${h.name}`}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCheckoutHostel(h.id, h.name, totalOcc)}
                            disabled={totalOcc === 0}
                            title={totalOcc === 0 ? `${h.name} is completely vacant` : `Checkout all ${totalOcc} occupants in ${h.name}`}
                            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-30 disabled:hover:bg-amber-50 dark:disabled:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 transition-colors flex items-center gap-1 text-xs font-bold border border-amber-200/60 dark:border-amber-800 disabled:cursor-not-allowed"
                          >
                            <LogOut className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            <span className="hidden xl:inline">Checkout All</span>
                          </button>
                          <button
                            onClick={() => {
                              setRoomHostelId(h.id);
                              setShowAddRoomModal(true);
                            }}
                            title="Add Room to this Hostel"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHostel(h.id, h.name)}
                            title="Delete Hostel Facility"
                            className="p-2 rounded-xl text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Occupancy Rate Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Facility Utilization</span>
                        <span className={occPct >= 90 ? 'text-rose-600 dark:text-rose-400' : occPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {occPct}% Full
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
                            onClick={() => {
                              setSelectedRoomDetails(r);
                              setSelectedRoomHostel(h);
                              setShowRoomDetailsModal(true);
                            }}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-primary/60 dark:hover:border-primary/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md text-xs space-y-1.5 relative group transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-black text-slate-800 dark:text-slate-200">Room {r.number}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  F{r.floor}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRoom(r.id, r.number);
                                  }}
                                  title="Delete Room"
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                              <span>{r.occupiedCount || 0}/{r.capacity} beds</span>
                              {r.occupants && r.occupants.length > 0 && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5">
                                  <Eye className="w-2.5 h-2.5" /> Details
                                </span>
                              )}
                            </p>

                            {/* Bed visual dots */}
                            <div className="flex items-center gap-1 py-0.5">
                              {Array.from({ length: r.capacity || 2 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < (r.occupiedCount || 0)
                                      ? 'bg-blue-600'
                                      : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                  }`}
                                  title={i < (r.occupiedCount || 0) ? 'Occupied' : 'Vacant'}
                                />
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                              {r.lockedCollege ? (
                                <span 
                                  className="text-[9px] font-black px-1.5 py-0.5 rounded text-white inline-block shadow-sm truncate max-w-[90px]"
                                  style={{ backgroundColor: r.lockedCollege.color || '#4F46E5' }}
                                  title={r.lockedCollege.name}
                                >
                                  {r.lockedCollege.code}
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Unlocked</span>
                              )}

                              {r.occupants && r.occupants.length > 0 && (
                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[80px]" title={r.occupants[0].userName}>
                                  {r.occupants[0].userName.split(' ')[0]}
                                  {r.occupants.length > 1 ? ` +${r.occupants.length - 1}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No rooms added to this hostel yet.</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">Add rooms to generate bed inventory and activate allocation.</p>
                        <button
                          onClick={() => {
                            setRoomHostelId(h.id);
                            setShowAddRoomModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-400 hover:underline mt-1"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">Festival Global Operational Parameters</h3>
                <p className="text-xs text-slate-400 mt-0.5">Parameters apply across all participating colleges, meal halls, and sports venues.</p>
              </div>
              {configSaved && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in fade-in flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Parameters Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-slate-900 dark:text-slate-100 text-xs">
                    Meal Grace Period (Minutes)
                  </label>
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-primary dark:text-primary-400">
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Time tolerance granted by scanners before and after a student's assigned college meal batch window.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-slate-900 dark:text-slate-100 text-xs">
                    Event Registration Cutoff Window (Hours Before Event)
                  </label>
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-primary dark:text-primary-400">
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
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
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">Add Account / Staff Member</h3>
              <button 
                type="button" 
                onClick={() => setShowAddUserModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="e.g. manager@unifest.org"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role (RBAC) *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="SCANNER">SCANNER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STUDENT">STUDENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                <select
                  value={newUserGender}
                  onChange={(e) => setNewUserGender(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="MALE">Male (♂)</option>
                  <option value="FEMALE">Female (♀)</option>
                </select>
              </div>
            </div>

            {newUserRole === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Enrolled College *</label>
                <select
                  value={newUserCollegeId}
                  onChange={(e) => setNewUserCollegeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">Register Participating College</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddCollegeModal(false);
                  setSelectedDirectoryCollegeId('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Dropdown for colleges from User Profile Directory */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select from User Profile Colleges Directory
              </label>
              <select
                value={selectedDirectoryCollegeId}
                onChange={(e) => handleDirectoryCollegeSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Institution Name *</label>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g., CGC University, Mohali"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College Code *</label>
                <input
                  type="text"
                  value={newColCode}
                  onChange={(e) => setNewColCode(e.target.value)}
                  placeholder="e.g., CGC-M"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs uppercase focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brand Color</label>
                <input
                  type="color"
                  value={newColColor}
                  onChange={(e) => setNewColColor(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">Add Hostel Facility</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddHostelModal(false);
                  setNewHostelCollegeId('');
                  setNewHostelCustomCollege('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hostel Name *</label>
              <input
                type="text"
                value={newHostelName}
                onChange={(e) => setNewHostelName(e.target.value)}
                placeholder="e.g., Tagore International Boys Hostel"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                required
              />
            </div>

            {/* College / University Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                College / University (Campus Designation)
              </label>
              <select
                value={newHostelCollegeId}
                onChange={(e) => setNewHostelCollegeId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Custom College / University Name *
                </label>
                <input
                  type="text"
                  value={newHostelCustomCollege}
                  onChange={(e) => setNewHostelCustomCollege(e.target.value)}
                  placeholder="e.g., CGC University, Mohali"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Gender Designation (Strict) *</label>
              <select
                value={newHostelGender}
                onChange={(e) => setNewHostelGender(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3.5 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">Add Room to Hostel</h3>
              <button 
                type="button" 
                onClick={() => setShowAddRoomModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Hostel Facility *</label>
              <select
                value={roomHostelId}
                onChange={(e) => setRoomHostelId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room No. *</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor</label>
                <input
                  type="number"
                  value={roomFloor}
                  onChange={(e) => setRoomFloor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Beds *</label>
                <input
                  type="number"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(e.target.value)}
                  min="1"
                  max="8"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

      {/* MODAL 5: BULK STUDENT IMPORT & ROOM ALLOTMENT */}
      {showBulkAllotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-100 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Bulk Student Import & Room Allotment
                  </h3>
                  <p className="text-xs text-slate-400">
                    Format: <span className="font-semibold text-slate-600 dark:text-slate-300">Student Roll No, Name, Gender, Age, College/University, City, State/UT, Course, Year, Activity Category, Specific Activity</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkAllotModal(false);
                  setUploadedStudentsPreview([]);
                  setBulkAllotResult(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Invariant Rule Callout */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs space-y-2">
              <div className="flex items-center gap-2 font-heading font-black text-blue-900 dark:text-blue-300">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Strict Constraint Enforcement Active</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-blue-900/40">
                  <strong className="text-slate-800 dark:text-slate-200">BR-2: Same College Rule:</strong> Students sharing a room must strictly belong to the same college. No mixing of institutions in any room under any circumstance.
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-blue-900/40">
                  <strong className="text-slate-800 dark:text-slate-200">BR-1: Gender Segregation:</strong> Male students are placed exclusively in Boys Hostels; Female students in Girls Hostels.
                </div>
              </div>
            </div>

            {/* Result Report (If already executed) */}
            {bulkAllotResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-heading font-black text-sm flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Room Allotment Finished Successfully!
                    </span>
                    <button
                      onClick={handleDownloadAllotmentReport}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Report (CSV)
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total In File</span>
                      <p className="font-heading font-black text-slate-800 dark:text-slate-100 text-base">{bulkAllotResult.totalRowsProcessed}</p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Beds Allotted</span>
                      <p className="font-heading font-black text-emerald-700 dark:text-emerald-300 text-base">{bulkAllotResult.allottedCount}</p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Rooms Locked</span>
                      <p className="font-heading font-black text-indigo-700 dark:text-indigo-400 text-base">{bulkAllotResult.roomsLockedCount}</p>
                    </div>
                  </div>
                </div>

                {/* Shortfalls Warning if any */}
                {bulkAllotResult.shortfalls && bulkAllotResult.shortfalls.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Capacity Shortfall Notice:
                    </span>
                    {bulkAllotResult.shortfalls.map((s: any, idx: number) => (
                      <p key={idx} className="text-[11px] text-amber-800 dark:text-amber-300">
                        • <strong>{s.collegeName} ({s.gender === 'MALE' ? 'Boys' : 'Girls'}):</strong> {s.unallocatedCount} unallocated students ({s.reason})
                      </p>
                    ))}
                  </div>
                )}

                {/* Table of new allocations */}
                <div className="space-y-2">
                  <h4 className="font-heading font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Allotment Roster Summary ({bulkAllotResult.allocations?.length || 0} students)
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Roll No</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">College / Univ</th>
                          <th className="py-2.5 px-3">Course & Year</th>
                          <th className="py-2.5 px-3">Activity</th>
                          <th className="py-2.5 px-3">Facility</th>
                          <th className="py-2.5 px-3">Room & Bed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bulkAllotResult.allocations?.map((a: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono font-bold text-slate-600 dark:text-slate-400 text-[11px]">{a.rollNo || '—'}</td>
                            <td className="py-2 px-3">
                              <p className="font-bold text-slate-800 dark:text-slate-100">{a.userName}</p>
                              <p className="text-[10px] text-slate-400">{a.gender === 'MALE' ? '♂ Male' : '♀ Female'}{a.age ? ` · ${a.age} yrs` : ''}</p>
                            </td>
                            <td className="py-2 px-3">
                              <p className="text-slate-800 dark:text-slate-200 font-semibold">{a.collegeName}</p>
                              {(a.city || a.state) && (
                                <p className="text-[10px] text-slate-400">{[a.city, a.state].filter(Boolean).join(', ')}</p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                              {a.course ? <span>{a.course} {a.year ? `(${a.year})` : ''}</span> : '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-[11px]">
                              {a.specificActivity ? (
                                <span className="font-medium">
                                  {a.activityCategory ? `${a.activityCategory}: ` : ''}{a.specificActivity}
                                </span>
                              ) : (a.activityCategory || '—')}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">{a.hostelName}</td>
                            <td className="py-2 px-3">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Room {a.roomNumber}</span>
                              <span className="text-[10px] text-slate-400 ml-1 font-mono">({a.bedLabel})</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setShowBulkAllotModal(false);
                      setUploadedStudentsPreview([]);
                      setBulkAllotResult(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                  >
                    Done & Inspect Hostels
                  </button>
                </div>
              </div>
            ) : (
              /* Upload & Preview Step */
              <div className="space-y-4">
                {/* Upload Zone */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary rounded-3xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-heading font-black text-sm text-slate-800 dark:text-slate-100">
                      Choose Excel or CSV file
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">
                      Accepts <strong className="text-slate-600 dark:text-slate-300">.xlsx, .xls, .csv</strong> files with standard 11 columns:<br />
                      <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md mt-1 inline-block">
                        Student Roll No, Name, Gender, Age, College/University, City, State/UT, Course, Year, Activity Category, Specific Activity
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-md">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Select File</span>
                      <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleDownloadSampleTemplate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Download Sample Template</span>
                    </button>
                  </div>
                </div>

                {/* Preview Table if File Loaded */}
                {uploadedStudentsPreview.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-xs text-slate-900 dark:text-white">
                          File Preview: {uploadedStudentsPreview.length} Students Detected
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                          {uploadedStudentsPreview.filter((s) => s.gender === 'MALE').length} Boys · {uploadedStudentsPreview.filter((s) => s.gender === 'FEMALE').length} Girls
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedStudentsPreview([])}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                      >
                        Clear File
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Student Roll No</th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Gender / Age</th>
                            <th className="py-2 px-3">College / University</th>
                            <th className="py-2 px-3">City, State</th>
                            <th className="py-2 px-3">Course & Year</th>
                            <th className="py-2 px-3">Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {uploadedStudentsPreview.slice(0, 8).map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">{s.rollNo || '—'}</td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                                {s.gender === 'MALE' ? '♂ Male' : '♀ Female'}{s.age ? ` · ${s.age}y` : ''}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">{s.collegeName}</td>
                              <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">{[s.course, s.year].filter(Boolean).join(' · ') || '—'}</td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-[11px]">
                                {s.specificActivity ? `${s.activityCategory ? `${s.activityCategory}: ` : ''}${s.specificActivity}` : (s.activityCategory || '—')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {uploadedStudentsPreview.length > 8 && (
                      <p className="text-[11px] text-slate-400 italic text-right">
                        Showing first 8 of {uploadedStudentsPreview.length} students...
                      </p>
                    )}

                    <div className="pt-2 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBulkAllotModal(false);
                          setUploadedStudentsPreview([]);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteBulkAllotment}
                        disabled={isBulkAllotting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-primary text-white text-xs font-bold shadow-md hover:from-indigo-700 hover:to-primary-dark transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isBulkAllotting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isBulkAllotting ? 'Running Allotment...' : 'Confirm & Run Room Allotment'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 6: ROOM OCCUPANTS & DETAILS MODAL */}
      {showRoomDetailsModal && selectedRoomDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                    Room {selectedRoomDetails.number}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Floor {selectedRoomDetails.floor}
                  </span>
                  {(() => {
                    const isBoysRoom = (
                      (selectedRoomDetails.gender || selectedRoomHostel?.gender || '')
                        .toString()
                        .toUpperCase() === 'MALE' ||
                      (selectedRoomHostel?.name || '').toLowerCase().includes('chanakya') ||
                      (selectedRoomHostel?.name || '').toLowerCase().includes('aryabhatta')
                    );
                    return (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                        isBoysRoom
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                      }`}>
                        {isBoysRoom ? '♂ Boys Room' : '♀ Girls Room'}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>Hostel: <strong className="text-slate-800 dark:text-slate-200">{selectedRoomHostel?.name || 'Hostel'}</strong></span>
                  {(selectedRoomHostel?.collegeName || selectedRoomDetails?.collegeName || selectedRoomDetails?.lockedCollege?.name) && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-md text-[11px]">
                        <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        {selectedRoomHostel?.collegeName || selectedRoomDetails?.collegeName || selectedRoomDetails?.lockedCollege?.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowRoomDetailsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Room Invariant Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Locked College Status</span>
                {selectedRoomDetails.lockedCollege ? (
                  <span
                    className="font-heading font-bold text-xs px-2 py-0.5 rounded-md text-white inline-block mt-0.5 shadow-sm"
                    style={{ backgroundColor: selectedRoomDetails.lockedCollege.color || '#4F46E5' }}
                  >
                    {selectedRoomDetails.lockedCollege.name} ({selectedRoomDetails.lockedCollege.code})
                  </span>
                ) : (
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Unlocked (Open to any college)</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Occupancy</span>
                <span className="font-heading font-black text-sm text-slate-800 dark:text-slate-200">
                  {selectedRoomDetails.occupiedCount || 0} / {selectedRoomDetails.capacity} Beds
                </span>
              </div>
            </div>

            {/* Occupants List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Assigned Occupants ({selectedRoomDetails.occupants?.length || 0})
                </h4>
                {selectedRoomDetails.occupants && selectedRoomDetails.occupants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleCheckoutRoom(selectedRoomDetails.id, selectedRoomDetails.number)}
                    className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    title={`Checkout all ${selectedRoomDetails.occupants.length} students from Room ${selectedRoomDetails.number}`}
                  >
                    <LogOut className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                    <span>Checkout Room ({selectedRoomDetails.occupants.length})</span>
                  </button>
                )}
              </div>

              {!selectedRoomDetails.occupants || selectedRoomDetails.occupants.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-1">
                  <p className="font-bold text-xs text-slate-600 dark:text-slate-300">No students currently allotted to this room</p>
                  <p className="text-[11px] text-slate-400">Beds are completely vacant and ready for same-college student allotment.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {selectedRoomDetails.occupants.map((occ: any, i: number) => (
                    <div key={i} className="p-3 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                          {occ.bedLabel || `B${i + 1}`}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 dark:text-white leading-snug">{occ.userName}</p>
                            {occ.rollNo && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {occ.rollNo}
                              </span>
                            )}
                            {occ.age && (
                              <span className="text-[10px] text-slate-400">· {occ.age} yrs</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{occ.collegeName || selectedRoomDetails.lockedCollege?.name}</span>
                            {(occ.city || occ.state) && (
                              <span className="text-slate-400"> ({[occ.city, occ.state].filter(Boolean).join(', ')})</span>
                            )}
                            {occ.course && (
                              <span className="text-slate-500 dark:text-slate-400 font-medium"> · {occ.course} {occ.year ? `(${occ.year})` : ''}</span>
                            )}
                          </p>
                          {occ.specificActivity && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 flex items-center gap-1">
                              <span>🎯 {occ.activityCategory ? `${occ.activityCategory}: ` : ''}{occ.specificActivity}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnassignBed(occ.allocationId, occ.userName)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors shrink-0"
                        title="Unassign student from this bed"
                      >
                        Unassign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRoomDetailsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: HOSTEL FACILITY OCCUPANTS ROSTER MODAL */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Hostel Allotment Occupants Roster
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspect all students assigned to beds across accommodation facilities.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Filter & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search by student, room, or college..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={selectedRosterHostelId}
                  onChange={(e) => setSelectedRosterHostelId(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">All Hostels ({hostelsList.length})</option>
                  {hostelsList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.gender === 'MALE' ? 'Boys' : 'Girls'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const targetName = selectedRosterHostelId === 'ALL' ? 'all_hostels' : (hostelsList.find((h) => h.id === selectedRosterHostelId)?.name || 'hostel');
                  handleExportHostelRoster(selectedRosterHostelId, targetName);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Roster Table */}
            {(() => {
              // Aggregate all occupants
              const allOccupantsList: any[] = [];
              const targetHostels = selectedRosterHostelId === 'ALL' ? hostelsList : hostelsList.filter((h) => h.id === selectedRosterHostelId);

              targetHostels.forEach((h) => {
                (h.rooms || []).forEach((r: any) => {
                  (r.occupants || []).forEach((occ: any) => {
                    allOccupantsList.push({
                      ...occ,
                      hostelName: h.name,
                      roomNumber: r.number,
                      floor: r.floor,
                      gender: r.gender,
                    });
                  });
                });
              });

              const filteredRoster = allOccupantsList.filter((occ) => {
                if (!rosterSearch.trim()) return true;
                const q = rosterSearch.toLowerCase();
                return (
                  occ.userName.toLowerCase().includes(q) ||
                  occ.roomNumber.toLowerCase().includes(q) ||
                  occ.collegeName.toLowerCase().includes(q) ||
                  (occ.rollNo && occ.rollNo.toLowerCase().includes(q)) ||
                  (occ.course && occ.course.toLowerCase().includes(q)) ||
                  (occ.specificActivity && occ.specificActivity.toLowerCase().includes(q)) ||
                  (occ.activityCategory && occ.activityCategory.toLowerCase().includes(q)) ||
                  (occ.userEmail && occ.userEmail.toLowerCase().includes(q))
                );
              });

              return filteredRoster.length === 0 ? (
                <div className="p-12 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-heading font-bold text-sm text-slate-700 dark:text-slate-200">No occupants found</p>
                  <p className="text-xs text-slate-400">
                    {allOccupantsList.length === 0
                      ? 'No students have been allotted rooms in this facility yet. Use "Allot from Excel / CSV" to allot students.'
                      : 'No students match your search query.'}
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">College / Univ</th>
                        <th className="py-2.5 px-3">Course & Activity</th>
                        <th className="py-2.5 px-3">Hostel & Room</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRoster.map((occ, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                            {occ.rollNo || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900 dark:text-white">{occ.userName}</p>
                            <p className="text-[10px] text-slate-400">
                              {occ.userGender === 'MALE' ? '♂ Male' : '♀ Female'}{occ.age ? ` · ${occ.age} yrs` : ''}
                            </p>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{occ.collegeName}</p>
                            {(occ.city || occ.state) && (
                              <p className="text-[10px] text-slate-400">{[occ.city, occ.state].filter(Boolean).join(', ')}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {occ.course && (
                              <p className="text-slate-700 dark:text-slate-300 font-medium">{occ.course} {occ.year ? `(${occ.year})` : ''}</p>
                            )}
                            {occ.specificActivity && (
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                                <span>🎯 {occ.activityCategory ? `${occ.activityCategory}: ` : ''}{occ.specificActivity}</span>
                              </p>
                            )}
                            {!occ.course && !occ.specificActivity && <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="text-slate-700 dark:text-slate-300 font-medium">{occ.hostelName}</p>
                            <p className="text-[10px]">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Room {occ.roomNumber}</span>
                              <span className="text-slate-400 ml-1 font-mono">({occ.bedLabel || 'Bed'})</span>
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleUnassignBed(occ.allocationId, occ.userName)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors"
                            >
                              Unassign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRosterModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: EVENT COMPETITIONS & ATTENDEE ROSTER MODAL */}
      {showEventRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                    Event Competitions & Attendee Roster
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live registration tracking across all sports, cultural, and flagship festival events.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEventRosterModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Competitions Quick Badges */}
            {(eventRegistrationsData?.events || []).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Competitions:</span>
                {(eventRegistrationsData?.events || []).map((ev: any) => (
                  <div
                    key={ev.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      selectedEventIdForRoster === ev.id
                        ? 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEventIdForRoster(selectedEventIdForRoster === ev.id ? 'ALL' : ev.id)}
                      className="hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{ev.title}</span>
                      <span className="text-[10px] opacity-70">({ev.participants?.length || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEventAdmin(ev.id);
                      }}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-700 transition-colors ml-0.5 cursor-pointer"
                      title={`Permanently delete "${ev.title}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Filter & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Event Selector */}
                <select
                  value={selectedEventIdForRoster}
                  onChange={(e) => setSelectedEventIdForRoster(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-1 focus:ring-primary cursor-pointer max-w-[240px] truncate"
                >
                  <option value="ALL">All Competitions ({eventRegistrationsData?.events?.length || 0})</option>
                  {(eventRegistrationsData?.events || []).map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.participants?.length || 0}/{ev.capacity || '∞'})
                    </option>
                  ))}
                </select>

                {/* Search Box */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={eventRosterSearch}
                    onChange={(e) => setEventRosterSearch(e.target.value)}
                    placeholder="Search by student, college, roll no..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedEventIdForRoster !== 'ALL' && (
                  <button
                    onClick={() => handleDeleteEventAdmin(selectedEventIdForRoster)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 font-bold transition-colors cursor-pointer"
                    title="Permanently delete this event competition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Delete Event
                  </button>
                )}
                <button
                  onClick={handleExportEventRosterCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 font-bold transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Content Table */}
            {(() => {
              const activeEvents = selectedEventIdForRoster === 'ALL'
                ? (eventRegistrationsData?.events || [])
                : (eventRegistrationsData?.events || []).filter((e: any) => e.id === selectedEventIdForRoster);

              const allRows: Array<{
                event: any;
                participant: any;
              }> = [];

              for (const ev of activeEvents) {
                for (const p of (ev.participants || [])) {
                  allRows.push({ event: ev, participant: p });
                }
              }

              const filtered = allRows.filter(({ event, participant }) => {
                if (!eventRosterSearch.trim()) return true;
                const q = eventRosterSearch.toLowerCase();
                const colName = typeof participant.college === 'string' ? participant.college : (participant.college?.name || participant.college?.code || '');
                return (
                  (participant.name && participant.name.toLowerCase().includes(q)) ||
                  (participant.email && participant.email.toLowerCase().includes(q)) ||
                  (participant.rollNo && participant.rollNo.toLowerCase().includes(q)) ||
                  (event.title && event.title.toLowerCase().includes(q)) ||
                  colName.toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {allRows.length === 0 ? 'No event registrations recorded yet' : 'No attendees match your search'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {allRows.length === 0
                        ? 'Registrations made by students in the portal will sync and appear here automatically.'
                        : 'Try typing a different search query or clear the filter.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Event / Venue</th>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">College</th>
                        <th className="py-2.5 px-3">Registered At</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {filtered.map(({ event, participant }, idx) => (
                        <tr key={`${event.id}-${participant.id}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                                {participant.name ? participant.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white leading-tight">{participant.name}</p>
                                <p className="text-[10px] text-slate-400">{participant.email || participant.phone || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{event.title}</span>
                            <span className="text-[10px] text-slate-400">{event.venue || event.type}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {participant.rollNo || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 max-w-[160px] truncate" title={participant.college?.name || participant.college?.code}>
                            <span className="font-semibold">{participant.college?.code || participant.college?.name || 'Festival Guest'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                            {participant.registeredAt ? new Date(participant.registeredAt).toLocaleString() : 'Recent'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              CONFIRMED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total Competitions: <strong>{eventRegistrationsData?.stats?.totalEvents ?? 0}</strong> • Registered Participants: <strong>{eventRegistrationsData?.stats?.totalRegistrations ?? 0}</strong>
              </span>
              <button
                onClick={() => setShowEventRosterModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal for Admin */}
      {eventToDeleteAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100 dark:border-rose-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-white">
                  Delete Competition?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent administrator event removal.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>{eventToDeleteAdmin.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {eventToDeleteAdmin.count ?? 0} registered
                </span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                ⚠️ All student registrations for &quot;{eventToDeleteAdmin.title}&quot; will be permanently deleted from the database and attendees will be notified of cancellation.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToDeleteAdmin(null)}
                disabled={isDeletingEventAdmin}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteEventAdmin(eventToDeleteAdmin.id)}
                disabled={isDeletingEventAdmin}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingEventAdmin ? 'Deleting...' : 'Yes, Delete Competition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
