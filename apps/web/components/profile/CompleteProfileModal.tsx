'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Home,
  School,
  FileBadge,
  GraduationCap,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { User as UserType } from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';
import confetti from 'canvas-confetti';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onProfileUpdated?: (updatedUser: UserType) => void;
  reason?: string | null; // e.g. "To register for 100m Sprint Men"
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export function CompleteProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
  reason,
}: CompleteProfileModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [address, setAddress] = useState('');
  const [collegeId, setCollegeId] = useState('col-pce');
  const [collegeName, setCollegeName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [course, setCourse] = useState('B.Tech CSE');
  const [passingYear, setPassingYear] = useState('2026');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setFatherPhone(user.fatherPhone || '');
      setAddress(user.address || '');
      setCollegeId(user.collegeId || 'col-pce');
      setCollegeName(user.collegeName || user.college?.name || '');
      setRollNo(user.rollNo || '');
      setCourse(user.course || 'B.Tech CSE');
      setPassingYear(user.passingYear ? String(user.passingYear) : '2026');
      setAvatarUrl(user.avatarUrl || AVATAR_PRESETS[0]);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !fatherPhone.trim() || !address.trim() || !rollNo.trim() || !course.trim()) {
      toast.warning('Incomplete Form', 'Please fill in all required profile fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          fatherPhone: fatherPhone.trim(),
          address: address.trim(),
          collegeId,
          collegeName: collegeName.trim(),
          rollNo: rollNo.trim(),
          course: course.trim(),
          passingYear: parseInt(passingYear) || 2026,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error('Update Failed', data.error || 'Could not save profile details.');
      } else {
        toast.success('Profile Completed! 🎉', 'Your profile details are now complete.');
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3B3FD9', '#10B981', '#F59E0B'],
        });

        if (onProfileUpdated && data.user) {
          onProfileUpdated(data.user);
        }
        onClose();
      }
    } catch {
      toast.error('Network Error', 'Failed to connect to profile service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem('unifest_profile_skipped', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-black text-lg text-slate-900 tracking-tight">
                Complete Your Profile
              </h2>
              <p className="text-[11px] text-slate-500">
                {reason ? reason : 'Required to register for festival sports and folk events.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Selection */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="relative">
              <img
                src={avatarUrl || AVATAR_PRESETS[0]}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-primary shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                <Camera className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Choose Profile Picture
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition-all ${
                      avatarUrl === preset ? 'border-primary scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Kapoor"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Phone Numbers (Student Phone & Father's Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Student Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Father&apos;s Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  placeholder="+91 99887 76655"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Residential Address *</label>
            <div className="relative">
              <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House No, Street, City, State, PIN"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* College Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">College / University *</label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="col-pce">Punjab College of Engineering (PCE)</option>
                <option value="col-lpu">Lovely Professional University (LPU)</option>
                <option value="col-du">Delhi University (DU)</option>
                <option value="col-iitd">IIT Delhi (IITD)</option>
                <option value="col-bits">BITS Pilani (BITS)</option>
              </select>
            </div>
          </div>

          {/* Academic Info: Roll No, Course, Passing Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Roll No / Student ID *</label>
              <div className="relative">
                <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 22BCS1045"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Course / Degree *</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.Tech CSE, MBA"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Passing Year *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={passingYear}
                  onChange={(e) => setPassingYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons: Skip & Save */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Skip for now
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-primary text-white font-heading font-bold text-xs shadow-md shadow-primary/25 hover:bg-primary-dark transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save & Complete Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
