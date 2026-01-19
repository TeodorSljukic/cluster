/**
 * NOTE:
 * This project uses the native MongoDB driver (not Mongoose).
 * These model files are kept as plain TypeScript interfaces for shared typing.
 */

export interface Message {
  _id?: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  message: string;
  fileUrl?: string;
  isRead: boolean;
  createdAt: Date;
  reactions?: {
    emoji: string;
    userId: string;
  }[];
}
