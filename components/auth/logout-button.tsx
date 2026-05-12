"use client";

import { useRouter } from "next/navigation";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      // Échec non bloquant visuellement : redirection de secours
      // pour éviter de rester sur une session potentiellement invalide.
      console.error(await errorMessageFromResponse(response));
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className={className}>
      Deconnexion
    </button>
  );
}
