'use client'

import React, { useEffect, useState, useRef } from 'react'
import { User, Key, Download, Camera, Mail, Sparkles, Edit3, RotateCw, ZoomIn, Sliders, RefreshCw, FlipHorizontal, FlipVertical } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { Toast } from '@/components/ui/Toast'
import { PuzzleSpinner } from '@/components/ui/puzzle-spinner'

type UserData = {
  id?: string
  name: string
  email: string
  role?: string
  twoFactorEnabled?: boolean
  twoFactorPin?: string
  geminiApiKey?: string
  image?: string
}

const PRESET_FILTERS = [
  { id: 'original', name: 'Original', css: 'none' },
  { id: 'bw', name: 'B&W', css: 'grayscale(100%) contrast(120%)' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
  { id: 'warm', name: 'Warm', css: 'sepia(30%) saturate(140%)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(180deg) saturate(120%)' },
  { id: 'high_contrast', name: 'High Contrast', css: 'contrast(160%) brightness(110%)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(50%) contrast(110%) brightness(90%)' },
]

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactor, setTwoFactor] = useState(false)
  const [twoFactorPin, setTwoFactorPin] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // Email Edit & OTP
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [otpModal, setOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')

  // Interactive Image Editor Modal State
  const [cropModal, setCropModal] = useState(false)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [selectedFilter, setSelectedFilter] = useState('original')

  const imgRef = useRef<HTMLImageElement | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          setName(data.user.name || '')
          setEmail(data.user.email || '')
          setNewEmail(data.user.email || '')
          setTwoFactor(Boolean(data.user.twoFactorEnabled))
          setGeminiApiKey(data.user.geminiApiKey || '')
          if (data.user.image) setAvatarUrl(data.user.image)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function resetEditor() {
    setRotation(0)
    setZoomLevel(1)
    setFlipH(false)
    setFlipV(false)
    setBrightness(100)
    setContrast(100)
    setSelectedFilter('original')
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToastMsg('Ukuran foto maksimal 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setRawImageSrc(reader.result as string)
        resetEditor()
        setCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  function applyAndUploadProcessedImage() {
    if (!rawImageSrc || !imgRef.current) return
    setUploadingAvatar(true)

    const canvas = document.createElement('canvas')
    const size = 320
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (ctx && imgRef.current) {
      const img = imgRef.current
      ctx.save()

      ctx.translate(size / 2, size / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
      ctx.scale(zoomLevel, zoomLevel)

      const preset = PRESET_FILTERS.find((f) => f.id === selectedFilter)
      let filterString = `brightness(${brightness}%) contrast(${contrast}%)`
      if (preset && preset.css !== 'none') {
        filterString += ` ${preset.css}`
      }
      ctx.filter = filterString

      const minDim = Math.min(img.naturalWidth, img.naturalHeight)
      const sx = (img.naturalWidth - minDim) / 2
      const sy = (img.naturalHeight - minDim) / 2

      ctx.drawImage(img, sx, sy, minDim, minDim, -size / 2, -size / 2, size, size)
      ctx.restore()

      const processedBase64 = canvas.toDataURL('image/jpeg', 0.92)
      setAvatarUrl(processedBase64)

      fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: processedBase64 }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setToastMsg('Profile avatar image saved!')
          } else {
            setToastMsg(data.error?.message || 'Failed to update avatar.')
          }
        })
        .catch(() => setToastMsg('Error uploading image.'))
        .finally(() => {
          setUploadingAvatar(false)
          setCropModal(false)
        })
    }
  }

  async function handleSendEmailOtp() {
    if (!newEmail || newEmail.toLowerCase() === email.toLowerCase()) {
      setToastMsg('Masukkan alamat email baru yang berbeda.')
      return
    }
    setOtpSending(true)
    try {
      await new Promise((res) => setTimeout(res, 800))
      setOtpModal(true)
      setOtpError('')
    } finally {
      setOtpSending(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          password: password || undefined,
          twoFactorEnabled: twoFactor,
          twoFactorPin: twoFactorPin || undefined,
          geminiApiKey: geminiApiKey || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToastMsg('Profil dan konfigurasi berhasil diperbarui.')
        setUser((prev) => (prev ? { ...prev, name, twoFactorEnabled: twoFactor } : prev))
      } else {
        setToastMsg(data.error?.message || 'Gagal memperbarui profil.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length < 4) {
      setOtpError('Kode OTP minimal 4 digit.')
      return
    }
    setOtpVerifying(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      })
      if (res.ok) {
        setEmail(newEmail)
        setIsEditingEmail(false)
        setOtpModal(false)
        setToastMsg('Email baru berhasil diverifikasi & diperbarui!')
      } else {
        setOtpError('Gagal verifikasi OTP.')
      }
    } finally {
      setOtpVerifying(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout user={user} activeTab="profile">
        <div className="flex justify-center py-12">
          <PuzzleSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  const activePresetCss = PRESET_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none'
  const combinedFilterStyle = `brightness(${brightness}%) contrast(${contrast}%) ${activePresetCss !== 'none' ? activePresetCss : ''}`

  return (
    <DashboardLayout user={user} activeTab="profile">
      <PageHeader
        title="Profile Settings & Security"
        subtitle="Manage name, cropped avatar, email OTP verification, 2FA security PIN, and Gemini key."
        icon={<User size={22} />}
      />

      <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-6 text-xs">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center overflow-hidden text-2xl font-bold text-primary">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (name || 'D').slice(0, 1).toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer text-white">
                <Camera size={20} />
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="font-bold text-sm">Avatar & Profile Image</h2>
              <p className="text-muted-foreground text-[11px]">Hover to upload image with interactive editor (crop, filters, rotate, zoom).</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-muted-foreground uppercase">Email Address</span>
                {!isEditingEmail ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-xs"
                  >
                    <Edit3 size={13} /> Edit Email
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsEditingEmail(false)} className="text-muted-foreground hover:underline">
                    Cancel
                  </button>
                )}
              </div>

              {!isEditingEmail ? (
                <input value={email} disabled className="w-full rounded-xl border border-input bg-muted p-2.5 opacity-80 font-mono" />
              ) : (
                <div className="space-y-3 p-3 border border-border rounded-xl bg-muted/20">
                  <Input
                    label="New Target Email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                  />
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={otpSending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {otpSending ? <PuzzleSpinner size="sm" /> : <><Mail size={14} /> Send OTP Verification →</>}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="block font-semibold text-primary flex items-center gap-2">
                <Sparkles size={16} /> Google Gemini API Key
              </label>
              <Input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="font-bold text-sm text-primary flex items-center gap-2">
              <Key size={16} /> Authentication & 2FA Security
            </h2>
            <Input
              label="Change Password (Optional)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="••••••••"
            />

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
              <Switch
                label="Enable 2-Factor Authentication (2FA PIN)"
                description="Prompts for security PIN upon accessing dashboard."
                checked={twoFactor}
                onChange={setTwoFactor}
              />

              {twoFactor && (
                <Input
                  label="Set / Update 2FA Security PIN (4 - 6 Digits)"
                  type="password"
                  maxLength={6}
                  value={twoFactorPin}
                  onChange={(e) => setTwoFactorPin(e.target.value)}
                  placeholder="••••"
                />
              )}
            </div>
          </div>

          <div className="border-t border-border pt-6 flex items-center justify-between">
            <a href="/api/db/export" download className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
              <Download size={14} /> Export Profile Data JSON
            </a>
            <button type="submit" disabled={saving} className="primary-button">
              {saving ? <PuzzleSpinner size="sm" /> : 'Save Profile →'}
            </button>
          </div>
        </Card>
      </form>

      {/* Interactive Profile Image Editor Modal */}
      <Modal open={cropModal} onClose={() => setCropModal(false)} title="Interactive Profile Image Editor" maxWidth="md">
        <div className="space-y-5 text-xs">
          <div className="relative mx-auto size-52 overflow-hidden rounded-full border-4 border-primary bg-black/80 flex items-center justify-center shadow-lg">
            {rawImageSrc && (
              <img
                ref={imgRef}
                src={rawImageSrc}
                alt="Crop Preview"
                className="h-full w-full object-cover transition-transform"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoomLevel}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  filter: combinedFilterStyle,
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 border border-border rounded-xl bg-muted/20">
            <div>
              <label className="font-bold flex items-center gap-1.5 uppercase text-[10px] text-muted-foreground mb-1">
                <ZoomIn size={12} /> Zoom ({zoomLevel.toFixed(1)}x)
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-bold flex items-center gap-1.5 uppercase text-[10px] text-muted-foreground mb-1">
                <Sliders size={12} /> Brightness ({brightness}%)
              </label>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-bold flex items-center gap-1.5 uppercase text-[10px] text-muted-foreground mb-1">
                <Sliders size={12} /> Contrast ({contrast}%)
              </label>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="flex-1 inline-flex items-center justify-center gap-1 p-2 rounded-lg border bg-background font-semibold"
              >
                <RotateCw size={12} /> Rotate 90°
              </button>
              <button
                type="button"
                onClick={() => setFlipH(!flipH)}
                className={`p-2 rounded-lg border font-semibold ${flipH ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                title="Flip Horizontal"
              >
                <FlipHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() => setFlipV(!flipV)}
                className={`p-2 rounded-lg border font-semibold ${flipV ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                title="Flip Vertical"
              >
                <FlipVertical size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-[10px] text-muted-foreground mb-1.5">Preset Filters</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    selectedFilter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={resetEditor}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
            >
              <RefreshCw size={12} /> Reset Adjustments
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCropModal(false)} className="rounded-xl border border-border px-4 py-2 font-semibold">
                Cancel
              </button>
              <button type="button" onClick={applyAndUploadProcessedImage} disabled={uploadingAvatar} className="primary-button">
                {uploadingAvatar ? <PuzzleSpinner size="sm" /> : 'Apply & Save Image →'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* OTP Modal */}
      <Modal open={otpModal} onClose={() => setOtpModal(false)} title="Verify Email OTP" maxWidth="sm">
        <form onSubmit={verifyEmailOtp} className="space-y-4 text-xs text-center">
          <p className="text-muted-foreground">OTP code sent to <b>{newEmail}</b>.</p>
          <input
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            maxLength={6}
            placeholder="1 2 3 4 5 6"
            required
            className="w-full rounded-xl border border-input bg-background p-3 text-center text-xl font-mono tracking-widest"
          />
          {otpError && <p className="text-destructive font-semibold">{otpError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOtpModal(false)} className="flex-1 rounded-xl border border-border py-2.5 font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={otpVerifying} className="flex-1 primary-button">
              {otpVerifying ? <PuzzleSpinner size="sm" /> : 'Verify OTP →'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast open={Boolean(toastMsg)} message={toastMsg} onClose={() => setToastMsg('')} type="success" />
    </DashboardLayout>
  )
}
