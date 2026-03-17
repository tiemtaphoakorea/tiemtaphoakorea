export const TEST_USERS = {
  admin: {
    username: "admin",
    password: "password123",
  },
  staff: {
    username: "staff",
    password: "password123",
  },
  manager: {
    username: "manager",
    password: "password123",
  },
  disabled: {
    username: "disabled_admin",
    password: "password123",
  },
  customerLogin: {
    username: "customer_login",
    password: "password123",
  },
};

export const TEST_CUSTOMERS = {
  primary: {
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    customerCode: "CUS001",
  },
};

export const TEST_PRODUCTS = {
  basicTee: {
    name: "Basic Tee",
    slug: "basic-tee",
    skuInStock: "E2E-BASIC-RED",
    skuOutOfStock: "E2E-BASIC-BLUE",
  },
  preorder: {
    name: "Preorder Tee",
    slug: "preorder-tee",
    sku: "E2E-PRE-01",
  },
  testTshirt: {
    name: "Test T-Shirt",
    slug: "test-tshirt",
    sku: "E2E-TS-01",
  },
  duplicateSku: {
    sku: "ABC-30",
  },
  lowStock: {
    name: "Low Stock Item",
    slug: "low-stock-item",
    sku: "E2E-LOW-01",
  },
  inactive: {
    name: "Inactive Product",
    slug: "inactive-product",
  },
};
