import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { useCartStore } from "@/stores/cartStore";
import { useRegisterStore } from "@/stores/registerStore";
import { useAuthStore } from "@/stores/authStore";
import { dataService } from "@/services/supabaseService";
import { Product, ProductVariant, Category, Order, CartItemAddon } from "@/types";
import { MOCK_ADDONS } from "@/services/mockData";
import { formatCurrency, generateOrderNumber } from "@/lib/utils";
import {
  Coffee,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  QrCode,
  Banknote,
  Percent,
  CheckCircle2,
  Sparkles,
  Scale,
  Package,
  Layers,
} from "lucide-react";

interface BillingPOSProps {
  isEmployeeView?: boolean;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({ isEmployeeView = false }) => {
  const { shop, user } = useAuthStore();
  const {
    items,
    customerName,
    customerPhone,
    orderType,
    discountAmount,
    discountReason,
    addItem,
    addCustomItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomerInfo,
    setOrderType,
    setDiscount,
    getSubtotal,
    getTaxAmount,
    getTotalAmount,
    getItemCount,
  } = useCartStore();

  const { recordSale } = useRegisterStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Product Selection & Customization Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedSizeVariant, setSelectedSizeVariant] = useState<"Regular" | "Thirsty">("Regular");
  const [selectedWeightGrams, setSelectedWeightGrams] = useState<number>(250);
  const [customWeightInput, setCustomWeightInput] = useState<string>("250");
  const [selectedAddons, setSelectedAddons] = useState<CartItemAddon[]>([]);

