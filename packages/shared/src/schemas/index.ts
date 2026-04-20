import { z } from "zod";

/** Chuyển object thành FormData để gọi server action */
export function objectToFormData(
  obj: Record<string, string | number | boolean | undefined | null>,
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    fd.append(key, String(value));
  }
  return fd;
}

// --- Login ---
export const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu").min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// --- Customer ---
export const customerSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().optional(),
  address: z.string().optional(),
  customerType: z.enum(["retail", "wholesale"]),
});
export type CustomerFormValues = z.infer<typeof customerSchema>;

// --- User ---
export const userSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  username: z
    .string()
    .min(1, "Vui lòng nhập tên đăng nhập")
    .regex(/^[a-zA-Z0-9._-]+$/, "Chỉ được nhập chữ cái, số, dấu chấm, gạch ngang và gạch dưới"),
  phone: z.string().optional(),
  // Internal staff roles: owner (shop owner), manager, staff
  role: z.enum(["owner", "manager", "staff"]),
});
export type UserFormValues = z.infer<typeof userSchema>;

/** Chỉnh sửa user (không có username) */
export const userEditSchema = userSchema.pick({
  fullName: true,
  phone: true,
  role: true,
});
export type UserEditFormValues = z.infer<typeof userEditSchema>;

// --- Category ---
export const categorySchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên danh mục"),
  parentId: z.string().optional().nullable(),
  description: z.string().optional(),
  displayOrder: z.number().min(0, "Thứ tự phải >= 0").optional(),
  isActive: z.boolean().optional(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

// --- Supplier ---
export const supplierSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên nhà cung cấp"),
  phone: z.string().optional(),
  email: z.union([z.string().email("Email không hợp lệ"), z.literal("")]).optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  note: z.string().optional(),
});
export type SupplierFormValues = z.infer<typeof supplierSchema>;

// --- Expense ---
export const expenseSchema = z.object({
  description: z.string().min(1, "Vui lòng nhập mô tả chi phí"),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  type: z.enum(["fixed", "variable"]),
  date: z.string().min(1, "Vui lòng chọn ngày"),
});
export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// --- Supplier Order (Add) ---
export const supplierOrderAddSchema = z.object({
  variantId: z.string().min(1, "Vui lòng chọn sản phẩm/biến thể"),
  supplierId: z.string().optional(),
  quantity: z.number().int().positive("Số lượng phải là số nguyên dương"),
  expectedDate: z.string().optional(),
  note: z.string().optional(),
});
export type SupplierOrderAddFormValues = z.infer<typeof supplierOrderAddSchema>;

// --- Supplier Order Status ---
export const supplierOrderStatusSchema = z.object({
  status: z.string().min(1, "Vui lòng chọn trạng thái"),
  actualCostPrice: z.string().optional(),
  expectedDate: z.string().optional(),
  note: z.string().optional(),
});
export type SupplierOrderStatusFormValues = z.infer<typeof supplierOrderStatusSchema>;

// --- Product (main fields only; variants handled separately) ---
export const productSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên sản phẩm"),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  basePrice: z.number().min(0, "Giá phải >= 0"),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});
export type ProductFormValues = z.infer<typeof productSchema>;
