export interface CartLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type DisplayState =
  | { view: "cart"; payload: { items: CartLine[]; subtotal: number; tax: number; discount: number; total: number } }
  | { view: "payment"; payload: { method: "CASH" | "CARD" | "UPI"; amount: number; upiId?: string } }
  | { view: "completion"; payload: { total: number } };
