import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloakAuth } from "@/lib/keycloak-auth";

export default function Callback() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, completeLogin } = useKeycloakAuth();

  useEffect(() => {
    const handleCallback = async () => {
      if (loading) return;

      if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
        return;
      }

      try {
        await completeLogin();
        if (!window.opener) {
          navigate("/dashboard", { replace: true });
        }
      } catch {
        if (!window.opener) {
          navigate("/login", { replace: true });
        }
      }
    };

    void handleCallback();
  }, [completeLogin, isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mb-4 animate-spin">⚡</div>
        <p className="text-gray-600">Processing login...</p>
      </div>
    </div>
  );
}
