const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_BLOCK_MINUTES = 30;
const OTP_MAX_REQUESTS_PER_HOUR = 5;

const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;
const hashOtpCode = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
  OTP_BLOCK_MINUTES,
  OTP_MAX_REQUESTS_PER_HOUR,
  generateOtpCode,
  hashOtpCode,
};
