function buildResponse(truePrimary, finalComponent) {
  const emails = [];
  const phoneNumbers = [];
  const secondaryContactIds = [];

  if (truePrimary.email) {
    emails.push(truePrimary.email);
  }
  if (truePrimary.phone_number) {
    phoneNumbers.push(String(truePrimary.phone_number));
  }

  for (const c of finalComponent) {
    if (c.email && !emails.includes(c.email)) {
      emails.push(c.email);
    }
    if (c.phone_number) {
      const pStr = String(c.phone_number);
      if (!phoneNumbers.includes(pStr)) {
        phoneNumbers.push(pStr);
      }
    }
    if (c.id !== truePrimary.id) {
      secondaryContactIds.push(c.id);
    }
  }

  secondaryContactIds.sort((a, b) => a - b);

  return {
    contact: {
      primaryContatctId: truePrimary.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    }
  };
}

module.exports = { buildResponse };
