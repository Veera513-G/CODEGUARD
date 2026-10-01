import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number"
    ),
});

export const createReviewSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  language: z.string().min(1, "Language is required"),
  sourceType: z.enum(["PASTE", "FILE_UPLOAD", "ZIP_UPLOAD", "GITHUB_IMPORT"]),
  sourceCode: z
    .string()
    .min(10, "Code must be at least 10 characters")
    .max(
      parseInt(process.env.MAX_CODE_LENGTH || "50000"),
      `Code cannot exceed ${process.env.MAX_CODE_LENGTH || 50000} characters`
    ),
  fileName: z.string().optional(),
  projectId: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  company: z.string().max(100).optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
