# Office Hours Backend Coding Challenge

## Introduction

Thanks for your interest in joining the Office Hours engineering team! Before we proceed with more formal
interviews, we ask that all candidates submit a coding challenge. The coding challenge is a foundational
piece of our process and it's referenced later in our process during the technical interviews.

You should not expect to spend more than 1-2 hours on the challenge. We want to be respectful of your time,
so if you find yourself exceeding the suggested time limit, there's a chance you may be over-engineering your solution.

If at any point you have questions concerning the coding challenge and/or interview process, please do not
hesitate to email coding-challenge@officehours.com.

## Challenge Overview

The coding challenge is inspired by a real task our engineering team worked on: building out our system
for sending payments to advisors. This is a multi-step task that involves creating a payment and executing
a payment (initiating the sending of the funds through a vendor service e.g. Stripe).

This repo has all the scaffolding you'll need so you should be able to jump right in. When you fire up the dev
environment, the API will be accessible at http://localhost:3000. You can interact with it through cURL commands
to verify your implementation is working correctly.

The libraries and frameworks used mirror the stack we use at Office Hours:

- [Node.js](https://nodejs.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [Jest](https://jestjs.io/)
- [MongoDB](https://www.mongodb.com/)

You do not need to be an expert in any of the above to successfully complete the coding challenge.

## Challenge Details

**Your job is to implement two operations and their test suites: `createPayment` and `executePayment`**.
In order to do this, you will also need to expand the schema of the payment document that is stored in Mongo.

**createPayment**

This is the simpler of the two operations as it is already partially implemented. Your primary task here
is to implement a validation check and finish the test suite.

**executePayment**

This is where things get more interesting. The intent of this operation is to tell our payment vendor
to move `amount` cents to `recipient`. You can use `sendVendorPayment` (available from _src/scaffolding/vendor_)
for this. However, this is an asynchronous operation and we want to ensure there are protections in place
to avoid double sending the payment.

To implement this, you will need to expand the `PaymentDoc` schema. How you choose to do this is up to you.

## Getting Started

In order to get started, clone this repo to your local machine. You can then install the dependencies and
fire up the dev environment by running:

```
$ npm install
$ npm run dev
```

You can now access the API at http://localhost:3000.

Here are some cURL commands to help you interact with the API:

```
# create payment
$ curl --request POST \
  --header "Content-Type: application/json" \
  --data '{"recipient":"$RECIPIENT","amount": $AMOUNT}' \
  http://localhost:3000/payments

# execute payment
$ curl --request POST \
  http://localhost:3000/payments/$PAYMENT_ID/execute

# list all payments
$ curl http://localhost:3000/payments

# list one payments
$ curl http://localhost:3000/payments/$PAYMENT_ID
```

You should not modify the code in _src/scaffolding_. You should only need to modify the code in _src/operations_
and _src/types.ts_.

## Submission

To submit your coding challenge, ensure all of your changes have been committed to the `main` branch and
run the following command:

```
git bundle create coding-challenge.bundle HEAD main
```

This will generate a _coding-challenge.bundle_ file which you can then email to coding-challenge@officehours.com. We do our best
to review and respond to submissions within 1-2 business days.

Thanks for taking the time to do this coding challenge and here's hoping we talk soon!


# Design Details and Thought Process

For the testing suites, I took the liberty of adding additional tests and edge cases for different situations. I also confirmed myself that all test cases pass. Changes and additions are commented appropriately. 


I added a status field to types.ts and expanded the PaymentDocs schema, when keeping in mind that executePayment
remain an asychronous operation. Without tracking a status, we have no way to know
whether a payment has already been executed, whether it is currently being executed, or whether it failed.
  * No Status or Failed = Allow execution
  * Pending = Block in order to prevent a race condition (because they would be * processing the same data concurrently)
  * Succeeded = Block, to prevent double-sending

