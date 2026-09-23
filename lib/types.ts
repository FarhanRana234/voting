export interface VotingSettings {
  votingEndsAt: number | null;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string | null;
  order: number;
}

export interface Participant {
  id: string;
  categoryId: string;
  name: string;
  photoUrl?: string | null;
  order: number;
}

export interface CategoryWithParticipants extends Category {
  participants: Participant[];
}

export interface VoteCountEntry {
  id: string;
  categoryId: string;
  voteCount: number;
}

export interface VoteRecord {
  voterId: string;
  categoryId: string;
  participantId: string;
  createdAt: number;
}

export interface PastVote {
  categoryId: string;
  participantId: string;
}

export interface WinnerResult {
  categoryId: string;
  categoryName: string;
  categoryImage?: string | null;
  winner: { id: string; name: string; photoUrl?: string | null };
  runnerUps: { id: string; name: string; photoUrl?: string | null }[];
}