import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { RunReport } from "./types.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function persistRun(report: RunReport): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Create the TestRun row
    const run = await tx.testRun.create({
      data: {
        id: report.runId,
        suiteDir: report.suiteDir,
        durationMs: report.durationMs,
        total: report.total,
        passed: report.passed,
        failed: report.failed,
        createdAt: report.startedAt,
      },
    });

    // 2. Create TestCase rows
    for (const tc of report.cases) {
      const caseRow = await tx.testCase.create({
        data: {
          runId: run.id,
          externalId: tc.id,
          name: tc.name,
          type: tc.type,
          tags: tc.tags,
          status: tc.status,
          flaky: tc.flaky ?? false,
          attempts: tc.attempts ?? 1,
          durationMs: tc.durationMs,
        },
      });

      // 3. Create TestStep rows
      for (const step of tc.steps) {
        const stepRow = await tx.testStep.create({
          data: {
            caseId: caseRow.id,
            externalId: step.id,
            name: step.name,
            status: step.status,
            durationMs: step.durationMs,
            error: step.error ?? null,
          },
        });

        // 4. Create AssertionResult rows
        for (const assertion of step.assertions) {
          await tx.assertionResult.create({
            data: {
              stepId: stepRow.id,
              externalId: assertion.id,
              type: assertion.type,
              expected:
                assertion.expected !== undefined
                  ? JSON.stringify(assertion.expected)
                  : null,
              actual: JSON.stringify(assertion.actual),
              pass: assertion.pass,
              message: assertion.message,
            },
          });
        }
      }
    }
  });

  console.log(`  💾 Run saved to database (id: ${report.runId})`);
  await prisma.$disconnect();
}
