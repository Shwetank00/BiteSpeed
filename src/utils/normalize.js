function normalizeInput({ email, phoneNumber }) {
  let normalizedEmail = null;
  let normalizedPhone = null;

  if (email !== undefined && email !== null) {
    const trimmed = String(email).trim().toLowerCase();
    if (trimmed !== '') {
      normalizedEmail = trimmed;
    }
  }

  if (phoneNumber !== undefined && phoneNumber !== null) {
    const trimmed = String(phoneNumber).trim();
    if (trimmed !== '') {
      normalizedPhone = trimmed;
    }
  }

  return { email: normalizedEmail, phoneNumber: normalizedPhone };
}

module.exports = { normalizeInput };
