import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FileUpload } from "../ui/FileUpload";
import { dataService } from "@/services/supabaseService";
import { Shop } from "@/types";

interface CreateShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newShop: Shop) => void;
}

export const CreateShopModal: React.FC<CreateShopModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsLoading(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const created = await dataService.createShop({
      name,
      slug,
      tagline,
      address,
      phone,
      email,
      gst_number: gstNumber,
      logo_url: logoUrl,
      currency: "INR",
      tax_rate: 5.0,
      subscription_status: "ACTIVE",
    });
    setIsLoading(false);
    onSuccess(created);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Provision New Tea Shop"
      description="Register a new store branch or franchisee on ChaiCraft"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Shop / Franchise Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chai Craft Indiranagar"
          required
        />
        <Input
          label="Tagline / Motto"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Irani Chai & Maskas"
        />
        <Input
          label="Complete Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 100ft Road, Indiranagar, Bangalore"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Contact Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 00000"
          />
          <Input
            label="Shop Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="indiranagar@chaicraft.in"
          />
        </div>
        <Input
          label="GSTIN Number (Optional)"
          value={gstNumber}
          onChange={(e) => setGstNumber(e.target.value)}
          placeholder="29ABCDE1234F1Z5"
        />

        <FileUpload
          label="Shop Logo / Store Picture (Tea-Shop-Images)"
          folder="shops"
          accept="image/*"
          value={logoUrl}
          onChange={setLogoUrl}
          helperText="Upload shop brand logo stored in Supabase bucket 'Tea-Shop-Images'"
        />

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
            Create Store
          </Button>
        </div>
      </form>
    </Modal>
  );
};
