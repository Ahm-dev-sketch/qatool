import { defineTest } from "@qatool/core";
import { generateUser } from "@qatool/data-gen";

const mockUser = generateUser({ role: "tester" });

export default defineTest({
  id: "tc-data-001",
  name: "Data Gen — Dynamic Faker Test Fixture Seeding (Phase 4.5)",
  type: "api",
  tags: ["api", "faker", "data-gen"],
  steps: [
    {
      id: "s1",
      name: `POST /api/users with randomized payload (${mockUser.fullName})`,
      action: "http.request",
      payload: {
        method: "POST",
        url: "https://reqres.in/api/users",
        body: {
          name: mockUser.fullName,
          job: mockUser.role,
          email: mockUser.email,
        },
        extract: {
          createdId: "id",
        },
        assertions: [
          { id: "a1-1", type: "status", expected: 201 },
          { id: "a1-2", type: "jsonPathExists", path: "id" },
          { id: "a1-3", type: "jsonPath", path: "name", expected: mockUser.fullName },
          { id: "a1-4", type: "latency", maxMs: 4000 },
        ],
      },
    },
  ],
  assertions: [],
});
