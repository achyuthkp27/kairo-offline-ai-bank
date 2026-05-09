/**
 * Kairo — shared input validation helpers
 */

const MAX_TRANSACTION_AMOUNT = 10_000_000;

export const validateMoneyAmount = (amount: number): string | null => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Amount must be a positive number';
  }
  if (amount > MAX_TRANSACTION_AMOUNT) {
    return 'Amount exceeds maximum limit of ₹1,00,00,000';
  }
  return null;
};

export const validateRecipientName = (recipientName: string): string | null => {
  if (!recipientName || typeof recipientName !== 'string' || recipientName.trim().length === 0) {
    return 'Recipient name is required';
  }
  return null;
};

export const validateCredentialUserId = (userId: string): string | null => {
  if (!userId || userId.trim().length < 4) {
    return 'User ID must be at least 4 characters.';
  }
  return null;
};

export const validateCredentialPassword = (password: string): string | null => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
};
