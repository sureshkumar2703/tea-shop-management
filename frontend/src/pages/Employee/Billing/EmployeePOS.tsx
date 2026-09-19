import React from "react";
import { BillingPOS } from "@/pages/Admin/Billing/BillingPOS";

export const EmployeePOS: React.FC = () => {
  return <BillingPOS isEmployeeView={true} />;
};
export default EmployeePOS;
