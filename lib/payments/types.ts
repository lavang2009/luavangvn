export interface SePayWebhookEvent {
  externalId: string;
  amount: number;
  description: string;
  status: 'success' | 'failed' | 'pending';
  occurredAt: number;
  raw: unknown;
}

export interface NappayTopupResult {
  status: 'success' | 'pending' | 'failed' | 'rejected';
  providerReference: string;
  actualDenomination?: number;
  message?: string;
}
