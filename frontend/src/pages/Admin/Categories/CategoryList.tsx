import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { Category } from "@/types";
import { Plus, Boxes, Sparkles, CheckSquare, Square, Coffee } from "lucide-react";

export const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasRegularThirsty, setHasRegularThirsty] = useState(false);
  const [enableRegular, setEnableRegular] = useState(true);
  const [enableThirsty, setEnableThirsty] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    dataService.getCategories().then(setCategories);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const types: string[] = [];
    if (enableRegular) types.push("Regular");
    if (enableThirsty) types.push("Thirsty");

    const newCat = await dataService.createCategory({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description,
      has_regular_thirsty: hasRegularThirsty,
      regular_thirsty_types: hasRegularThirsty ? types : [],
      is_active: isActive,
    });

    setCategories([newCat, ...categories]);
    setName("");
    setDescription("");
    setHasRegularThirsty(false);
    setModalOpen(false);
  };

  const columns = [
    {
      key: "name",
      header: "Category Name",
      render: (c: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
            <span className="text-xs text-slate-400">{c.description || "No description"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "has_regular_thirsty",
      header: "Regular & Thirsty Sizing",
      render: (c: Category) =>
        c.has_regular_thirsty ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Regular & Thirsty Enabled</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Standard Price Only</span>
        ),
    },
    {
      key: "slug",
      header: "Identifier / Slug",
      render: (c: Category) => <span className="text-xs font-mono text-slate-500">{c.slug}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      render: (c: Category) => <Badge variant={c.is_active ? "success" : "danger"}>ACTIVE</Badge>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-6 h-6 text-amber-500" />
              Menu Categories
            </h1>
            <p className="text-xs text-slate-500">
              Organize tea brews, kulhad varieties, and snacks with Regular / Thirsty pricing options
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Add Category
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          searchKey="name"
          searchPlaceholder="Search menu categories..."
        />
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Menu Category" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kulhad Special Tea"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Slow-cooked authentic Assam leaf tea with roasted spices"
          />

          {/* Regular & Thirsty Checkbox Section */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRegularThirsty}
                onChange={(e) => setHasRegularThirsty(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Enable Regular & Thirsty Sizes for this Category
              </span>
            </label>
            <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
              When enabled, products under this category will automatically prompt for <strong>Regular Price</strong> and <strong>Thirsty Price</strong>.
            </p>

            {hasRegularThirsty && (
              <div className="flex gap-4 pt-2 pl-6 border-t border-amber-500/20">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableRegular}
                    onChange={(e) => setEnableRegular(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600"
                  />
                  <span>Regular Size</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableThirsty}
                    onChange={(e) => setEnableThirsty(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600"
                  />
                  <span>Thirsty Size</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</span>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-600">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span>Active on Menu</span>
            </label>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
export default CategoryList;
