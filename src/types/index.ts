import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
  bio?: string;
  stampCount: number;
  createdAt: Timestamp;
}

export interface Stamp {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhotoURL: string | null;
  name: string;
  country: string;
  year: string;
  condition: "Mint" | "Near Mint" | "Fine" | "Good" | "Fair" | "Poor";
  description?: string;
  imageURL: string;
  isPublic: boolean;
  createdAt: Timestamp;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string;
  imageURLs: string[];
  attachedStampIds: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string;
  createdAt: Timestamp;
}

export interface TradeListing {
  id: string;
  posterId: string;
  posterName: string;
  posterPhotoURL: string | null;
  offeredStampId: string;
  offeredStamp?: Stamp;
  wantedDescription: string;
  status: "open" | "closed";
  createdAt: Timestamp;
}

export interface TradeRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoURL: string | null;
  toUserId: string;
  offeredStampId: string;
  requestedStampId: string;
  listingId?: string;
  message?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
}
