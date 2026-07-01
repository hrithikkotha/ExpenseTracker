export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  date: Date;
}
