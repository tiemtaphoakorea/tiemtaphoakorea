// Mock data ported verbatim from the Tiệm Korea Admin CMS prototype.
// Used as placeholder content for the redesigned pages until each is wired
// to its existing TanStack Query hook in services/admin.client.ts.

import type { ThumbTone } from "./product-thumb";
import type { StatusType } from "./status-badge";

export type MockProduct = {
  id: string;
  name: string;
  cat: string;
  price: number;
  old: number;
  stock: number;
  status: StatusType;
  sold: number;
  rating: number;
  thumb: string;
  tone: ThumbTone;
};

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "SP001",
    name: "Mì cay Shin Ramyun Black thùng 20 gói",
    cat: "K-Food",
    price: 329000,
    old: 450000,
    stock: 142,
    status: "active",
    sold: 5210,
    rating: 4.9,
    thumb: "M",
    tone: "a",
  },
  {
    id: "SP002",
    name: "Mặt nạ Mediheal N.M.F Aquaring hộp 10 miếng",
    cat: "K-Beauty",
    price: 189000,
    old: 315000,
    stock: 68,
    status: "active",
    sold: 3840,
    rating: 4.8,
    thumb: "美",
    tone: "b",
  },
  {
    id: "SP003",
    name: "Trà sâm Hàn lon 240ml × 6",
    cat: "K-Drink",
    price: 119000,
    old: 183000,
    stock: 0,
    status: "outstock",
    sold: 1200,
    rating: 4.7,
    thumb: "茶",
    tone: "c",
  },
  {
    id: "SP004",
    name: "Soju Jinro Chamisul vị đào lốc 6 chai",
    cat: "K-Drink",
    price: 399000,
    old: 595000,
    stock: 23,
    status: "active",
    sold: 2980,
    rating: 4.9,
    thumb: "焼",
    tone: "d",
  },
  {
    id: "SP005",
    name: "Bánh Pepero Lotte vị dâu × 8 gói",
    cat: "K-Food",
    price: 169000,
    old: 230000,
    stock: 315,
    status: "active",
    sold: 980,
    rating: 4.6,
    thumb: "糖",
    tone: "e",
  },
  {
    id: "SP006",
    name: "Combo set ăn vặt Hàn 12 món hộp quà",
    cat: "Combo",
    price: 499000,
    old: 650000,
    stock: 54,
    status: "draft",
    sold: 212,
    rating: 5.0,
    thumb: "韓",
    tone: "a",
  },
  {
    id: "SP007",
    name: "COSRX Advanced Snail 96 Mucin Essence 100ml",
    cat: "K-Beauty",
    price: 289000,
    old: 420000,
    stock: 87,
    status: "active",
    sold: 1640,
    rating: 4.9,
    thumb: "膚",
    tone: "b",
  },
  {
    id: "SP008",
    name: "Bánh chocopie Orion hộp 12 cái",
    cat: "K-Food",
    price: 89000,
    old: 115000,
    stock: 201,
    status: "active",
    sold: 4210,
    rating: 4.7,
    thumb: "菓",
    tone: "e",
  },
];

export type MockOrder = {
  id: string;
  customer: string;
  phone: string;
  items: number;
  total: number;
  status: StatusType;
  date: string;
  addr: string;
};

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "#DH-20240501",
    customer: "Nguyễn Hương Giang",
    phone: "0901 234 567",
    items: 3,
    total: 829000,
    status: "delivering",
    date: "01/05 14:32",
    addr: "123 Lê Văn Sỹ, Q.3, HCM",
  },
  {
    id: "#DH-20240500",
    customer: "Trần Minh Khoa",
    phone: "0912 345 678",
    items: 1,
    total: 399000,
    status: "done",
    date: "01/05 12:15",
    addr: "45 Cầu Giấy, Hà Nội",
  },
  {
    id: "#DH-20240499",
    customer: "Phạm Thu Trang",
    phone: "0923 456 789",
    items: 5,
    total: 1249000,
    status: "done",
    date: "01/05 10:44",
    addr: "78 Nguyễn Trãi, Q.5, HCM",
  },
  {
    id: "#DH-20240498",
    customer: "Lê Đức Anh",
    phone: "0934 567 890",
    items: 2,
    total: 518000,
    status: "processing",
    date: "01/05 09:20",
    addr: "12 Hàng Bài, HN",
  },
  {
    id: "#DH-20240497",
    customer: "Hoàng Yến Nhi",
    phone: "0945 678 901",
    items: 4,
    total: 976000,
    status: "new",
    date: "01/05 08:55",
    addr: "56 Đinh Tiên Hoàng, Q.1, HCM",
  },
  {
    id: "#DH-20240496",
    customer: "Võ Quang Hải",
    phone: "0956 789 012",
    items: 2,
    total: 688000,
    status: "cancelled",
    date: "30/04 23:11",
    addr: "90 Trần Phú, Đà Nẵng",
  },
  {
    id: "#DH-20240495",
    customer: "Đặng Lan Anh",
    phone: "0967 890 123",
    items: 3,
    total: 757000,
    status: "delivering",
    date: "30/04 21:30",
    addr: "34 Lý Tự Trọng, Q.1, HCM",
  },
];

