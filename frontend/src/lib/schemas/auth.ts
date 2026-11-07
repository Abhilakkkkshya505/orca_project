import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  display_name: z
    .string()
    .min(1, "Display name is required.")
    .max(80, "Display name must be 80 characters or fewer."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters long."),
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms and Conditions and Privacy Policy." }),
  }),
  turnstile_token: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  turnstile_token: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  turnstile_token: z.string().optional(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  new_password: z
    .string()
    .min(10, "Password must be at least 10 characters long."),
});

export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, "Current password is required."),
  new_password: z
    .string()
    .min(10, "New password must be at least 10 characters long."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const profileSettingsSchema = z.object({
  display_name: z.string().min(1).max(80),
  preferred_units: z.enum(["metric", "knots"]),
  default_vessel_class: z.enum(["small_craft", "mechanised"]),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
