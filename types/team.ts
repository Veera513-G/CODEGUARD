export type TeamRole = "OWNER" | "ADMIN" | "REVIEWER" | "DEVELOPER";

export interface Team {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  createdAt: string;
  memberCount?: number;
}

export interface TeamMember {
  id: string;
  role: TeamRole;
  joinedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatarUrl?: string;
  };
}
