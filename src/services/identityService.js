async function reconcile({ email, phoneNumber }) {
  // Skeleton implementation
  return {
    contact: {
      primaryContatctId: 1,
      emails: email ? [email] : [],
      phoneNumbers: phoneNumber ? [phoneNumber] : [],
      secondaryContactIds: []
    }
  };
}

module.exports = { reconcile };
