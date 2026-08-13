"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/clients" });
}

export async function loginAction(_prevState: string | undefined, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", { email, password, redirectTo: "/clients" });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid email or password.";
    }
    throw error;
  }
}
