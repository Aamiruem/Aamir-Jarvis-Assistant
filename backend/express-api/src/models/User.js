import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Verification & second factor
    emailVerified: { type: Boolean, default: false },
    phone: { type: String, default: null },      // E.164, set only after OTP verification
    phoneVerified: { type: Boolean, default: false },

    // Brute-force protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },

    preferences: {
      voice: { type: Boolean, default: false },
      language: { type: String, default: 'en-IN' },
      otpChannel: { type: String, enum: ['email', 'sms'], default: 'email' },
    },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

// Never leak secrets when a user document is sent as JSON (e.g. by the admin routes).
userSchema.methods.toJSON = function () {
  const { _id, name, email, role, emailVerified, phone, phoneVerified, preferences, createdAt, lastLoginAt } = this;
  return { id: _id, name, email, role, emailVerified, phone, phoneVerified, preferences, createdAt, lastLoginAt };
};

export const User = mongoose.model('User', userSchema);
