import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const shortUrlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortId: { type: String, required: true, default: () => nanoid(8), unique: true },
  createdAt: { type: Date, default: Date.now }
});

export const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Auto delete after 30 days
  }
});

export const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);
