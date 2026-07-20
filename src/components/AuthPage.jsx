import { useAuth0 } from "@auth0/auth0-react";

function AuthPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div>
      <h1>Authencation Page</h1>

      <p>Login or create an account with Google</p>

      <button onClick={() => loginWithRedirect()}>
        Continue with Google
      </button>
    </div>
  );
}

export default AuthPage;