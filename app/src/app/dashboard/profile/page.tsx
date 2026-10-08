'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { updatePlayerProfile, uploadToSupabaseStorage } from '@/lib/supabase-service';

export default function ProfilePage() {
  const { user, isProfileComplete, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDateOfBirth(user.date_of_birth || '');
      setGender(user.gender || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) return null;

  // Calculate age from DOB
  const calculatedAge = dateOfBirth
    ? Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const compressAvatarToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], `avatar-${user.id}.webp`, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          }, 'image/webp', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const webpFile = await compressAvatarToWebP(file);
      const publicUrl = await uploadToSupabaseStorage(webpFile, 'avatars');
      setAvatar(publicUrl);
      setToast('Avatar uploaded successfully! Save profile to confirm.');
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setToast('Failed to upload avatar.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!phone || !gender || !dateOfBirth) {
      setToast('Please fill all required fields: Phone, Date of Birth, and Gender.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    try {
      await updatePlayerProfile(user.id, {
        name,
        phone,
        gender,
        date_of_birth: dateOfBirth,
        avatar,
      });
      setToast('Profile updated successfully!');

      // Refresh auth context with updated profile
      await refreshProfile();

      setTimeout(() => {
        setToast(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast('Failed to update profile.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const needsCompletion = !isProfileComplete;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Profile</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Manage your personal information for tournament eligibility and communication.
        </p>
      </div>

      {/* Completion banner */}
      {needsCompletion && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.10))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Profile Incomplete
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Please fill in all required fields below to access the dashboard.
              Fields marked with * are mandatory.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile Avatar Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  border: '2px solid var(--accent)',
                }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}>
                {name ? name.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label htmlFor="avatar-upload" style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, cursor: 'pointer', border: '2px solid var(--bg-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'background 0.2s ease',
            }} title="Upload profile picture">
              📷
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{user.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{user.email}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {user.roles.map(role => (
                <span key={role} className="badge badge-accent" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                  {role === 'system_admin' ? 'System Admin' : role === 'admin' ? 'Organizer' : role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Email Address (Read-only)</label>
          <input type="text" className="input" value={user.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="profile-name">Full Name *</label>
          <input id="profile-name" type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="profile-phone">
            Phone Number *
            {!phone && <span style={{ color: '#ef4444', fontSize: 11, marginLeft: 8 }}>Required</span>}
          </label>
          <input id="profile-phone" type="tel" className="input" placeholder="+91 99999 99999" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="profile-dob">
              Date of Birth *
              {!dateOfBirth && <span style={{ color: '#ef4444', fontSize: 11, marginLeft: 8 }}>Required</span>}
            </label>
            <input
              id="profile-dob"
              type="date"
              className="input"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {calculatedAge !== null && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Age: {calculatedAge} years
              </span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="profile-gender">
              Gender *
              {!gender && <span style={{ color: '#ef4444', fontSize: 11, marginLeft: 8 }}>Required</span>}
            </label>
            <select id="profile-gender" className="input" value={gender} onChange={e => setGender(e.target.value)} required>
              <option value="" disabled>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: 180 }}>
            {loading ? 'Saving...' : needsCompletion ? 'Save & Continue →' : 'Save Profile'}
          </button>
        </div>
      </form>

      {toast && (
        <div className={`toast ${toast.includes('Failed') || toast.includes('Please fill') ? 'toast-error' : 'toast-success'}`} style={{ zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
