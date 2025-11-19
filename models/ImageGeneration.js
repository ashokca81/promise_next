import mongoose from 'mongoose';

const imageGenerationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imagesCount: {
    type: Number,
    required: true,
  },
  templateName: {
    type: String,
  },
  excelFileName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  errorMessage: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ImageGeneration || mongoose.model('ImageGeneration', imageGenerationSchema);

