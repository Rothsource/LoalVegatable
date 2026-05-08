"use client";
import { useRef, useState } from "react";
import { labelCls } from "@/lib/productHelpers";
import { Icons } from "./ProductIcons";
import { supabase } from "@/lib/supabase";

type Props = {
  label: string;
  preview: string;
  onFile: (url: string) => void;
  onClear: () => void;
  small?: boolean;
};

export function ImageUploadBox({ label, preview, onFile, onClear, small = false }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("products-images")
      .upload(path, file, { upsert: true });

    if (error) { console.error(error); setUploading(false); return; }

    const { data: urlData } = supabase.storage
      .from("products-images")
      .getPublicUrl(path);

    onFile(urlData.publicUrl);
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-1.5">
      <p className={labelCls}>{label}</p>
      <div
        onClick={() => !preview && !uploading && ref.current?.click()}
        className={`relative rounded-xl border-2 overflow-hidden bg-gray-50 flex items-center justify-center transition group
          ${preview
            ? "border-gray-200 cursor-default"
            : "border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 cursor-pointer"
          }
          ${small ? "h-24" : "h-40"}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Uploading...</span>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
                className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-100 transition"
              >
                Change
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-red-600 transition"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400 select-none">
            <Icons.Upload />
            <span className="text-xs font-semibold">Click to upload</span>
            <span className="text-[10px] text-gray-300">JPG, PNG, WebP · max 5 MB</span>
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}