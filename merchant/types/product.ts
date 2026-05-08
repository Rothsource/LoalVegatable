export type Unit = "units" | "kg" | "g";

export type Product = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  description: string;
  harvestDate: string;
  expireDate: string;
  profilePicUrl: string;
  backgroundPicUrls: string[];
  active: boolean;
  price: number;
};

export type FormState = {
  name: string;
  quantity: string;
  unit: Unit;
  description: string;
  harvestDate: string;
  expireDate: string;
  profilePicUrl: string;
  backgroundPicUrls: string[];
  active: boolean;
  price: string;
};

export type FormErrors = Partial<Record<keyof FormState, string>>;

export type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "warning";
};

export const EMPTY_FORM: FormState = {
  name: "",
  quantity: "",
  unit: "units",
  description: "",
  harvestDate: "",
  expireDate: "",
  profilePicUrl: "",
  backgroundPicUrls: ["", "", ""],
  active: true,
  price: "",
};

export const INITIAL_PRODUCTS: Product[] = [];