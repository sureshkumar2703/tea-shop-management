import React, { useState, useRef } from "react";
import { storageService, StorageFolder } from "@/services/storageService";
import { Upload, X, CheckCircle2, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label?: string;
  folder?: StorageFolder;
  accept?: string;
  maxSizeMB?: number;
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  helperText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = "Upload Image or Document",
  folder = "products",
  accept = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 10,
  value,
  onChange,
  className,
  helperText,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const bucketName = storageService.getBucketName();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError("");

    // Check size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit (${maxSizeMB}MB). Please choose a smaller file.`);
      return;
    }

    setFileName(file.name);
    setIsUploading(true);

    try {
      const result = await storageService.uploadFile(file, folder);
      onChange(result.url);
    } catch (err: any) {
      setError(err?.message || "Failed to upload file to storage.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = value && (value.startsWith("data:image") || /\.(jpg|jpeg|png|webp|svg|gif)($|\?)/i.test(value) || value.includes("/products/") || value.includes("/shops/"));

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            Bucket: <strong className="text-amber-600 dark:text-amber-400">{bucketName}</strong>
          </span>
        </div>
      )}

      {value ? (
        // Preview State
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 overflow-hidden transition-all group">
          <div className="flex items-center gap-3.5">
            {isImage ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700">
                <img
                  src={value}
                  alt="Uploaded preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    // Fallback to placeholder icon if load fails
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{fileName || "File uploaded to " + bucketName}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Path: /{folder}/{fileName || "stored-asset"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-[11px] font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  Change file
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Dropzone / Select state
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all",
            dragActive
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-white dark:bg-slate-900/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            {isUploading ? (
              <div className="flex flex-col items-center py-2">
                <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
                <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Uploading to {bucketName}...
                </p>
                <p className="text-[10px] text-slate-400">Please wait</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-2xl bg-amber-100/80 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Images or documents up to {maxSizeMB}MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
