"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useDashboard } from "@/lib/dashboardContext";
import { validateProfilePhoto } from "@/lib/profilePhoto";
import { supabase } from "@/lib/supabase";
import { PageHeading } from "@/components/ui/PageHeading";

type Alert = { type: "success" | "error" | "warning"; message: string } | null;

type AccountForm = {
  fullName: string;
  communityName: string;
  email: string;
  province: string;
  favVegetable: string;
  password: string;
};

const INITIAL_ACCOUNT: AccountForm = {
  fullName: "Dara M.",
  communityName: "Green Farm Community",
  email: "dara.market@example.com",
  province: "Phnom Penh",
  favVegetable: "",
  password: "",
};

function inputClass(hasError = false) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 ${
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100"
  }`;
}

function label(text: string) {
  return <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{text}</label>;
}

async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Sign in first, then try this account action again.");
  }

  return { Authorization: `Bearer ${token}` };
}

export default function ProfilePage() {
  const { updateMerchantIdentity } = useDashboard();
  const [account, setAccount] = useState<AccountForm>(INITIAL_ACCOUNT);
  const [profileUrl, setProfileUrl] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profileRemoved, setProfileRemoved] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [alert, setAlert] = useState<Alert>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  useEffect(() => {
    let active = true;

    async function loadMerchant() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!active || !user) return;

      const [profileResult, statusResult] = await Promise.all([
        supabase
          .from("profile_merchants")
          .select("full_name, community_name, province, fav_vegetable, profile_url")
          .eq("id", user.id)
          .maybeSingle(),
        fetch(`/api/merchant/shop-status?merchantId=${user.id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (!active) return;

      const profile = profileResult.data;
      if (statusResult?.is_open !== undefined) {
        setIsOpen(Boolean(statusResult.is_open));
      }

      const savedProfileUrl = typeof profile?.profile_url === "string" ? profile.profile_url : "";
      const loadedFullName = profile?.full_name || INITIAL_ACCOUNT.fullName;

      setAccount((current) => ({
        ...current,
        fullName: loadedFullName,
        communityName: profile?.community_name || current.communityName,
        email: user.email ?? current.email,
        province: profile?.province || current.province,
        favVegetable: profile?.fav_vegetable || current.favVegetable,
      }));
      setProfileUrl(savedProfileUrl);
      setProfilePreview(savedProfileUrl);
      updateMerchantIdentity({ merchantName: loadedFullName, profileUrl: savedProfileUrl });
    }

    void loadMerchant();
    return () => {
      active = false;
    };
  }, [updateMerchantIdentity]);

  const canDelete = deletePhrase.trim() === "DELETE";

  function setAccountField<K extends keyof AccountForm>(key: K, value: AccountForm[K]) {
    setAccount((current) => ({ ...current, [key]: value }));
  }

  function selectProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateProfilePhoto(file);
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      return;
    }

    if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    const previewUrl = URL.createObjectURL(file);
    setProfileFile(file);
    setProfilePreview(previewUrl);
    setProfileRemoved(false);
    updateMerchantIdentity({ profileUrl: previewUrl });
    setAlert(null);
  }

  function removeProfilePhoto() {
    if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    setProfileFile(null);
    setProfilePreview("");
    setProfileRemoved(true);
    updateMerchantIdentity({ profileUrl: "" });
    setAlert(null);
  }

  async function uploadProfilePhoto(userId: string) {
    if (!profileFile) return profileRemoved ? "" : profileUrl;

    const path = `merchants/${userId}/profile`;
    const { error: uploadError } = await supabase.storage
      .from("products-images")
      .upload(path, profileFile, {
        upsert: true,
        contentType: profileFile.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("products-images").getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function updateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sign in first, then try updating your account again.");

      const nextProfileUrl = await uploadProfilePhoto(userData.user.id);
      const headers = await getAuthHeader();
      const response = await fetch("/api/merchant/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          fullName: account.fullName,
          communityName: account.communityName,
          email: account.email,
          province: account.province,
          favVegetable: account.favVegetable,
          password: account.password,
          profileUrl: nextProfileUrl,
        }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? "Could not update merchant account.");

      if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
      setAccountField("password", "");
      setProfileUrl(nextProfileUrl);
      setProfilePreview(nextProfileUrl);
      setProfileFile(null);
      setProfileRemoved(false);
      updateMerchantIdentity({
        merchantName: account.fullName.trim() || "Merchant",
        profileUrl: nextProfileUrl,
      });
      setAlert({
        type: result.warning ? "warning" : "success",
        message: result.warning ?? "Merchant account updated.",
      });
    } catch (error) {
      setAlert({ type: "error", message: error instanceof Error ? error.message : "Could not update account." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!canDelete) return;
    setDeleting(true);
    setAlert(null);

    try {
      const headers = await getAuthHeader();
      const response = await fetch("/api/merchant/account", {
        method: "DELETE",
        headers,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? "Could not delete merchant account.");

      await supabase.auth.signOut();
      setAlert({
        type: result.warning ? "warning" : "success",
        message: result.warning ?? "Merchant account deleted. You have been signed out.",
      });
      setDeletePhrase("");
    } catch (error) {
      setAlert({ type: "error", message: error instanceof Error ? error.message : "Could not delete account." });
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleShopStatus() {
    setTogglingStatus(true);
    const next = !isOpen;
    try {
      const headers = await getAuthHeader();
      const res = await fetch("/api/merchant/shop-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ isOpen: next }),
      });
      if (res.ok) {
        setIsOpen(next);
        setAlert({
          type: "success",
          message: next ? "Shop is now OPEN for customer orders." : "Shop is now CLOSED. Consumers will see 'Closed' status.",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Failed to update shop status." });
    } finally {
      setTogglingStatus(false);
    }
  }

  return (
    <div className="w-full">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        <PageHeading
          eyebrow="Merchant Settings"
          title="Farm Profile"
          description="Manage your farm shop identity, contact province, and account security."
        />

        {alert && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
              alert.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : alert.type === "warning"
                ? "bg-amber-50 border-amber-100 text-amber-700"
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            {alert.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <form onSubmit={updateAccount} className="bg-white rounded-[24px] border border-[#dfe6d9] card-shadow p-6 space-y-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)] mb-1">Identity & Location</p>
              <h2 className="text-lg font-black text-[var(--foreground)] font-heading">Merchant Account</h2>
              <p className="text-xs text-[#556353] mt-0.5">Edit shop and grower details shown across the community marketplace.</p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-green-600 text-3xl font-black text-white shadow-sm">
                {profilePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePreview}
                    alt={`${account.fullName || "Merchant"} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (account.fullName.trim().charAt(0).toUpperCase() || "M")
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">Profile photo</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  JPG, PNG, or WebP up to 5 MB. This photo appears in your merchant header.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="rounded-xl border border-green-200 bg-white px-4 py-2 text-xs font-bold text-green-700 transition hover:bg-green-50"
                  >
                    {profilePreview ? "Change photo" : "Choose photo"}
                  </button>
                  {profilePreview && (
                    <button
                      type="button"
                      onClick={removeProfilePhoto}
                      className="rounded-xl border border-red-100 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={selectProfilePhoto}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                {label("Full name")}
                <input
                  className={inputClass(!account.fullName)}
                  value={account.fullName}
                  onChange={(e) => setAccountField("fullName", e.target.value)}
                  required
                />
              </div>
              <div>
                {label("Community name")}
                <input
                  className={inputClass(!account.communityName)}
                  value={account.communityName}
                  onChange={(e) => setAccountField("communityName", e.target.value)}
                  required
                />
              </div>
              <div>
                {label("Email")}
                <input
                  type="email"
                  className={inputClass(!account.email)}
                  value={account.email}
                  onChange={(e) => setAccountField("email", e.target.value)}
                  required
                />
              </div>
              <div>
                {label("Province")}
                <input
                  className={inputClass()}
                  value={account.province}
                  onChange={(e) => setAccountField("province", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                {label("Favorite vegetable")}
                <input
                  className={inputClass()}
                  value={account.favVegetable}
                  onChange={(e) => setAccountField("favVegetable", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                {label("New password")}
                <input
                  type="password"
                  minLength={8}
                  className={inputClass()}
                  placeholder="Leave blank to keep current password"
                  value={account.password}
                  onChange={(e) => setAccountField("password", e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--leaf-dark)] hover:bg-[var(--leaf)] disabled:opacity-50 text-white text-sm font-bold px-6 py-3 rounded-xl transition shadow-sm cursor-pointer"
            >
              {saving ? (profileFile ? "Uploading and saving..." : "Saving...") : "Save Changes"}
            </button>
          </form>

          <div className="space-y-6">
            {/* Store Operations & Shop Open/Closed Status */}
            <section className="bg-white rounded-[24px] border border-[#dfe6d9] card-shadow p-6 space-y-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf-dark)] mb-1">Store Operations</p>
                <h2 className="text-base font-black text-[#182216] font-heading">Shop Operating Status</h2>
                <p className="text-xs text-[#556353] mt-0.5">
                  Control whether consumers can browse and place new vegetable orders from your farm.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#dfe6d9] bg-[#fafbf9]">
                <div className="flex items-center gap-3">
                  <span className={`w-3.5 h-3.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                  <div>
                    <p className={`text-sm font-black ${isOpen ? "text-emerald-900" : "text-neutral-700"}`}>
                      {isOpen ? "Shop is Open" : "Shop is Closed"}
                    </p>
                    <p className="text-[11px] text-[#647060]">
                      {isOpen ? "Accepting orders • Linked distributors online" : "Orders paused • Linked distributors offline"}
                    </p>
                  </div>
                </div>

                {/* Modern Interactive Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOpen}
                  onClick={handleToggleShopStatus}
                  disabled={togglingStatus}
                  className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isOpen ? "bg-emerald-600" : "bg-neutral-300"
                  } ${togglingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isOpen ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="text-[11px] text-[#71826d] leading-relaxed">
                ℹ️ <strong>Synchronized:</strong> When you toggle your shop open or closed, all your linked distributors are automatically synchronized.
              </p>
            </section>

            {/* Danger Zone */}
            <section className="bg-white rounded-[24px] border border-red-200 card-shadow p-6 space-y-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-600 mb-1">Danger Zone</p>
                <h2 className="text-base font-black text-red-600 font-heading">Delete Account</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently removes the merchant login. Type DELETE to confirm.
                </p>
              </div>
              <input
                className={inputClass()}
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                placeholder="DELETE"
              />
              <button
                type="button"
                disabled={!canDelete || deleting}
                onClick={deleteAccount}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold px-5 py-3 rounded-xl transition cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Merchant Account"}
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}