  // Checkout Payment Modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI_QR" | "SPLIT">("UPI_QR");
  const [receivedCash, setReceivedCash] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitGpay, setSplitGpay] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed Order for Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    dataService.getCategories().then(setCategories);
    dataService.getProducts().then(setProducts);
  }, []);

  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === "ALL" || prod.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleProductClick = (product: Product) => {
    const hasVariants = product.variants && product.variants.length > 0;
    const isRegularThirsty =
      product.price_mode === "REGULAR_THIRSTY" ||
      (!!product.regular_price && !!product.thirsty_price);
    const isWeight = product.unit_mode === "WEIGHT";

    if (hasVariants || isRegularThirsty || isWeight) {
      setSelectedProduct(product);
      setSelectedVariant(product.variants?.[0]);
      setSelectedSizeVariant("Regular");
      setSelectedWeightGrams(250);
      setCustomWeightInput("250");
      setSelectedAddons([]);
    } else {
      // Add directly with default pricing
      addItem(product, undefined, []);
    }
  };

  const handleConfirmCustomizedItem = () => {
    if (!selectedProduct) return;

    const isRegularThirsty =
      selectedProduct.price_mode === "REGULAR_THIRSTY" ||
      (!!selectedProduct.regular_price && !!selectedProduct.thirsty_price);
    const isWeight = selectedProduct.unit_mode === "WEIGHT";

    if (isWeight) {
      const grams = parseFloat(customWeightInput) || selectedWeightGrams || 100;
      const ratePerGram =
        selectedProduct.weight_unit === "KG"
          ? selectedProduct.base_price / 1000
          : selectedProduct.base_price;
      const itemPrice = Math.max(1, Math.round(grams * ratePerGram));

      addCustomItem({
        product: selectedProduct,
        unitMode: "WEIGHT",
        weightGrams: grams,
        variantName: `${grams}g Pack`,
        unitPrice: itemPrice,
        addons: selectedAddons,
      });
    } else if (isRegularThirsty) {
      const chosenPrice =
        selectedSizeVariant === "Thirsty"
          ? selectedProduct.thirsty_price || selectedProduct.base_price
          : selectedProduct.regular_price || selectedProduct.base_price;

      addCustomItem({
        product: selectedProduct,
        sizeVariant: selectedSizeVariant,
        variantName: selectedSizeVariant,
        unitPrice: chosenPrice,
        addons: selectedAddons,
      });
    } else {
      addItem(selectedProduct, selectedVariant, selectedAddons);
    }

    setSelectedProduct(null);
  };

  const toggleAddon = (addon: CartItemAddon) => {
    const exists = selectedAddons.some((a) => a.id === addon.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const openCheckoutModal = () => {
    const total = getTotalAmount();
    const half = Math.round(total / 2);
    setSplitCash(half.toString());
    setSplitGpay((total - half).toString());
    setReceivedCash(total.toString());
    setCheckoutModalOpen(true);
  };

  const handleApplySplitHalf = () => {
    const total = getTotalAmount();
    const half = Math.round(total / 2);
    setSplitCash(half.toString());
    setSplitGpay((total - half).toString());
  };

  const handleCompleteOrder = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    const subtotal = getSubtotal();
    const taxAmount = getTaxAmount();
    const totalAmount = getTotalAmount();
    const orderNumber = generateOrderNumber();

    let finalCash = 0;
    let finalGpay = 0;

    if (paymentMethod === "CASH") {
      finalCash = totalAmount;
      finalGpay = 0;
    } else if (paymentMethod === "UPI_QR") {
      finalCash = 0;
      finalGpay = totalAmount;
    } else if (paymentMethod === "SPLIT") {
      finalCash = parseFloat(splitCash) || 0;
      finalGpay = parseFloat(splitGpay) || 0;
      if (Math.abs(finalCash + finalGpay - totalAmount) > 1) {
        alert(`Split total (${finalCash + finalGpay}) must equal order total (${totalAmount}).`);
        setIsProcessing(false);
        return;
      }
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      shop_id: shop?.id || "a1111111-1111-1111-1111-111111111111",
      order_number: orderNumber,
      cashier_id: user?.id,
      customer_name: customerName || "Walk-in Guest",
      customer_phone: customerPhone || undefined,
      order_type: orderType,
      subtotal,
      tax_rate: 5.0,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      discount_reason: discountReason || undefined,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      cash_amount: finalCash,
      gpay_amount: finalGpay,
      is_split_payment: paymentMethod === "SPLIT",
      payment_status: "PAID",
      status: "COMPLETED",
      created_at: new Date().toISOString(),
      items: items.map((i, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        order_id: `ord-${Date.now()}`,
        product_id: i.productId,
        variant_id: i.variantId,
        product_name: i.name,
        variant_name: i.variantName,
        size_variant: i.sizeVariant,
        unit_mode: i.unitMode,
        weight_grams: i.weightGrams,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        subtotal: i.subtotal,
        addons: i.addons.map((a) => ({
          id: `oia-${a.id}`,
          order_item_id: `oi-${Date.now()}-${idx}`,
          addon_id: a.id,
          addon_name: a.name,
          price: a.price,
        })),
      })),
    };

    // Save order
    await dataService.createOrder(newOrder);

    // Record register intake
    recordSale(totalAmount, paymentMethod as any);

    setIsProcessing(false);
    setCheckoutModalOpen(false);
    clearCart();
    setCompletedOrder(newOrder);
    setReceiptModalOpen(true);
  };

  const LayoutWrapper = isEmployeeView ? EmployeeLayout : AdminLayout;

  // GPay QR code image from shop or dynamic API
  const gpayQrImage =
    shop?.gpay_qr_url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(
      shop?.slug || "chaicraft"
    )}%40okaxis%26pn%3D${encodeURIComponent(shop?.name || "ChaiCraft")}%26cu%3DINR`;

  return (
    <LayoutWrapper>
      <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-6rem)]">
        {/* Left Side: Menu Grid & Categories (65% width) */}
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1 relative">
              <Input
                icon={<Search className="w-4 h-4" />}
                placeholder="Search Chai, snacks, samosas by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs font-semibold text-slate-500">
              <span>{filteredProducts.length} Items Available</span>
            </div>
          </div>

          {/* Category Pills Slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === "ALL"
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400"
                }`}
              >
                <span>{cat.name}</span>
                {cat.has_regular_thirsty && (
                  <Sparkles className="w-3 h-3 text-amber-300" />
                )}
              </button>
            ))}
          </div>

          {/* Touch-Friendly Items Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((prod) => {
                const isRegularThirsty =
                  prod.price_mode === "REGULAR_THIRSTY" ||
                  (!!prod.regular_price && !!prod.thirsty_price);
                const isWeight = prod.unit_mode === "WEIGHT";

                return (
                  <button
                    key={prod.id}
                    onClick={() => handleProductClick(prod)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/80 dark:hover:border-amber-500/80 hover:shadow-md transition-all text-left flex flex-col justify-between group relative overflow-hidden active:scale-95"
                  >
                    {isRegularThirsty && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                          Reg / Thirsty
                        </span>
                      </div>
                    )}

                    {isWeight && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-0.5">
                          <Scale className="w-2.5 h-2.5" /> By Weight
                        </span>
                      </div>
                    )}

                    <div className="space-y-1 mt-1">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {prod.description || "Freshly brewed artisan delicacy"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div>
                        {isRegularThirsty ? (
                          <div className="text-[11px] font-bold text-amber-600">
                            ₹{prod.regular_price || prod.base_price} / ₹{prod.thirsty_price}
                          </div>
                        ) : isWeight ? (
                          <div className="text-[11px] font-bold text-emerald-600">
                            ₹{prod.base_price}/{prod.weight_unit || "gm"}
                          </div>
                        ) : (
                          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-['Outfit']">
                            {formatCurrency(prod.base_price)}
                          </div>
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Fast POS Billing Ticket (35% width) */}
        <Card className="w-full xl:w-96 flex flex-col h-full overflow-hidden p-0 border-slate-200 dark:border-slate-800 shadow-lg">
          {/* Order Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                  Active Ticket
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">{getItemCount()} items selected</span>
            </div>
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Dine In / Takeaway switch */}
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
            {(["DINE_IN", "TAKEAWAY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  orderType === type
                    ? "bg-white dark:bg-slate-800 text-amber-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {type === "DINE_IN" ? "Dine In" : "Takeaway"}
              </button>
            ))}
          </div>

          {/* Cart Item Rows */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Coffee className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold">Ticket is empty</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tap any beverage or snack on the menu to add
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                      {item.sizeVariant && (
                        <span className="text-[10px] font-bold text-amber-600 block">
                          Size: {item.sizeVariant}
                        </span>
                      )}
                      {item.weightGrams && (
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          Weight: {item.weightGrams}g
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      {formatCurrency(item.unitPrice)} each
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-rose-500 hover:text-rose-700 p-1 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ticket Footer & Total */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 shrink-0">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (GST 5%):</span>
                <span>{formatCurrency(getTaxAmount())}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Total:</span>
                <span className="text-amber-600 font-['Outfit']">
                  {formatCurrency(getTotalAmount())}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={items.length === 0}
              onClick={openCheckoutModal}
            >
              Collect Payment &bull; {formatCurrency(getTotalAmount())}
            </Button>
          </div>
        </Card>
      </div>

      {/* Item Customization Modal (Regular / Thirsty & Gm / Kg Weight) */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Configure: ${selectedProduct.name}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Case A: Regular & Thirsty Sizes */}
            {(selectedProduct.price_mode === "REGULAR_THIRSTY" ||
              (selectedProduct.regular_price && selectedProduct.thirsty_price)) && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Beverage Portion Size *
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSizeVariant("Regular")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      selectedSizeVariant === "Regular"
                        ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-xs block">Regular Size</span>
                    <span className="text-base font-black text-amber-600 mt-1 block font-['Outfit']">
                      {formatCurrency(selectedProduct.regular_price || selectedProduct.base_price)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSizeVariant("Thirsty")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      selectedSizeVariant === "Thirsty"
                        ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs block">Thirsty Size</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-base font-black text-amber-700 dark:text-amber-400 mt-1 block font-['Outfit']">
                      {formatCurrency(selectedProduct.thirsty_price || selectedProduct.base_price * 1.5)}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Case B: Gm or Kg Weight Selection */}
            {selectedProduct.unit_mode === "WEIGHT" && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    Select Weight in Grams
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Rate: ₹{selectedProduct.base_price}/{selectedProduct.weight_unit || "gm"}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[100, 250, 500, 1000].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        setSelectedWeightGrams(w);
                        setCustomWeightInput(w.toString());
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedWeightGrams === w
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700"
                      }`}
                    >
                      {w >= 1000 ? `${w / 1000} kg` : `${w}g`}
                    </button>
                  ))}
                </div>

                <div>
                  <Input
                    label="Custom Weight (Grams)"
                    type="number"
                    value={customWeightInput}
                    onChange={(e) => {
                      setCustomWeightInput(e.target.value);
                      setSelectedWeightGrams(parseFloat(e.target.value) || 0);
                    }}
                    placeholder="Enter weight in grams"
                  />
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-2">
                    <span>Computed Weight Price:</span>
                    <span className="text-base font-black">
                      {formatCurrency(
                        Math.max(
                          1,
                          Math.round(
                            (parseFloat(customWeightInput) || 0) *
                              (selectedProduct.weight_unit === "KG"
                                ? selectedProduct.base_price / 1000
                                : selectedProduct.base_price)
                          )
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Case C: Standard Portion Variants if present */}
            {selectedProduct.variants &&
              selectedProduct.variants.length > 0 &&
              selectedProduct.price_mode !== "REGULAR_THIRSTY" && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Serving Size
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedVariant?.id === v.id
                            ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold"
                            : "border-slate-200 dark:border-slate-700 text-slate-700"
                        }`}
                      >
                        <span className="text-xs block">{v.name}</span>
                        <span className="text-sm font-bold block mt-1">{formatCurrency(v.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Addons Selection */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Spices & Custom Add-ons
              </span>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_ADDONS.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <span>{addon.name}</span>
                      <span className="text-slate-400 font-semibold">+{formatCurrency(addon.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setSelectedProduct(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmCustomizedItem} className="flex-1">
                Add to Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3 PAYMENT MODES CHECKOUT MODAL (CASH, GPAY, BOTH/SPLIT) */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Collect Payment"
        description={`Ticket Total Due: ${formatCurrency(getTotalAmount())}`}
        size="md"
      >
        <div className="space-y-5">
          {/* 3 Payment Modes Tab Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "CASH", label: "Cash Only", icon: <Banknote className="w-5 h-5 text-emerald-500" /> },
              { id: "UPI_QR", label: "Google Pay (GPay)", icon: <QrCode className="w-5 h-5 text-amber-500" /> },
              { id: "SPLIT", label: "Both (Cash + GPay)", icon: <Layers className="w-5 h-5 text-blue-500" /> },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === method.id
                    ? "border-amber-500 bg-amber-500/10 font-bold text-slate-900 dark:text-white ring-1 ring-amber-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {method.icon}
                <span className="text-xs">{method.label}</span>
              </button>
            ))}
          </div>

          {/* PAYMENT MODE 1: CASH */}
          {paymentMethod === "CASH" && (
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <Input
                label="Cash Received from Customer (₹) *"
                type="number"
                value={receivedCash}
                onChange={(e) => setReceivedCash(e.target.value)}
                placeholder={getTotalAmount().toString()}
              />
              <div className="flex gap-2">
                {[100, 200, 500, 1000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setReceivedCash(quick.toString())}
                    className="flex-1 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  >
                    ₹{quick}
                  </button>
                ))}
              </div>
              {parseFloat(receivedCash) >= getTotalAmount() && (
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex justify-between">
                  <span>Change to Return:</span>
                  <span className="text-sm font-black font-['Outfit']">
                    {formatCurrency(parseFloat(receivedCash) - getTotalAmount())}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PAYMENT MODE 2: GOOGLE PAY (GPAY) */}
          {paymentMethod === "UPI_QR" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-center space-y-3">
              <div className="w-40 h-40 mx-auto bg-white p-2 rounded-2xl border border-amber-200 shadow-md flex items-center justify-center">
                <img
                  src={gpayQrImage}
                  alt="Shop GPay QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Scan with Google Pay, PhonePe, Paytm, or any UPI App
                </p>
                <p className="text-sm font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  Amount: {formatCurrency(getTotalAmount())}
                </p>
              </div>
            </div>
          )}

          {/* PAYMENT MODE 3: BOTH (CASH + GPAY SPLIT) */}
          {paymentMethod === "SPLIT" && (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Split Payment Breakdown
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleApplySplitHalf}
                >
                  Both Half (50 / 50)
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    label="Cash Amount (₹) *"
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplitCash(val);
                      const diff = getTotalAmount() - (parseFloat(val) || 0);
                      setSplitGpay(Math.max(0, diff).toString());
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Input
                    label="GPay Amount (₹) *"
                    type="number"
                    value={splitGpay}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplitGpay(val);
                      const diff = getTotalAmount() - (parseFloat(val) || 0);
                      setSplitCash(Math.max(0, diff).toString());
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Real-time Allocation Check */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Allocated / Total:</span>
                <span
                  className={`font-bold ${
                    Math.abs((parseFloat(splitCash) || 0) + (parseFloat(splitGpay) || 0) - getTotalAmount()) <= 1
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {formatCurrency((parseFloat(splitCash) || 0) + (parseFloat(splitGpay) || 0))} / {formatCurrency(getTotalAmount())}
                </span>
              </div>

              {/* Show GPay QR for the GPay portion */}
              {parseFloat(splitGpay) > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-center space-y-2">
                  <div className="w-28 h-28 mx-auto bg-white p-1 rounded-xl border flex items-center justify-center">
                    <img src={gpayQrImage} alt="GPay QR" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Scan to pay GPay portion: {formatCurrency(parseFloat(splitGpay) || 0)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Input
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerInfo(e.target.value, customerPhone)}
              placeholder="Walk-in Guest"
            />
            <Input
              label="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerInfo(customerName, e.target.value)}
              placeholder="+91 98765 00000"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setCheckoutModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCompleteOrder}
              isLoading={isProcessing}
              className="flex-1"
            >
              Complete Sale & Print
            </Button>
          </div>
        </div>
      </Modal>

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        order={completedOrder}
        shop={shop}
      />
    </LayoutWrapper>
  );
};
export default BillingPOS;
