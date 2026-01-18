import { Schema, model, models, Document } from "mongoose";

export interface IMessage extends Document {
  senderId: Schema.Types.ObjectId;
  receiverId?: Schema.Types.ObjectId;
  groupId?: Schema.Types.ObjectId;
  message: string;
  fileUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: "User" },
  groupId: { type: Schema.Types.ObjectId, ref: "Group" },
  message: { type: String, required: true },
  fileUrl: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Message = models.Message || model<IMessage>("Message", MessageSchema);

export default Message;
