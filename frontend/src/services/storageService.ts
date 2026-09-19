import { supabase } from "@/lib/supabase";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/constants";

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export type StorageFolder =
  | "products"
  | "categories"
  | "shops"
  | "expenses"
  | "purchases"
  | "documents"
  | "avatars";

export const storageService = {
  /**
   * Returns the active Supabase bucket name ("Tea-Shop-Images")
   */
  getBucketName: () => SUPABASE_STORAGE_BUCKET,

  /**
   * Uploads an image or document to Supabase Storage bucket 'Tea-Shop-Images'
   * @param file The browser File object
   * @param folder Subfolder within the bucket (e.g., 'products', 'expenses', 'shops')
   */
  async uploadFile(file: File, folder: StorageFolder = "products"): Promise<UploadResult> {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.warn(`Supabase Storage (${SUPABASE_STORAGE_BUCKET}) upload notice:`, error.message);
        // Seamless fallback for local/demo offline testing
        const localPreview = await this.fileToDataUrl(file);
        return {
          url: localPreview,
          path: filePath,
          error: error.message,
        };
      }

      // Get public URL from Supabase Storage
      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
      };
    } catch (err: any) {
      console.warn("Storage upload exception, generating local preview:", err);
      const localPreview = await this.fileToDataUrl(file);
      return {
        url: localPreview,
        path: filePath,
        error: err?.message || "Storage error",
      };
    }
  },

  /**
   * Deletes a file from Supabase Storage bucket 'Tea-Shop-Images'
   * @param path The relative path inside the bucket
   */
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([path]);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  /**
   * Resolves the public URL for an asset path in the bucket
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Convert file to data URL for instantaneous client-side preview
   */
  fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  },
};
