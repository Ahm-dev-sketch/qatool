import { faker } from "@faker-js/faker";

export interface FakeProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  sku: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  createdAt: string;
}

export interface GenerateProductOptions {
  category?: string;
  currency?: string;
}

export function generateProduct(options: GenerateProductOptions = {}): FakeProduct {
  const category =
    options.category ||
    faker.helpers.arrayElement([
      "Electronics",
      "Clothing",
      "Home & Kitchen",
      "Books",
      "Health & Personal Care",
      "Sports & Outdoors",
      "Software",
    ]);

  const price = parseFloat(faker.commerce.price({ min: 5, max: 999, dec: 2 }));
  const inStock = faker.datatype.boolean({ probability: 0.85 });

  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    category,
    price,
    currency: options.currency || "USD",
    sku: faker.string.alphanumeric({ length: 8, casing: "upper" }),
    inStock,
    stockQuantity: inStock ? faker.number.int({ min: 1, max: 500 }) : 0,
    rating: parseFloat((faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 })).toFixed(1)),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  };
}

export function generateProducts(count = 10, options: GenerateProductOptions = {}): FakeProduct[] {
  return Array.from({ length: count }, () => generateProduct(options));
}
