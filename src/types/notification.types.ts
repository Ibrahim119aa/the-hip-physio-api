import { Document, Schema } from 'mongoose';

// Define the interface for your Notification document
export interface INotification extends Document {
    title: string;
    body: string;
    targetGroup: 'All' | 'Segment' | 'SelectedUsers';
    targetSegment?: string;
    recipients?: Schema.Types.ObjectId[];
    data?: { [key: string]: string };
    scheduledTime?: Date;
    sentTime?: Date;
    status: 'Scheduled' | 'Sent' | 'Failed';
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
