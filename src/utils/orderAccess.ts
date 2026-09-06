export function phoneLastFourDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
}

export function verifyOrderPhoneAccess(storedPhone: string, userInput: string): boolean {
  if (!storedPhone?.trim() || !userInput?.trim()) return false;
  return phoneLastFourDigits(storedPhone) === phoneLastFourDigits(userInput);
}
