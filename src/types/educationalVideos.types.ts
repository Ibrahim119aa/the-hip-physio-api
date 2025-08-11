import { Document} from 'mongoose';

export type TEducationVideo = {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: number; // Optional as per your schema
  category: string[];
  tags: string[];
}

export type TEducationalVideoDocument = TEducationVideo & Document;