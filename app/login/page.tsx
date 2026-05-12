import { redirect } from "next/navigation";
import { LoginView } from "@/features/auth/login-view";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <LoginView />
    </main>
  );
}
