// backend/src/utils/hmac.ts
import crypto from "crypto";

export function signPayload(payloadString, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");
}

export function verifyPayload(
  payloadString,
  secret,
  sig
) {
  const expected = signPayload(payloadString, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
