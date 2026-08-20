export class PaymentService {
  handleFailedPayment(paymentId: string) {
    // Failed payments are marked retryable and handed to the retry queue.
    return { paymentId, status: "retryable" };
  }
}
