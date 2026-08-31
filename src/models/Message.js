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
  imageMetas: [{
    imageId: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    width: { type: Number },
    height: { type: Number },
    sizeBytes: { type: Number }
  }],
  imageMeta: {
    imageId: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    width: { type: Number },
    height: { type: Number },
    sizeBytes: { type: Number }
  }
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
