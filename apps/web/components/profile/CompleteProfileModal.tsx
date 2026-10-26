'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Camera,
  Upload,
  ShieldCheck,
  Building2,
  Image as ImageIcon,
} from 'lucide-react';
import { User as UserType, NORTH_INDIA_COLLEGES } from '@unifest/shared';
import { useToast } from '@/components/ui/Toast';
import confetti from 'canvas-confetti';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onProfileUpdated?: (updatedUser: UserType) => void;
  reason?: string | null;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

const REGIONS = [
  'Punjab & Chandigarh',
  'Delhi NCR',
  'Haryana',
  'HP, Uttarakhand & J&K',
  'Uttar Pradesh',
  'Rajasthan',
  'Other',
] as const;

export function CompleteProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
  reason,
}: CompleteProfileModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [address, setAddress] = useState('');
  const [collegeId, setCollegeId] = useState('col-cgc-jhanjeri');
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [course, setCourse] = useState('B.Tech CSE');
  const [passingYear, setPassingYear] = useState('2026');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isCustomPhoto, setIsCustomPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setFatherName(user.fatherName || '');
      setFatherPhone(user.fatherPhone || '');
      setAddress(user.address || '');

      // Check if user's college is in the North India list
      const matched = NORTH_INDIA_COLLEGES.find(
        (c) => c.id === user.collegeId || c.name.toLowerCase() === (user.collegeName || '').toLowerCase()
      );
      if (matched) {
        setCollegeId(matched.id);
        setCustomCollegeName('');
      } else if (user.collegeName) {
        setCollegeId('col-other');
        setCustomCollegeName(user.collegeName);
      } else {
        setCollegeId('col-cgc-jhanjeri');
        setCustomCollegeName('');
      }

      setRollNo(user.rollNo || '');
      setCourse(user.course || 'B.Tech CSE');
      setPassingYear(user.passingYear ? String(user.passingYear) : '2026');

      if (user.avatarUrl) {
        setAvatarUrl(user.avatarUrl);
        setIsCustomPhoto(!AVATAR_PRESETS.includes(user.avatarUrl));
      } else {
        setAvatarUrl(AVATAR_PRESETS[0]);
        setIsCustomPhoto(false);
      }
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Handle User Uploading Their Own Picture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Invalid File', 'Please select an image file (PNG, JPG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('File Too Large', 'Please select an image under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        // Square crop & compress to max 360x360 for fast loading
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressed);
          setIsCustomPhoto(true);
          toast.success('Photo Uploaded! 📸', 'Your picture has been selected.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCollegeChange = (newCollegeId: string) => {
    setCollegeId(newCollegeId);
    if (newCollegeId !== 'col-other') {
      const selected = NORTH_INDIA_COLLEGES.find((c) => c.id === newCollegeId);
      if (selected) {
        setCustomCollegeName('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !phone.trim() ||
      !fatherName.trim() ||
      !fatherPhone.trim() ||
      !address.trim() ||
      !rollNo.trim() ||
      !course.trim()
    ) {
      toast.warning('Incomplete Form', 'Please fill in all required profile fields.');
      return;
    }

    if (!avatarUrl || !avatarUrl.trim()) {
      toast.warning('Picture Required', 'Please upload your profile picture.');
      return;
    }

    let finalCollegeName = '';
    if (collegeId === 'col-other') {
      if (!customCollegeName.trim()) {
        toast.warning('College Name Required', 'Please type your college/university name.');
        return;
      }
      finalCollegeName = customCollegeName.trim();
    } else {
      const selected = NORTH_INDIA_COLLEGES.find((c) => c.id === collegeId);
      finalCollegeName = selected ? selected.name : 'Unknown College';
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/me/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          fatherName: fatherName.trim(),
          fatherPhone: fatherPhone.trim(),
          address: address.trim(),
          collegeId,
          collegeName: finalCollegeName,
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
        toast.success('Profile Completed! 🎉', 'Your student details are now complete.');
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
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200"
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
          {/* 1. Picture Upload Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/40 border border-indigo-100/80">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview with Badge */}
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || AVATAR_PRESETS[0]}
                  alt="Profile Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-primary shadow-md ring-4 ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  title="Upload New Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upload Action */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-slate-800">Your Profile Picture *</span>
                    {isCustomPhoto ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Custom Photo
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                        Preset Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload your own clear front-facing portrait photo for event ID accreditation.
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Your Photo</span>
                  </button>

                  {/* Or select preset avatars */}
                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                    {AVATAR_PRESETS.slice(0, 3).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset);
                          setIsCustomPhoto(false);
                        }}
                        className={`w-6 h-6 rounded-lg overflow-hidden border transition-all ${
                          avatarUrl === preset && !isCustomPhoto
                            ? 'border-primary ring-2 ring-primary/30 scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        title={`Preset ${idx + 1}`}
                      >
                        <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Info: Full Name & Email */}
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

          {/* 3. Student Phone Number */}
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

          {/* 4. Parent / Guardian Details (Father's Name & Father's Phone) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold">Father&apos;s / Guardian Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Father&apos;s Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Residential Address */}
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

          {/* 6. College / University Selection (North India Colleges Dropdown) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              College / University (North India) *
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={collegeId}
                onChange={(e) => handleCollegeChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer truncate"
              >
                {REGIONS.map((region) => {
                  const collegesInRegion = NORTH_INDIA_COLLEGES.filter((c) => c.region === region);
                  if (collegesInRegion.length === 0) return null;
                  return (
                    <optgroup key={region} label={`── ${region} ──`} className="font-bold text-slate-800">
                      {collegesInRegion.map((col) => (
                        <option key={col.id} value={col.id} className="font-normal text-slate-900">
                          {col.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Custom College Name input if 'Other' is selected */}
            {collegeId === 'col-other' && (
              <div className="relative pt-1 animate-in fade-in duration-150">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-4 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={customCollegeName}
                  onChange={(e) => setCustomCollegeName(e.target.value)}
                  placeholder="Enter your College / University full name..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* 7. Academic Info: Roll No, Course, Passing Year */}
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
                  <span>Saving Profile...</span>
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
