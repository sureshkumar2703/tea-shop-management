import { create } from "zustand";
import { CashRegister, Datepay } from "@/types";
import { MOCK_CASH_REGISTER } from "@/services/mockData";
import { dataService } from "@/services/supabaseService";

interface RegisterState {
  currentRegister: CashRegister;
  todayDatepay: Datepay | null;
  isOpen: boolean;
  isLoading: boolean;
  openDrawer: (floatAmount: number, shopId?: string) => Promise<void>;
  openDayRegister: (shopId: string, floatAmount: number, notes?: string) => Promise<Datepay>;
  closeDayRegister: (shopId: string, actualCash: number, notes?: string) => Promise<Datepay>;
  recordSale: (amount: number, method: "CASH" | "UPI_QR" | "CARD") => void;
  recordCashMovement: (amount: number, type: "IN" | "OUT", note?: string) => void;
  closeDrawer: (actualCash: number, notes?: string) => Promise<void>;
  refreshRegister: (shopId?: string) => Promise<void>;
}

export const useRegisterStore = create<RegisterState>((set, get) => ({
  currentRegister: MOCK_CASH_REGISTER,
  todayDatepay: null,
  isOpen: false,
  isLoading: false,

  openDayRegister: async (shopId: string, floatAmount: number, notes = "") => {
    const today = new Date().toISOString().split("T")[0];
    const metrics = await dataService.calculateDayMetrics(shopId, today);
    const calculatedNet = floatAmount + metrics.billingTotal - metrics.expensesTotal - metrics.purchasesTotal;
    const estCash = floatAmount + metrics.billingCash + metrics.cashIn - metrics.expensesCash - metrics.purchasesCash - metrics.cashOut;

    const savedDp = await dataService.saveDatepay({
      shop_id: shopId,
      date: today,
      investment_amount: floatAmount,
      total_billing_cash: metrics.billingCash,
      total_billing_gpay: metrics.billingGpay,
      total_billing: metrics.billingTotal,
      total_expenses: metrics.expensesTotal + metrics.purchasesTotal,
      calculated_balance: calculatedNet,
      actual_closing_cash: estCash,
      status: "OPEN",
      notes: notes || "Daily opening float provided by owner",
    });

    const updatedReg: CashRegister = {
      ...get().currentRegister,
      id: `reg-${Date.now()}`,
      shop_id: shopId,
      status: "OPEN",
      opened_at: new Date().toISOString(),
      closed_at: undefined,
      opening_float: floatAmount,
      expected_cash: estCash,
      cash_sales: metrics.billingCash,
      upi_sales: metrics.billingGpay,
      card_sales: metrics.billingCard,
      cash_in: metrics.cashIn,
      cash_out: metrics.cashOut,
      actual_cash: undefined,
      difference: 0,
      notes: notes,
    };
    await dataService.updateRegister(updatedReg);

    set({
      todayDatepay: savedDp,
      currentRegister: updatedReg,
      isOpen: true,
    });
    return savedDp;
  },

  closeDayRegister: async (shopId: string, actualCash: number, notes = "") => {
    const today = new Date().toISOString().split("T")[0];
    const metrics = await dataService.calculateDayMetrics(shopId, today);
    const currentDp = get().todayDatepay;
    const invAmt = currentDp?.investment_amount || get().currentRegister.opening_float || 0;
    const calculatedNet = invAmt + metrics.billingTotal - metrics.expensesTotal - metrics.purchasesTotal;

    const closedDp = await dataService.saveDatepay({
      id: currentDp?.id,
      shop_id: shopId,
      date: today,
      investment_amount: invAmt,
      total_billing_cash: metrics.billingCash,
      total_billing_gpay: metrics.billingGpay,
      total_billing: metrics.billingTotal,
      total_expenses: metrics.expensesTotal + metrics.purchasesTotal,
      calculated_balance: calculatedNet,
      actual_closing_cash: actualCash,
      status: "CLOSED",
      notes: notes || currentDp?.notes || "Settled & Closed Day Register",
    });

    const reg = { ...get().currentRegister };
    const expected = reg.expected_cash || actualCash;
    const diff = actualCash - expected;

    const closedReg: CashRegister = {
      ...reg,
      status: "CLOSED",
      closed_at: new Date().toISOString(),
      actual_cash: actualCash,
      difference: diff,
      notes: notes ? `${reg.notes || ""}; Closing: ${notes}` : reg.notes,
    };
    await dataService.updateRegister(closedReg);

    set({
      todayDatepay: closedDp,
      currentRegister: closedReg,
      isOpen: false,
    });
    return closedDp;
  },

  openDrawer: async (floatAmount: number, shopId?: string) => {
    const sId = shopId || "a1111111-1111-1111-1111-111111111111";
    await get().openDayRegister(sId, floatAmount);
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
    const sId = get().todayDatepay?.shop_id || "a1111111-1111-1111-1111-111111111111";
    await get().closeDayRegister(sId, actualCash, notes);
  },

  refreshRegister: async (shopId?: string) => {
    const today = new Date().toISOString().split("T")[0];
    const sId = shopId || "a1111111-1111-1111-1111-111111111111";
    const todayDp = await dataService.getTodayDatepay(sId, today);
    const reg = await dataService.getActiveRegister(sId);

    const isCurrentlyOpen = todayDp?.status === "OPEN";

    set({
      todayDatepay: todayDp,
      currentRegister: {
        ...reg,
        opening_float: todayDp?.investment_amount ?? reg.opening_float,
        status: isCurrentlyOpen ? "OPEN" : "CLOSED",
      },
      isOpen: isCurrentlyOpen,
    });
  },
}));
