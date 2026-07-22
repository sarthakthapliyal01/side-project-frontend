import { useAuth0 } from "@auth0/auth0-react";
import "./AuthPage.css";

function AuthPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>

        <p className="auth-subtitle">
          Sign in to continue to your workspace or create a new account using
          Google.
        </p>

        <button
          className="auth-button"
          onClick={() => loginWithRedirect()}
        >
          Continue with Google
        </button>

        <p className="auth-footer">
          Secure authentication powered by Auth0
        </p>
      </div>
    </div>
  );
}

export default AuthPage;