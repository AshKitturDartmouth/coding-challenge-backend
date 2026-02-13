import { getOnePayment } from "scaffolding/getOnePayment";
import { collections } from "scaffolding/mongo";
import { sendVendorPayment } from "scaffolding/vendor/sendVendorPayment";
import { PaymentDoc } from "types";

export async function executePayment(id: string): Promise<PaymentDoc> {
  // Step 1: Fetch the payment to get recipient and amount
  const payment = await getOnePayment(id);

  // Step 2: Atomically mark as PENDING (prevents race conditions)
  // Only update if status is NOT already PENDING or SUCCEEDED
  const updateResult = await collections.payments.findOneAndUpdate(
    {
      _id: id,
      status: { $nin: ["PENDING", "SUCCEEDED"] },
    },
    { $set: { status: "PENDING" } },
    { returnDocument: "after" }
  );

  // If no document was updated, payment is already PENDING or SUCCEEDED
  if (!updateResult) {
    const currentPayment = await getOnePayment(id);
    if (currentPayment.status === "SUCCEEDED") {
      throw new Error("payment already executed");
    }
    throw new Error("payment execution already in progress");
  }

  // Step 3: Call vendor to process payment
  const result = await sendVendorPayment(payment.recipient, payment.amount);

  // Step 4: Update status based on vendor response
  const finalStatus = result.type === "SUCCEEDED" ? "SUCCEEDED" : "FAILED";
  await collections.payments.updateOne(
    { _id: id },
    { $set: { status: finalStatus } }
  );

  // Step 5: Return updated payment
  return await getOnePayment(id);
}
