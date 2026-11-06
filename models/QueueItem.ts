import mongoose, { Schema, Document } from "mongoose";

export interface IQueueItem extends Document {
  queueId: string;
  draft: any;
  preview?: string;
  status: "pending" | "running" | "done" | "error";
  errorMsg?: string;
  addedAt: string;
  duration?: string;
  publishedAt?: Date;
  logs: string[];
  /** Eklenme sırası (yeni kayıtlarda sayısal; eski kayıtlarda yok → en başa sıralanır). */
  seq?: number;
  /** Öğeyi şu an yayınlayan motor örneğinin kimliği (yalnız status=running iken). */
  runOwner?: string;
  startedAt?: Date;
  finishedAt?: Date;
  attempts?: number;
  /**
   * Adım-3 (son onay) tıklanmadan hemen önce yazılan işaret. Varsa ilan sahibinden'de
   * açılmış olabilir → motor bu öğeyi ASLA otomatik yeniden yayınlamaz (elle kontrol gerekir).
   */
  submittedAt?: Date;
}

const QueueItemSchema: Schema = new Schema({
  queueId: { type: String, required: true, unique: true },
  draft: { type: Schema.Types.Mixed, required: true },
  preview: { type: String },
  status: { type: String, enum: ["pending", "running", "done", "error"], default: "pending" },
  errorMsg: { type: String },
  addedAt: { type: String },
  duration: { type: String },
  publishedAt: { type: Date },
  logs: [{ type: String }],
  seq: { type: Number, index: true },
  runOwner: { type: String },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  attempts: { type: Number },
  submittedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.QueueItem || mongoose.model<IQueueItem>("QueueItem", QueueItemSchema);
