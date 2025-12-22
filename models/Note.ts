import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';

const NoteSchema = new Schema({
  urlId: { type: String, default: () => nanoid(6), unique: true },
  // ADD THIS LINE 👇
  title: { type: String, default: '' }, 
  content: { type: String, default: '' },
  isPinned: { type: Boolean, default: false },
  isEncrypted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);