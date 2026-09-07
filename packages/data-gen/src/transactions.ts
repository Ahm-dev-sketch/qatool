import { faker } from "@faker-js/faker";

export interface FakeTransaction {
  id: string;
  transactionRef: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "refunded";
  paymentMethod: "credit_card" | "debit_card" | "bank_transfer" | "paypal" | "crypto";
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

export function generateTransaction(): FakeTransaction {
  const statuses: Array<FakeTransaction["status"]> = [
    "completed",
    "completed",
    "completed",
    "pending",
    "failed",
    "refunded",
  ];
  const methods: Array<FakeTransaction["paymentMethod"]> = [
    "credit_card",
    "debit_card",
    "bank_transfer",
    "paypal",
    "crypto",
  ];

  return {
    id: faker.string.uuid(),
    transactionRef: `TXN-${faker.string.alphanumeric({ length: 10, casing: "upper" })}`,
    amount: parseFloat(faker.finance.amount({ min: 10, max: 5000, dec: 2 })),
    currency: "USD",
    status: faker.helpers.arrayElement(statuses),
    paymentMethod: faker.helpers.arrayElement(methods),
    customerName: faker.person.fullName(),
    customerEmail: faker.internet.email().toLowerCase(),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
  };
}

export function generateTransactions(count = 10): FakeTransaction[] {
  return Array.from({ length: count }, () => generateTransaction());
}
