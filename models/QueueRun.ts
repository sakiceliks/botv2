import mongoose, { Schema } from "mongoose";

// Kuyruk motorunun tek dokümanı (_id: "main"). Hem çalışma durumunu hem de Mongo lease/kilidini taşır.
//
//   status  → ekranda gösterilen durum (idle | running | stopping | paused_login)
//   ownerId → lease sahibi motor örneği. Boşsa kimse çalıştırmıyor. Doluyken heartbeatAt taze ise
//             (bkz. LEASE_TTL_MS) ikinci bir örnek kuyruğu başlatamaz.
//
// Aynı Mongo'yu birden çok makine paylaşsa bile çift yayın olmasın diye lease kullanılır.
export type QueueRunStatus = "idle" | "running" | "stopping" | "paused_login";

export interface IQueueRun {
  _id: string;
  status: QueueRunStatus;
  ownerId: string | null;
  ownerLabel?: string;
  heartbeatAt: Date | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  currentQueueId: string | null;
  currentTitle?: string | null;
  processed: number;
  success: number;
  failed: number;
  batchNumber: number;
  stopRequested: boolean;
  message?: string | null;
  lastError?: string | null;
  recentLogs: string[];
}

const QueueRunSchema = new Schema(
  {
    _id: { type: String, required: true },
    status: { type: String, enum: ["idle", "running", "stopping", "paused_login"], default: "idle" },
    ownerId: { type: String, default: null },
    ownerLabel: { type: String },
    heartbeatAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    currentQueueId: { type: String, default: null },
    currentTitle: { type: String, default: null },
    processed: { type: Number, default: 0 },
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    batchNumber: { type: Number, default: 0 },
    stopRequested: { type: Boolean, default: false },
    message: { type: String, default: null },
    lastError: { type: String, default: null },
    recentLogs: { type: [String], default: [] },
  },
  { timestamps: true, collection: "queueruns" },
);

export const QUEUE_RUN_ID = "main";

export default (mongoose.models.QueueRun as mongoose.Model<IQueueRun>) ||
  mongoose.model<IQueueRun>("QueueRun", QueueRunSchema);
