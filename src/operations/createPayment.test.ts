import { expect, it } from "@jest/globals";
import { createPayment } from "./createPayment";
import { collections } from "scaffolding/mongo";

// Test #1: Verify that createPayment successfully creates and persists a payment to the database
it("persists payment", async () => {
  const payment = await createPayment({
    recipient: "test@example.com",
    amount: 100,
  });

  // Check returned payment has correct properties
  expect(payment._id).toBeDefined();
  expect(payment.amount).toBe(100);
  expect(payment.recipient).toBe("test@example.com");

  // Verify it's actually saved in the database
  const fromDb = await collections.payments.findOne({ _id: payment._id });
  expect(fromDb).toBeDefined();
  expect(fromDb?.amount).toBe(100);
});

// Test #2: Verify that createPayment rejects payments with negative amounts
it("errors if negative amount", async () => {
  await expect(
    createPayment({
      recipient: "test@example.com",
      amount: -50,
    })
  ).rejects.toThrow("amount must be non-negative");
});

// Test #3: Verify that createPayment accepts zero amount payments
it("allows zero amount payment", async () => {
  const payment = await createPayment({
    recipient: "test@example.com",
    amount: 0,
  });

  expect(payment.amount).toBe(0);
  expect(payment.recipient).toBe("test@example.com");
});

// Test #4: Verify that createPayment rejects empty recipient
it("errors if empty recipient", async () => {
  await expect(
    createPayment({
      recipient: "",
      amount: 100,
    })
  ).rejects.toThrow("recipient is required");
});

// Test #5: Verify that createPayment rejects whitespace-only recipient
it("errors if whitespace-only recipient", async () => {
  await expect(
    createPayment({
      recipient: "   ",
      amount: 100,
    })
  ).rejects.toThrow("recipient is required");
});
