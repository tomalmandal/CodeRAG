export class OrderService {
  async retryFailedOrder(orderId: string, attempts = 3) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try { return await this.process(orderId); } catch (error) { if (attempt === attempts) throw error; }
    }
  }
  private async process(orderId:string){ return {orderId,status:"processed"}; }
}
