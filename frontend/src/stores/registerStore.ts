import { create } from "zustand";
import { CashRegister } from "@/types";
import { MOCK_CASH_REGISTER } from "@/services/mockData";
import { dataService } from "@/services/supabaseService";

interface RegisterState {
  currentRegister: CashRegister;
  isOpen: boolean;
  isLoading: boolean;
  openDrawer: (floatAmount: number) => Promise<void>;
  recordSale: (amount: number, method: "CASH" | "UPI_QR" | "CARD") => void;
  recordCashMovement: (amount: number, type: "IN" | "OUT", note?: string) => void;
  closeDrawer: (actualCash: number, notes?: string) => Promise<void>;
  refreshRegister: () => Promise<void>;
}

export const useRegisterStore = create<RegisterState>((set, get) => ({
  currentRegister: MOCK_CASH_REGISTER,
  isOpen: MOCK_CASH_REGISTER.status === "OPEN",
  isLoading: false,

  openDrawer: async (floatAmount: number) => {
    const updated: CashRegister = {
      ...get().currentRegister,
      id: `reg-${Date.now()}`,
      status: "OPEN",
      opened_at: new Date().toISOString(),
      closed_at: undefined,
      opening_float: floatAmount,
      expected_cash: floatAmount,
      cash_sales: 0,
      upi_sales: 0,
      card_sales: 0,
      cash_in: 0,
      cash_out: 0,
      actual_cash: undefined,
      difference: 0,
    };
    await dataService.updateRegister(updated);
    set({ currentRegister: updated, isOpen: true });
  },

  recordSale: (amount: number, method: "CASH" | "UPI_QR" | "CARD") => {
    set((state) => {
      const reg = { ...state.currentRegister };
      if (method === "CASH") {
        reg.cash_sales = (reg.cash_sales || 0) + amount;
        reg.expected_cash = (reg.opening_float || 0) + reg.cash_sales + (reg.cash_in || 0) - (reg.cash_out || 0);
      } else if (method === "UPI_QR") {
        reg.upi_sales = (reg.upi_sales || 0) + amount;
      } else {
        reg.card_sales = (reg.card_sales || 0) + amount;
      }
      dataService.updateRegister(reg);
      return { currentRegister: reg };
    });
  },

  recordCashMovement: (amount: number, type: "IN" | "OUT", note = "") => {
    set((state) => {
      const reg = { ...state.currentRegister };
      if (type === "IN") {
        reg.cash_in = (reg.cash_in || 0) + amount;
      } else {
        reg.cash_out = (reg.cash_out || 0) + amount;
      }
      reg.expected_cash = (reg.opening_float || 0) + (reg.cash_sales || 0) + (reg.cash_in || 0) - (reg.cash_out || 0);
      if (note) reg.notes = `${reg.notes || ""}; ${type}: ${amount} (${note})`;
      dataService.updateRegister(reg);
      return { currentRegister: reg };
    });
  },

  closeDrawer: async (actualCash: number, notes = "") => {
    const reg = { ...get().currentRegister };
    const expected = reg.expected_cash || 0;
    const difference = actualCash - expected;

    const closed: CashRegister = {
      ...reg,
      status: "CLOSED",
      closed_at: new Date().toISOString(),
      actual_cash: actualCash,
      difference,
      notes: notes ? `${reg.notes || ""}; Closing: ${notes}` : reg.notes,
    };

    await dataService.updateRegister(closed);
    set({ currentRegister: closed, isOpen: false });
  },

  refreshRegister: async () => {
    const reg = await dataService.getActiveRegister();
    set({ currentRegister: reg, isOpen: reg.status === "OPEN" });
  },
}));
