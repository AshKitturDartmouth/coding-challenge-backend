import { expect, it } from "@jest/globals";
import { createPayment } from "./createPayment";
import { executePayment } from "./executePayment";
import { collections } from "scaffolding/mongo";

// Test #1: Verify that executePayment successfully calls vendor and updates status
it("executes payment through vendor interface", async () => {
  // Create a payment with amount that will succeed (not 600-699)
  const payment = await createPayment({
    recipient: "test@example.com",
    amount: 500,
  });

  // Execute the payment
  const executed = await executePayment(payment._id);

  // Verify status was updated to SUCCEEDED
  expect(executed.status).toBe("SUCCEEDED");
  
  // Verify in database
  const fromDb = await collections.payments.findOne({ _id: payment._id });
  expect(fromDb?.status).toBe("SUCCEEDED");
});

// Test #2: Verify that failed payments can be retried
it("allows failed payments to be re-executed", async () => {
  // Create a payment with amount that will fail (600-699)
  const payment = await createPayment({
    recipient: "test@example.com",
    amount: 650,
  });

  // First execution should fail
  const firstExecution = await executePayment(payment._id);
  expect(firstExecution.status).toBe("FAILED");

  // Update amount to one that will succeed
  await collections.payments.updateOne(
    { _id: payment._id },
    { $set: { amount: 500 } }
  );

  // Second execution should succeed (retry is allowed)
  const secondExecution = await executePayment(payment._id);
  expect(secondExecution.status).toBe("SUCCEEDED");
});

// Test #3: Verify that successful payments cannot be executed again
it("prevents successful payments from being executed again", async () => {
  // Create and execute a payment that will succeed
  const payment = await createPayment({
    recipient: "test@example.com",
    amount: 500,
  });

  await executePayment(payment._id);

  // Try to execute again - should throw error
  await expect(executePayment(payment._id)).rejects.toThrow(
    "payment already executed"
  );

  // Verify status is still SUCCEEDED
  const fromDb = await collections.payments.findOne({ _id: payment._id });
  expect(fromDb?.status).toBe("SUCCEEDED");
});

// Test #4: Verify that concurrent executions are prevented via atomic update
it("prevents concurrent executions of payment", async () => {
  // Create a payment
  const payment = await createPayment({
    recipient: "test@example.com",
    amount: 500,
  });

  // Start two executions concurrently
  const [result1, result2] = await Promise.allSettled([
    executePayment(payment._id),
    executePayment(payment._id),
  ]);

  // One should succeed, one should fail
  const succeeded = [result1, result2].filter((r) => r.status === "fulfilled");
  const failed = [result1, result2].filter((r) => r.status === "rejected");

  expect(succeeded).toHaveLength(1);
  expect(failed).toHaveLength(1);

  // The failed one should have the right error message
  if (failed[0].status === "rejected") {
    expect(failed[0].reason.message).toMatch(
      /payment (already executed|execution already in progress)/
    );
  }

  // Final status should be SUCCEEDED
  const fromDb = await collections.payments.findOne({ _id: payment._id });
  expect(fromDb?.status).toBe("SUCCEEDED");
});

// Test #5: Verify that executePayment throws error for non-existent payment ID
it("errors if payment does not exist", async () => {
  const fakeId = "non-existent-id-12345";

  await expect(executePayment(fakeId)).rejects.toThrow("not found");
});

// Test #6: Verify that executePayment works with zero amount payments
it("executes payment with zero amount", async () => {
  const payment = await createPayment({
    recipient: "test@example.com",
    amount: 0,
  });

  const executed = await executePayment(payment._id);

  // Zero amount payments should succeed (vendor doesn't fail for 0)
  expect(executed.status).toBe("SUCCEEDED");
});
