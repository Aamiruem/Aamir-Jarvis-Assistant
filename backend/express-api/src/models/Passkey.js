import mongoose from 'mongoose';

// A passkey (WebAuthn credential) a user added on one of their devices. Only the PUBLIC key
// is stored; the private key never leaves the phone, laptop or security key.
const passkeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    credentialId: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true }, // base64url COSE key
    counter: { type: Number, default: 0 },
    transports: { type: [String], default: [] },
    deviceType: { type: String, default: 'singleDevice' }, // or "multiDevice" (synced, e.g. iCloud Keychain)
    backedUp: { type: Boolean, default: false },
    name: { type: String, default: 'Passkey', trim: true, maxlength: 60 },
    rpId: { type: String, default: '' },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Passkey = mongoose.model('Passkey', passkeySchema);
