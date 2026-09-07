import { faker } from "@faker-js/faker";

/**
 * Generate mock records matching a comma-separated key:type string specification.
 * e.g. "name:string,age:number,email:email,active:boolean"
 */
export function generateCustomRecords(
  fieldSpec: string,
  count = 5
): Array<Record<string, unknown>> {
  const fields = fieldSpec
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  return Array.from({ length: count }, () => {
    const record: Record<string, unknown> = {};

    for (const field of fields) {
      const [key, type = "string"] = field.split(":").map((s) => s.trim());
      record[key] = generateFieldVal(type);
    }

    return record;
  });
}

function generateFieldVal(type: string): unknown {
  switch (type.toLowerCase()) {
    case "email":
      return faker.internet.email().toLowerCase();
    case "name":
    case "fullname":
      return faker.person.fullName();
    case "firstname":
      return faker.person.firstName();
    case "lastname":
      return faker.person.lastName();
    case "uuid":
    case "id":
      return faker.string.uuid();
    case "number":
    case "int":
      return faker.number.int({ min: 1, max: 1000 });
    case "float":
    case "price":
      return parseFloat(faker.commerce.price({ min: 10, max: 500, dec: 2 }));
    case "boolean":
    case "bool":
      return faker.datatype.boolean();
    case "phone":
      return faker.phone.number();
    case "city":
      return faker.location.city();
    case "country":
      return faker.location.country();
    case "company":
      return faker.company.name();
    case "date":
      return faker.date.recent({ days: 60 }).toISOString();
    default:
      return faker.word.sample();
  }
}
