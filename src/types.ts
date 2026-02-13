export type PaymentDoc = {
  _id: string;
  amount: number;
  recipient: string;
  status?: "PENDING" | "SUCCEEDED" | "FAILED";
  // Added a status field to track the state of the payment
  // this is keeping in mind the requirement that executePayment
  // remain an asynchronous operation and prevent race conditions
  
};