export type MockSupplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  debt: number;
  orders: number;
  status: StatusType;
};

export const MOCK_SUPPLIERS: MockSupplier[] = [
  {
    id: "NCC001",
    name: "Lotte Trading Korea",
    contact: "Park Joon-ho",
    email: "joonho@lotte.kr",
    debt: 12400000,
    orders: 34,
    status: "active",
  },
  {
    id: "NCC002",
    name: "CJ CheilJedang Vietnam",
    contact: "Trần Thị Lan",
    email: "lan@cj.vn",
    debt: 0,
    orders: 18,
    status: "active",
  },
  {
    id: "NCC003",
    name: "Amore Pacific HCM",
    contact: "Kim Soo-yeon",
    email: "sooyeon@amorepacific.com",
    debt: 5200000,
    orders: 9,
    status: "active",
  },
  {
    id: "NCC004",
    name: "Nong Shim Import VN",
    contact: "Lê Văn Minh",
    email: "minh@nongshim.vn",
    debt: 0,
    orders: 27,
    status: "inactive",
  },
];

export type MockStaff = {
  id: string;
  name: string;
  role: string;
  email: string;
  joined: string;
  status: StatusType;
  salary: number;
};

export const MOCK_STAFF: MockStaff[] = [
  {
    id: "NS001",
    name: "Nguyễn Thị Mai",
    role: "Quản lý kho",
    email: "mai.nguyen@tiemkorea.vn",
    joined: "12/01/2024",
    status: "active",
    salary: 12000000,
  },
  {
    id: "NS002",
    name: "Trần Văn Hùng",
    role: "Chăm sóc khách hàng",
    email: "hung.tran@tiemkorea.vn",
    joined: "23/02/2024",
    status: "active",
    salary: 10000000,
  },
  {
    id: "NS003",
    name: "Phạm Thị Hoa",
    role: "Marketing",
    email: "hoa.pham@tiemkorea.vn",
    joined: "05/11/2023",
    status: "active",
    salary: 13000000,
  },
  {
    id: "NS004",
    name: "Lê Đình Dũng",
    role: "Giao hàng",
    email: "dung.le@tiemkorea.vn",
    joined: "01/03/2024",
    status: "inactive",
    salary: 9000000,
  },
];

export type MockWarehouseItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  min: number;
  inMonth: number;
  outMonth: number;
  thumb: string;
  tone: ThumbTone;
};

export const MOCK_WAREHOUSE: MockWarehouseItem[] = [
  {
    id: "SP001",
    name: "Mì cay Shin Ramyun Black",
    unit: "thùng",
    stock: 142,
    min: 50,
    inMonth: 200,
    outMonth: 158,
    thumb: "M",
    tone: "a",
  },
  {
    id: "SP002",
    name: "Mặt nạ Mediheal Aquaring",
    unit: "hộp",
    stock: 68,
    min: 30,
    inMonth: 120,
    outMonth: 89,
    thumb: "美",
    tone: "b",
  },
  {
    id: "SP003",
    name: "Trà sâm Hàn 240ml",
    unit: "lốc",
    stock: 0,
    min: 20,
    inMonth: 60,
    outMonth: 60,
    thumb: "茶",
    tone: "c",
  },
  {
    id: "SP004",
    name: "Soju Jinro Chamisul",
    unit: "lốc",
    stock: 23,
    min: 30,
    inMonth: 80,
    outMonth: 69,
    thumb: "焼",
    tone: "d",
  },
  {
    id: "SP005",
    name: "Bánh Pepero Lotte",
    unit: "thùng",
    stock: 315,
    min: 100,
    inMonth: 500,
    outMonth: 362,
    thumb: "糖",
    tone: "e",
  },
  {
    id: "SP007",
    name: "COSRX Snail Essence",
    unit: "chai",
    stock: 87,
    min: 40,
    inMonth: 100,
    outMonth: 53,
    thumb: "膚",
    tone: "b",
  },
  {
    id: "SP008",
    name: "Bánh chocopie Orion",
    unit: "thùng",
    stock: 201,
    min: 80,
    inMonth: 300,
    outMonth: 184,
    thumb: "菓",
    tone: "e",
  },
];

