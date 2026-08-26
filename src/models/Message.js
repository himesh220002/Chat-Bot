import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
