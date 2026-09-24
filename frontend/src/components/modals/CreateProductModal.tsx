import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FileUpload } from "../ui/FileUpload";
import { Product, Category } from "@/types";
import { dataService } from "@/services/supabaseService";
import { storageService } from "@/services/storageService";
import { useAuthStore } from "@/stores/authStore";
import { Plus, Trash2 } from "lucide-react";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: (newProduct: Product) => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
}) => {
  const { shop } = useAuthStore();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [prepTime, setPrepTime] = useState("3");
  const [imageUrl, setImageUrl] = useState("");
  const [variants, setVariants] = useState<{ name: string; price: number }[]>([]);
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addVariant = () => {
    if (!variantName || !variantPrice) return;
    setVariants([...variants, { name: variantName, price: parseFloat(variantPrice) || 0 }]);
    setVariantName("");
    setVariantPrice("");
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrice) return;
    setIsLoading(true);

    const created = await dataService.createProduct({
      name,
      category_id: categoryId,
      sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      description,
      image_url: imageUrl,
      base_price: parseFloat(basePrice) || 0,
      cost_price: parseFloat(costPrice) || 0,
      preparation_time_minutes: parseInt(prepTime) || 3,
      variants: variants.map((v, i) => ({
        id: `v-${Date.now()}-${i}`,
        product_id: "",
        shop_id: "",
        name: v.name,
        price: v.price,
        is_default: i === 0,
      })),
    });

    setIsLoading(false);
    onSuccess(created);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Menu Item"
      description="Create a beverage or food item with optional sizing variants"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Item Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Saffron Cardamom Chai"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="SKU Code"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. CHAI-SAF-01"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Selling Price (₹) *"
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="40"
            required
          />
          <Input
            label="Cost / Food Cost (₹)"
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="12"
          />
          <Input
            label="Prep Time (mins)"
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="3"
          />
        </div>

        <Input
          label="Description & Recipe Notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Hand-crushed elaichi infused with pure milk"
        />

        <FileUpload
          label="Product Image (Tea-Shop-Images)"
          folder={storageService.getShopFolder(shop?.shop_code || shop?.slug, "products")}
          accept="image/*"
          value={imageUrl}
          onChange={setImageUrl}
          helperText={`Stored in folder 'shops/${shop?.shop_code || shop?.slug || "general"}/products' in Supabase`}
        />

        {/* Portions / Variants */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Portion Sizing Variants (Optional)
          </span>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
              placeholder="Variant name (e.g. Cutting Chai)"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
            />
            <input
              className="w-24 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
              type="number"
              placeholder="Price (₹)"
              value={variantPrice}
              onChange={(e) => setVariantPrice(e.target.value)}
            />
            <button
              type="button"
              onClick={addVariant}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {variants.length > 0 && (
            <div className="space-y-1 pt-1">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <span className="font-medium">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600">₹{v.price}</span>
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
            Save Item
          </Button>
        </div>
      </form>
    </Modal>
  );
};
