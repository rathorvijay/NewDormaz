const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const {
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
  OTP_BLOCK_MINUTES,
  OTP_MAX_REQUESTS_PER_HOUR,
  generateOtpCode,
  hashOtpCode,
} = require('../utils/otpUtils');

const getOtpCooldownMeta = (user) => {
  const resendAvailableAt = user.emailOtpLastSentAt
    ? new Date(user.emailOtpLastSentAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000)
    : new Date();

  return {
    expiresAt: user.emailOtpExpire,
    resendAvailableAt,
    cooldownSeconds: Math.max(0, Math.ceil((resendAvailableAt.getTime() - Date.now()) / 1000)),
  };
};

const clearOtpState = (user) => {
  user.emailOtpHash = undefined;
  user.emailOtpExpire = undefined;
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = undefined;
  user.emailOtpBlockedUntil = undefined;
  user.emailOtpRequestCount = 0;
  user.emailOtpFirstRequestAt = undefined;
};

const sendVerificationOtpEmail = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: 'Dormez Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background:#1a237e;color:#fff;padding:20px;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;">Dormez Email Verification</h2>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Use the OTP below to verify your Dormez account registration:</p>
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;background:#f5f7ff;padding:18px;border-radius:12px;color:#1a237e;margin:24px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
          <p>You can request a new OTP after <strong>${OTP_RESEND_COOLDOWN_SECONDS} seconds</strong>. After multiple failed attempts, verification is temporarily blocked for security.</p>
          <p style="margin-top:24px;">If you did not create this account, you can ignore this email.</p>
          <p>Team Dormez</p>
        </div>
      </div>
    `,
    text: `Your Dormez verification OTP is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
  });
};

const prepareAndSendOtp = async (user, { force = false } = {}) => {
  const now = new Date();

  if (user.emailOtpBlockedUntil && user.emailOtpBlockedUntil > now) {
    const seconds = Math.ceil((user.emailOtpBlockedUntil.getTime() - now.getTime()) / 1000);
    const error = new Error(`OTP verification is temporarily blocked. Try again in ${seconds} seconds.`);
    error.statusCode = 429;
    throw error;
  }

  if (
    !force &&
    user.emailOtpLastSentAt &&
    now.getTime() - new Date(user.emailOtpLastSentAt).getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000
  ) {
    const seconds = Math.ceil(
      (OTP_RESEND_COOLDOWN_SECONDS * 1000 - (now.getTime() - new Date(user.emailOtpLastSentAt).getTime())) / 1000
    );
    const error = new Error(`Please wait ${seconds} seconds before requesting a new OTP.`);
    error.statusCode = 429;
    throw error;
  }

  if (
    !user.emailOtpFirstRequestAt ||
    now.getTime() - new Date(user.emailOtpFirstRequestAt).getTime() > 60 * 60 * 1000
  ) {
    user.emailOtpFirstRequestAt = now;
    user.emailOtpRequestCount = 0;
  }

  if (user.emailOtpRequestCount >= OTP_MAX_REQUESTS_PER_HOUR) {
    const error = new Error('OTP request limit reached. Please try again after 1 hour.');
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtpCode();
  user.emailOtpHash = hashOtpCode(otp);
  user.emailOtpExpire = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = now;
  user.emailOtpRequestCount += 1;

  await user.save();
  await sendVerificationOtpEmail(user, otp);

  return getOtpCooldownMeta(user);
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  avatar: user.avatar,
  isVerified: user.isVerified,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail }).select('+emailOtpHash +password');

  if (user && user.isVerified) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  if (!user) {
    user = new User({ name, email: normalizedEmail, password, isVerified: false });
  } else {
    user.name = name;
    user.password = password;
    user.isVerified = false;
    user.isBlocked = false;
  }

  const otpMeta = await prepareAndSendOtp(user, { force: true });

  res.status(201).json({
    success: true,
    message: 'Registration created. Please verify your email with the OTP sent to your inbox.',
    verificationRequired: true,
    email: user.email,
    otp: {
      expiresAt: otpMeta.expiresAt,
      resendAvailableAt: otpMeta.resendAvailableAt,
      cooldownSeconds: otpMeta.cooldownSeconds,
    },
  });
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+emailOtpHash +password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email is already verified. Please login.');
  }

  const now = new Date();
  if (user.emailOtpBlockedUntil && user.emailOtpBlockedUntil > now) {
    res.status(429);
    throw new Error(`Verification temporarily blocked. Try again later.`);
  }

  if (!user.emailOtpHash || !user.emailOtpExpire || user.emailOtpExpire < now) {
    res.status(400);
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  const hashedOtp = hashOtpCode(otp);
  if (hashedOtp !== user.emailOtpHash) {
    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;

    if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
      user.emailOtpBlockedUntil = new Date(now.getTime() + OTP_BLOCK_MINUTES * 60 * 1000);
      await user.save();
      res.status(429);
      throw new Error('Too many failed OTP attempts. Verification is temporarily blocked.');
    }

    await user.save();
    res.status(400);
    throw new Error(`Invalid OTP. ${OTP_MAX_ATTEMPTS - user.emailOtpAttempts} attempts remaining.`);
  }

  user.isVerified = true;
  clearOtpState(user);
  await user.save();

  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Dormez Mattress! 🛏️',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a237e;">Welcome to Dormez, ${user.name}! 🎉</h2>
          <p>Your email has been verified successfully and your account is now active.</p>
          <p>Explore our premium collection of mattresses crafted for the perfect sleep experience.</p>
          <a href="${process.env.FRONTEND_URL}/products" style="background:#1a237e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Shop Now</a>
          <br><br>
          <p>Sweet Dreams,<br>Team Dormez 🛏️</p>
        </div>
      `,
    });
  } catch (err) {
    console.log('Welcome email failed:', err.message);
  }

  res.json({
    success: true,
    message: 'Email verified successfully',
    user: sanitizeUser(user),
    token: generateToken(user._id),
  });
});

const resendEmailOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+emailOtpHash +password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email is already verified. Please login.');
  }

  const otpMeta = await prepareAndSendOtp(user);

  res.json({
    success: true,
    message: 'A new OTP has been sent to your email address.',
    verificationRequired: true,
    email: user.email,
    otp: {
      expiresAt: otpMeta.expiresAt,
      resendAvailableAt: otpMeta.resendAvailableAt,
      cooldownSeconds: otpMeta.cooldownSeconds,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +emailOtpHash');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('Your account has been blocked. Contact support.');
  }

  if (!user.isVerified) {
    res.status(403);
    res.json({
      success: false,
      requiresVerification: true,
      email: user.email,
      message: 'Please verify your email with OTP before logging in.',
    });
    return;
  }

  res.json({
    success: true,
    user: sanitizeUser(user),
    token: generateToken(user._id),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    res.status(404);
    throw new Error('No user found with this email');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Dormez Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a237e;">Password Reset Request</h2>
        <p>You requested a password reset for your Dormez account.</p>
        <p>Click the link below (valid for 15 minutes):</p>
        <a href="${resetUrl}" style="background:#1a237e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  res.json({ success: true, message: 'Reset email sent successfully' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful', token: generateToken(user._id) });
});

module.exports = {
  register,
  verifyEmailOtp,
  resendEmailOtp,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
