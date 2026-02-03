import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { Me } from "../auth/useAuth";

type Props = {
  me: Me | null;
  children: ReactNode;
};

export default function ProtectedRoute({ me, children }: Props) {
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
