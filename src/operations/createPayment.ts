import { getOnePayment } from "scaffolding/getOnePayment";
import { collections } from "scaffolding/mongo";
import { PaymentDoc } from "types";
import { v4 } from "uuid";

type Params = {
  amount: number;
  recipient: string;
};

export async function createPayment(params: Params): Promise<PaymentDoc> {
  // Edge case to catch if parameters are negative or not
  if (params.amount < 0) {
    throw new Error("amount must be non-negative");
  }

  // Validate recipient is not empty
  if (!params.recipient || params.recipient.trim() === "") {
    throw new Error("recipient is required");
  }

  const { insertedId } = await collections.payments.insertOne({
    _id: v4(),
    amount: params.amount,
    recipient: params.recipient,
  });

  return await getOnePayment(insertedId);
}
