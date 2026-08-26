import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Chat',
  },
}, { timestamps: true });

export default mongoose.models.Chat || mongoose.model('Chat', chatSchema);
