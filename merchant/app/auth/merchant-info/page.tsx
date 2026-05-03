"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MerchantInfoPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [backgrounds, setBackgrounds] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBackgrounds = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) { setError("Max 3 background images."); return; }
    setBackgrounds(files);
  };

  const uploadFile = async (bucket: string, file: File, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    try {
      let profileUrl = null;
      let certificateUrl = null;
      let backgroundUrls: string[] = [];

      if (profile) {
        profileUrl = await uploadFile("merchant-profiles", profile, `${user.id}/profile`);
      }

      if (certificate) {
        certificateUrl = await uploadFile("merchant-certificates", certificate, `${user.id}/certificate`);
      }

      if (backgrounds.length > 0) {
        backgroundUrls = await Promise.all(
          backgrounds.map((file, i) =>
            uploadFile("merchant-backgrounds", file, `${user.id}/background-${i}`)
          )
        );
      }

      const { error } = await supabase.from("profile_merchants").upsert({
        id: user.id,
        profile_url: profileUrl,
        certificate_url: certificateUrl,
        background_urls: backgroundUrls,
      });

      if (error) throw error;

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center py-10">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Setup your shop</h1>
        <p className="text-gray-500 mb-6 text-sm">Upload your photos and certificate to get started.</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setProfile(e.target.files?.[0] || null)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Images (max 3)</label>
            <input type="file" accept="image/*" multiple onChange={handleBackgrounds} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Certificate</label>
            <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setCertificate(e.target.files?.[0] || null)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Saving..." : "Confirm & Go to Dashboard"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full text-sm text-gray-400 hover:underline text-center"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}