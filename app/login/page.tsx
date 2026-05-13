import { redirect } from "next/navigation";
import { LoginView } from "@/features/auth/login-view";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen">
      <LoginView />
    </main>
  );
}
