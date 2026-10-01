import mongoose, { Schema } from "mongoose";

// Yayın logu — sadece ekleme yapılır, uygulamada silme/güncelleme yok.
const PublishLogSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true, index: true },
  mode: { type: String },
  ok: { type: Boolean },
  submitted: { type: Boolean },
  error: { type: String },
  durationSec: { type: Number },
  finalUrl: { type: String },
  classifiedId: { type: String },
  queueId: { type: String },
  attempt: { type: Number },
  title: { type: String },
  titleKey: { type: String, index: true },
  originalTitle: { type: String },
  brand: { type: String },
  model: { type: String },
  color: { type: String },
  storage: { type: String },
  price: { type: Number },
  town: { type: String },
  quarter: { type: String },
  description: { type: String },
  imagePath: { type: String },
  imageHash: { type: String, index: true },
  imageReused: { type: Boolean },
  logs: [{ type: String }],
});

export default mongoose.models.PublishLog || mongoose.model("PublishLog", PublishLogSchema);
