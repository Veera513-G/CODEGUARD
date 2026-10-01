"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getInitials } from "@/lib/utils";
import { Shield, Mail, Calendar, User as UserIcon, Building, Globe, FileText, Save, Loader2, Database, Check } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [company, setCompany] = useState(user?.company || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [saving, setSaving] = useState(false);
  const [savedToFirebase, setSavedToFirebase] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setCompany(user.company || "");
      setWebsite(user.website || "");
    }
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedToFirebase(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, company, website }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update profile");
        return;
      }

      setUser(data.data.user);
      setSavedToFirebase(true);
      toast.success("Profile saved & updated in Firebase database!");
    } catch {
      toast.error("Network error. Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  const getProviderBadge = (provider?: string) => {
    if (provider === "GOOGLE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
          <Globe size={13} />
          Google Account
        </span>
      );
    }
    if (provider === "GITHUB") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium">
          <Shield size={13} />
          GitHub Account
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
        <Mail size={13} />
        Email Account
      </span>
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Account & Settings</h1>
        <p className="text-slate-400 text-sm">
          Manage your user profile and Firebase database storage preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name || "User Avatar"}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold shadow-md">
                {getInitials(user?.name, user?.email)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">{user?.name || "User"}</h2>
              <p className="text-slate-400 text-sm mb-1.5">{user?.email}</p>
              {getProviderBadge(user?.provider)}
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <Database size={13} />
              Firebase Synced
            </span>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserIcon size={14} className="text-blue-400" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building size={14} className="text-blue-400" />
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe size={14} className="text-blue-400" />
                Website URL
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-blue-400" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-400" />
              Bio / About Me
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little bit about yourself..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar size={14} />
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving to Firebase...
                </>
              ) : savedToFirebase ? (
                <>
                  <Check size={15} className="text-emerald-300" />
                  Saved to Firebase!
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Database & Storage Status */}
      <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-base">
          <Database size={18} className="text-blue-400" />
          Firebase Database Integration
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Google & GitHub authenticated profiles, user metadata, and subscription details are automatically persisted to your <strong className="text-slate-200">Firebase Firestore</strong> database.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium mb-1">Database Store</div>
            <div className="text-sm font-bold text-white">Firebase Firestore</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium mb-1">Auth Providers</div>
            <div className="text-sm font-bold text-white">Google & GitHub</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium mb-1">Subscription Plan</div>
            <div className="text-sm font-bold text-blue-400">{user?.subscription?.plan || "FREE"} Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
