import { faker } from "@faker-js/faker";

export interface FakeUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "tester" | "user";
  avatar: string;
  createdAt: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface GenerateUserOptions {
  locale?: string;
  role?: "admin" | "manager" | "tester" | "user";
}

export function generateUser(options: GenerateUserOptions = {}): FakeUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();

  const roles: Array<FakeUser["role"]> = ["admin", "manager", "tester", "user"];
  const role = options.role || faker.helpers.arrayElement(roles);

  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    phone: faker.phone.number({ style: "international" }),
    role,
    avatar: faker.image.avatar(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode(),
    },
  };
}

export function generateUsers(count = 10, options: GenerateUserOptions = {}): FakeUser[] {
  return Array.from({ length: count }, () => generateUser(options));
}
