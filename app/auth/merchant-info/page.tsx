"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const provinces = [
  "Phnom Penh",
  "Siem Reap",
  "Battambang",
  "Kampong Cham",
  "Kandal",
  "Takeo",
  "Kampot",
  "Preah Sihanouk",
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CERTIFICATE_TYPES = [...IMAGE_TYPES, "application/pdf"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_CERTIFICATE_SIZE = 10 * 1024 * 1024;

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100";

type UploadFieldProps = {
  title: string;
  help: string;
  accept: string;
  files: File[];
  previews: string[];
  multiple?: boolean;
  buttonLabel: string;
  onSelect: (files: File[]) => void;
  onRemove: (index: number) => void;
};

function UploadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4a1 1 0 001 1h12a1 1 0 001-1v-4"
      />
    </svg>
  );
}

function UploadField({
  title,
  help,
  accept,
  files,
  previews,
  multiple = false,
  buttonLabel,
  onSelect,
  onRemove,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-xs text-gray-500">{help}</p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-green-600 px-3.5 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-100"
        >
          <UploadIcon />
          {files.length ? "Change" : buttonLabel}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            onSelect(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}`}
              className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
            >
              {previews[index] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[index]}
                  alt=""
                  className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-red-50 text-[10px] font-bold text-red-600">
                  PDF
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-800">{file.name}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">{formatFileSize(file.size)}</p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-left text-xs text-gray-500 transition hover:border-green-400 hover:bg-green-50"
        >
          No file selected. Click to browse.
        </button>
      )}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToPreview(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error(`Could not preview ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function validateFiles(files: File[], allowedTypes: string[], maxSize: number, maxCount: number) {
  if (files.length > maxCount) {
    return `Select no more than ${maxCount} file${maxCount > 1 ? "s" : ""}.`;
  }

  const invalidType = files.find((file) => !allowedTypes.includes(file.type));
  if (invalidType) return `${invalidType.name} is not a supported file type.`;

  const oversized = files.find((file) => file.size > maxSize);
  if (oversized) return `${oversized.name} is larger than ${formatFileSize(maxSize)}.`;

  return "";
}

export default function MerchantInfoPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [province, setProvince] = useState("");
  const [favVegetable, setFavVegetable] = useState("");
  const [profile, setProfile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState("");
  const [backgrounds, setBackgrounds] = useState<File[]>([]);
  const [backgroundPreviews, setBackgroundPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function selectProfile(files: File[]) {
    const validationError = validateFiles(files, IMAGE_TYPES, MAX_IMAGE_SIZE, 1);
    if (validationError) {
      setError(validationError);
      return;
    }

    const file = files[0] ?? null;
    setProfile(file);
    setProfilePreview(file ? await fileToPreview(file) : "");
    setError("");
  }

  async function selectBackgrounds(files: File[]) {
    const validationError = validateFiles(files, IMAGE_TYPES, MAX_IMAGE_SIZE, 3);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBackgrounds(files);
    setBackgroundPreviews(await Promise.all(files.map(fileToPreview)));
    setError("");
  }

  async function selectCertificate(files: File[]) {
    const validationError = validateFiles(
      files,
      CERTIFICATE_TYPES,
      MAX_CERTIFICATE_SIZE,
      1
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    const file = files[0] ?? null;
    setCertificate(file);
    setCertificatePreview(file ? await fileToPreview(file) : "");
    setError("");
  }

  async function uploadFile(file: File, path: string) {
    const { data, error: uploadError } = await supabase.storage
      .from("products-images")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("products-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!province) {
      setError("Please select a province.");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const profileUrl = profile
        ? await uploadFile(profile, `merchants/${user.id}/profile`)
        : null;
      const certificateUrl = certificate
        ? await uploadFile(certificate, `merchants/${user.id}/certificate`)
        : null;
      const backgroundUrls = await Promise.all(
        backgrounds.map((file, index) =>
          uploadFile(file, `merchants/${user.id}/background-${index}`)
        )
      );

      const { error: profileError } = await supabase.from("profile_merchants").upsert({
        id: user.id,
        full_name: fullName.trim(),
        community_name: communityName.trim(),
        province,
        fav_vegetable: favVegetable.trim(),
        profile_url: profileUrl,
        certificate_url: certificateUrl,
        background_urls: backgroundUrls,
        is_approved: false,
      });

      if (profileError) throw profileError;
      router.push("/auth/pending");
    } catch (submissionError: unknown) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while submitting your shop."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f3] px-4 py-8 text-gray-900 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-xs font-black text-white">
            LV
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">LocalVeg Merchant</p>
            <p className="text-xs text-gray-500">Complete your shop profile</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <header className="border-b border-gray-100 px-5 py-6 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">
              Merchant verification
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
              Tell us about your shop
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Complete the details below and submit your documents for admin approval.
            </p>
          </header>

          <div className="space-y-7 p-5 sm:p-7">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Shop details</h2>
                  <p className="mt-1 text-xs text-gray-500">Required fields are marked with *.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Full name *
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Dara Chan"
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Community name
                  </span>
                  <input
                    type="text"
                    value={communityName}
                    onChange={(event) => setCommunityName(event.target.value)}
                    placeholder="Green Farm Community"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Province *
                  </span>
                  <select
                    value={province}
                    onChange={(event) => setProvince(event.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select province...</option>
                    {provinces.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Favorite vegetable
                  </span>
                  <input
                    type="text"
                    value={favVegetable}
                    onChange={(event) => setFavVegetable(event.target.value)}
                    placeholder="Morning Glory"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-gray-100 pt-7">
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  Photos and verification
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Files upload only after you submit this form.
                </p>
              </div>

              <div className="space-y-3">
                <UploadField
                  title="Profile photo"
                  help="JPG, PNG, or WebP. Maximum 5 MB."
                  accept="image/jpeg,image/png,image/webp"
                  files={profile ? [profile] : []}
                  previews={profilePreview ? [profilePreview] : []}
                  buttonLabel="Choose file"
                  onSelect={selectProfile}
                  onRemove={() => {
                    setProfile(null);
                    setProfilePreview("");
                  }}
                />

                <UploadField
                  title="Business certificate"
                  help="PDF, JPG, or PNG. Maximum 10 MB."
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  files={certificate ? [certificate] : []}
                  previews={certificatePreview ? [certificatePreview] : []}
                  buttonLabel="Choose file"
                  onSelect={selectCertificate}
                  onRemove={() => {
                    setCertificate(null);
                    setCertificatePreview("");
                  }}
                />

                <UploadField
                  title="Shop background images"
                  help="Up to 3 shop, farm, or product images. Maximum 5 MB each."
                  accept="image/jpeg,image/png,image/webp"
                  files={backgrounds}
                  previews={backgroundPreviews}
                  multiple
                  buttonLabel="Choose images"
                  onSelect={selectBackgrounds}
                  onRemove={(index) => {
                    setBackgrounds((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    );
                    setBackgroundPreviews((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    );
                  }}
                />
              </div>
            </section>

            <footer className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-gray-500">
                You will be redirected to the approval page after submission.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-48 items-center justify-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit for approval"}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </main>
  );
}
