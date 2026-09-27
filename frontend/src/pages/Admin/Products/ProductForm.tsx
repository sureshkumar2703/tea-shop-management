import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { dataService } from "@/services/supabaseService";
import { storageService } from "@/services/storageService";
import { useAuthStore } from "@/stores/authStore";
import { Category, Product } from "@/types";
import { ArrowLeft, Sparkles, Scale, Package, CheckCircle2, Coffee, Trash2, Edit } from "lucide-react";

export const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { shop } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Unit Mode: QTY or WEIGHT (gm / kg)
  const [unitMode, setUnitMode] = useState<"QTY" | "WEIGHT">("QTY");
  const [weightUnit, setWeightUnit] = useState<"GM" | "KG">("GM");
  const [trackStock, setTrackStock] = useState<boolean>(false);
  const [stockQuantity, setStockQuantity] = useState("50");
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
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const cats = await dataService.getCategories(shop?.id);
      setCategories(cats);

      if (isEditMode && id) {
        const prod = await dataService.getProductById(id);
        if (prod) {
          setName(prod.name);
          setCategoryId(prod.category_id || "");
          const cat = cats.find((c) => c.id === prod.category_id) || null;
          setSelectedCategory(cat);

          setUnitMode(prod.unit_mode || "QTY");
          setWeightUnit(prod.weight_unit || "GM");
          const hasTrackedStock = prod.track_stock !== false && prod.stock_quantity !== undefined && prod.stock_quantity !== null;
          setTrackStock(hasTrackedStock);
          setStockQuantity(prod.stock_quantity?.toString() || "50");
          setAvailableWeight(prod.available_weight?.toString() || "1000");

          setStandardPrice(prod.base_price?.toString() || "");
          setRegularPrice(prod.regular_price?.toString() || prod.base_price?.toString() || "");
          setThirstyPrice(prod.thirsty_price?.toString() || "");
          setCostPrice(prod.cost_price?.toString() || "");

          setIsActive(prod.is_active !== false && prod.is_available !== false);
          setDescription(prod.description || "");
          setImageUrl(prod.image_url || "");
        }
      } else if (cats[0]) {
        setCategoryId(cats[0].id);
        setSelectedCategory(cats[0]);
      }
    };
    initData();
  }, [id, isEditMode, shop?.id]);

  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find((c) => c.id === catId) || null;
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

    const productPayload: Partial<Product> = {
      shop_id: shop?.id || "a1111111-1111-1111-1111-111111111111",
      name,
      category_id: categoryId,
      unit_mode: unitMode,
      weight_unit: weightUnit,
      track_stock: trackStock,
      is_unlimited: !trackStock,
      stock_quantity: trackStock && unitMode === "QTY" ? parseFloat(stockQuantity) || 0 : undefined,
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
              product_id: id || "",
              shop_id: shop?.id || "a1111111-1111-1111-1111-111111111111",
              name: "Regular",
              price: parseFloat(regularPrice) || 0,
              cost_price: parseFloat(costPrice) || 0,
              is_default: true,
            },
            {
              id: `v-thi-${Date.now()}`,
              product_id: id || "",
              shop_id: shop?.id || "a1111111-1111-1111-1111-111111111111",
              name: "Thirsty",
              price: parseFloat(thirstyPrice) || 0,
              cost_price: parseFloat(costPrice) || 0,
              is_default: false,
            },
          ]
        : [],
    };

    if (isEditMode && id) {
      await dataService.updateProduct(id, productPayload);
    } else {
      await dataService.createProduct(productPayload);
    }

    setIsLoading(false);
    navigate("/admin/products");
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm(`Are you sure you want to delete product "${name}"?`)) {
      setIsDeleting(true);
      await dataService.deleteProduct(id);
      setIsDeleting(false);
      navigate("/admin/products");
    }
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Coffee className="w-6 h-6 text-amber-500" />
              {isEditMode ? "Edit Menu Product" : "Add Menu Product"}
            </h1>
            <p className="text-xs text-slate-500">
              Configure dynamic pricing (Regular & Thirsty vs Standard), stock inventory tracking, and images
            </p>
          </div>
          {isEditMode && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Delete Item
            </Button>
          )}
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
                      {c.name}
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
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Ingredient cost (for gross margin estimation)
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
                      Uniform 1 Qty price per unit
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
                      Ingredient cost (for gross margin estimation)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC UNIT MEASUREMENT & STOCK TRACKING SECTION */}
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

              {/* Stock Tracking Toggle for Quantity Mode */}
              {unitMode === "QTY" && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="trackStockToggle"
                      className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      Track Stock Inventory for this Product
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {trackStock
                        ? "Limited Stock: Stock quantity reduces automatically on each POS bill (e.g. Bun / Ben, Samosa, packaged snacks)."
                        : "Unlimited Stock: Freshly made to order without inventory limits (e.g. Tea, Chai, Coffee)."}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      id="trackStockToggle"
                      checked={trackStock}
                      onChange={(e) => setTrackStock(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              )}

              {/* Conditional Display: Qty field vs Unlimited notice vs Weight fields */}
              {unitMode === "QTY" ? (
                trackStock ? (
                  <div>
                    <Input
                      label="Available Quantity (Stock in Cups / Pieces) *"
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="e.g. 50"
                      required
                    />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
                      ✓ Stock will automatically reduce by the ordered count whenever this item is billed
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Unlimited Stock Active — This item (e.g. freshly brewed Chai/Tea) has no piece limit and will never run out of stock.
                    </span>
                  </div>
                )
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
              label="Product Image (Optional)"
              folder={storageService.getShopFolder(shop?.shop_code || shop?.slug, "products")}
              accept="image/*"
              value={imageUrl}
              onChange={setImageUrl}
              helperText={`Optional image stored in folder 'shops/${shop?.shop_code || shop?.slug || "general"}/products' in Supabase`}
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
                {isEditMode ? "Update Product" : "Save Product Item"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default ProductForm;