export type DebtType = "ncc" | "kh";
export type MockDebt = {
  id: string;
  name: string;
  type: DebtType;
  amount: number;
  due: string;
  status: StatusType;
  note: string;
};

export const MOCK_DEBTS: MockDebt[] = [
  {
    id: "CN001",
    name: "Lotte Trading Korea",
    type: "ncc",
    amount: 12400000,
    due: "15/05/2024",
    status: "pending",
    note: "Lô hàng tháng 4",
  },
  {
    id: "CN002",
    name: "Amore Pacific HCM",
    type: "ncc",
    amount: 5200000,
    due: "20/05/2024",
    status: "pending",
    note: "Sản phẩm skincare",
  },
  {
    id: "CN003",
    name: "Nguyễn Hương Giang",
    type: "kh",
    amount: 829000,
    due: "03/05/2024",
    status: "overdue",
    note: "Đơn #DH-20240501",
  },
  {
    id: "CN004",
    name: "CJ CheilJedang VN",
    type: "ncc",
    amount: 8100000,
    due: "01/05/2024",
    status: "paid",
    note: "Mì & thực phẩm",
  },
  {
    id: "CN005",
    name: "Hoàng Yến Nhi",
    type: "kh",
    amount: 976000,
    due: "05/05/2024",
    status: "pending",
    note: "Đơn #DH-20240497",
  },
];

export type MockExpense = {
  id: string;
  name: string;
  cat: string;
  amount: number;
  date: string;
  status: StatusType;
};

export const MOCK_EXPENSES: MockExpense[] = [
  {
    id: "CP001",
    name: "Thuê kho bãi",
    cat: "Vận hành",
    amount: 15000000,
    date: "01/05",
    status: "paid",
  },
  {
    id: "CP002",
    name: "Lương nhân viên tháng 4",
    cat: "Nhân sự",
    amount: 44000000,
    date: "30/04",
    status: "paid",
  },
  {
    id: "CP003",
    name: "Chi phí vận chuyển",
    cat: "Logistics",
    amount: 3200000,
    date: "29/04",
    status: "paid",
  },
  {
    id: "CP004",
    name: "Marketing & quảng cáo",
    cat: "Marketing",
    amount: 8500000,
    date: "28/04",
    status: "paid",
  },
  {
    id: "CP005",
    name: "Điện nước văn phòng",
    cat: "Vận hành",
    amount: 2100000,
    date: "27/04",
    status: "paid",
  },
  {
    id: "CP006",
    name: "Thuê máy chủ & website",
    cat: "Công nghệ",
    amount: 1800000,
    date: "01/05",
    status: "pending",
  },
];

export type MockMessage = {
  id: number;
  name: string;
  last: string;
  time: string;
  unread: boolean;
};

export const MOCK_MESSAGES: MockMessage[] = [
  {
    id: 1,
    name: "Nguyễn Hương Giang",
    last: "Đơn hàng của tôi đã giao chưa ạ?",
    time: "14:32",
    unread: true,
  },
  { id: 2, name: "Trần Minh Khoa", last: "Cảm ơn shop nhiều nhé!", time: "12:15", unread: false },
  {
    id: 3,
    name: "Phạm Thu Trang",
    last: "Mặt nạ Mediheal còn hàng không ạ?",
    time: "10:44",
    unread: true,
  },
  { id: 4, name: "Lê Đức Anh", last: "Tôi muốn đổi sản phẩm", time: "09:20", unread: false },
  {
    id: 5,
    name: "Hoàng Yến Nhi",
    last: "Shop có ship toàn quốc không?",
    time: "08:55",
    unread: true,
  },
];

/** Vietnamese currency formatter — `199.000đ`. Accepts numeric strings (Postgres numeric serializes as `"670000.00"`). */
export const formatVnd = (n: number | string | null | undefined): string => {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "0đ";
  return `${num.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ`;
};
