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
  | "avatars"
  | (string & {});

export const storageService = {
  /**
   * Returns the active Supabase bucket name ("Tea-Shop-Images")
   */
  getBucketName: () => SUPABASE_STORAGE_BUCKET,

  /**
   * Generates a dynamic folder path for a specific shop code or slug
   * @param shopCode The shop code or slug (e.g., 'TEA-X8K92')
   * @param subfolder Optional subfolder (e.g., 'logo', 'qr', 'products', 'expenses')
   */
  getShopFolder(shopCode?: string, subfolder?: string): string {
    const cleanCode = (shopCode || "general").replace(/[^a-zA-Z0-9_-]/g, "_");
    if (subfolder) {
      return `shops/${cleanCode}/${subfolder}`;
    }
    return `shops/${cleanCode}`;
  },

  /**
   * Uploads an image or document to Supabase Storage bucket 'Tea-Shop-Images' under a dynamic folder
   * @param file The browser File object
   * @param folder Subfolder or dynamic path within the bucket (e.g., 'shops/TEA-X8K92', 'shops/TEA-X8K92/products')
   */
  async uploadFile(file: File, folder: StorageFolder = "products"): Promise<UploadResult> {
    const cleanFolder = folder
      .split("/")
      .map((segment) => segment.trim().replace(/[^a-zA-Z0-9_.-]/g, "_"))
      .filter(Boolean)
      .join("/");

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = cleanFolder ? `${cleanFolder}/${Date.now()}_${cleanFileName}` : `${Date.now()}_${cleanFileName}`;

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
