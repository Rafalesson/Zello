// Endereço: apps/frontend/src/app/redefinir-senha/page.tsx

import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

// Este componente age como um "wrapper" que usa o Suspense
// para garantir que o formulário só renderize quando os parâmetros da URL estiverem disponíveis.
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}