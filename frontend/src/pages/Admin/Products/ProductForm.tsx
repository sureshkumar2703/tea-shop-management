import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { dataService } from "@/services/supabaseService";
import { storageService } from "@/services/storageService";
import { useAuthStore } from "@/stores/authStore";
import { Category, Product } from "@/types";
import { ArrowLeft, Sparkles, Scale, Package, CheckCircle2, Coffee } from "lucide-react";

export const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Unit Mode: QTY or WEIGHT (gm / kg)
  const [unitMode, setUnitMode] = useState<"QTY" | "WEIGHT">("QTY");
  const [weightUnit, setWeightUnit] = useState<"GM" | "KG">("GM");
  const [stockQuantity, setStockQuantity] = useState("100");
  const [availableWeight, setAvailableWeight] = useState("1000");

  // Pricing: Standard Price vs Regular & Thirsty Price
  const [standardPrice, setStandardPrice] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [thirstyPrice, setThirstyPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");

  // Status: Active / Inactive
  const [isActive, setIsActive] = useState(true);

  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dataService.getCategories().then((res) => {
      setCategories(res);
      if (res[0]) {
        setCategoryId(res[0].id);
        setSelectedCategory(res[0]);
      }
    });
  }, []);

  const handleCategorySelect = (id: string) => {
    setCategoryId(id);
    const cat = categories.find((c) => c.id === id) || null;
    setSelectedCategory(cat);
  };

  const isCategoryRegularThirsty = !!selectedCategory?.has_regular_thirsty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;

    // Validate prices based on category mode
    if (isCategoryRegularThirsty) {
      if (!regularPrice || !thirstyPrice) {
        alert("Please enter both Regular Price and Thirsty Price for this category.");
        return;
      }
    } else {
      if (!standardPrice) {
        alert("Please enter the Selling Price for this product.");
        return;
      }
    }

    setIsLoading(true);

    const basePriceNum = isCategoryRegularThirsty
      ? parseFloat(regularPrice) || 0
      : parseFloat(standardPrice) || 0;

    const newProductData: Partial<Product> = {
      name,
      category_id: categoryId,
      unit_mode: unitMode,
      weight_unit: weightUnit,
      stock_quantity: unitMode === "QTY" ? parseFloat(stockQuantity) || 0 : undefined,
      available_weight: unitMode === "WEIGHT" ? parseFloat(availableWeight) || 0 : undefined,
      price_mode: isCategoryRegularThirsty ? "REGULAR_THIRSTY" : "STANDARD",
      regular_price: isCategoryRegularThirsty ? parseFloat(regularPrice) || 0 : undefined,
      thirsty_price: isCategoryRegularThirsty ? parseFloat(thirstyPrice) || 0 : undefined,
      base_price: basePriceNum,
      cost_price: parseFloat(costPrice) || 0,
      description,
      image_url: imageUrl,
      is_available: isActive,
      is_active: isActive,
      variants: isCategoryRegularThirsty
        ? [
            {
              id: `v-reg-${Date.now()}`,
              product_id: "",
              shop_id: "",
              name: "Regular",
              price: parseFloat(regularPrice) || 0,
              is_default: true,
            },
            {
              id: `v-thi-${Date.now()}`,
              product_id: "",
              shop_id: "",
              name: "Thirsty",
              price: parseFloat(thirstyPrice) || 0,
              is_default: false,
            },
          ]
        : [],
    };

    await dataService.createProduct(newProductData);
    setIsLoading(false);
    navigate("/admin/products");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-500" />
            Add Menu Product
          </h1>
          <p className="text-xs text-slate-500">
            Configure dynamic pricing (Regular & Thirsty vs Standard) and unit mode (Quantity vs Gm/Kg Weight)
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Saffron Cardamom Chai"
                required
              />

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-medium"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.has_regular_thirsty ? "(Regular & Thirsty Enabled)" : "(Standard Price)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DYNAMIC PRICING SECTION BASED ON CATEGORY SELECTION */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Pricing Configuration
                </span>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  {isCategoryRegularThirsty
                    ? "✓ Category has Regular & Thirsty enabled"
                    : "Standard Single Price category"}
                </span>
              </div>

              {isCategoryRegularThirsty ? (
                /* Regular & Thirsty Inputs Display */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <Input
                      label="Regular Price (₹) *"
                      type="number"
                      step="0.01"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(e.target.value)}
                      placeholder="35"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Standard serving size price
                    </span>
                  </div>
                  <div>
                    <Input
                      label="Thirsty Price (₹) *"
                      type="number"
                      step="0.01"
                      value={thirstyPrice}
                      onChange={(e) => setThirstyPrice(e.target.value)}
                      placeholder="55"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Large / Extra-thirst serving price
                    </span>
                  </div>
                </div>
              ) : (
                /* Standard Price Input Display */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <Input
                      label="Selling Price (₹) *"
                      type="number"
                      step="0.01"
                      value={standardPrice}
                      onChange={(e) => setStandardPrice(e.target.value)}
                      placeholder="40"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Uniform price per unit
                    </span>
                  </div>
                  <div>
                    <Input
                      label="Estimated Cost Price (₹)"
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="15"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Ingredient cost (for gross margin)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC UNIT MEASUREMENT SECTION (QTY vs GM / KG) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-500" />
                  Unit & Inventory Measurement Mode
                </label>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setUnitMode("QTY")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                      unitMode === "QTY"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Qty Wise (Pieces / Cups)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitMode("WEIGHT")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                      unitMode === "WEIGHT"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Gm or Kg Wise (Weight)
                  </button>
                </div>
              </div>

              {/* Conditional Display: Qty field vs Gm / Kg fields */}
              {unitMode === "QTY" ? (
                <div>
                  <Input
                    label="Available Quantity (Stock in Cups / Pieces) *"
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="100"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Decrements by 1 for each order ticket item
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Weight Measurement Unit *
                    </label>
                    <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-medium"
                    >
                      <option value="GM">Grams (gm)</option>
                      <option value="KG">Kilograms (kg)</option>
                    </select>
                  </div>
                  <Input
                    label={`Available Stock Weight (in ${weightUnit}) *`}
                    type="number"
                    step="0.01"
                    value={availableWeight}
                    onChange={(e) => setAvailableWeight(e.target.value)}
                    placeholder={weightUnit === "GM" ? "5000" : "5.0"}
                    required
                  />
                </div>
              )}
            </div>

            {/* Active / Inactive Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Product Availability Status
                </span>
                <span className="text-[11px] text-slate-400">
                  {isActive ? "Visible on POS and billing register" : "Hidden from active billing"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300"
                  }`}
                >
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            </div>

            <Input
              label="Description & Recipe Notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh cow milk, freshly ground spices, infused over low heat"
            />

            <FileUpload
              label="Product Image (Tea-Shop-Images)"
              folder={storageService.getShopFolder(shop?.shop_code || shop?.slug, "products")}
              accept="image/*"
              value={imageUrl}
              onChange={setImageUrl}
              helperText={`Stored in folder 'shops/${shop?.shop_code || shop?.slug || "general"}/products' in Supabase`}
            />

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin/products")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Save Product Item
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default ProductForm;
