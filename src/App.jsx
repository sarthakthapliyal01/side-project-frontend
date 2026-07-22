import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import AuthPage from "./components/AuthPage";
import OrganizationPage from "./Pages/OrganizationPage";

function App() {
  const [message, setMessage] = useState("");
  const [organizationCreated, setOrganizationCreated] = useState(false);

  const {
    isAuthenticated,
    user,
    logout,
    isLoading,
  } = useAuth0();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/message")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
  if (!isAuthenticated || !user) return;

  const companyName = localStorage.getItem("companyName");

  fetch("http://127.0.0.1:8000/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      picture: user.picture,
      auth0_id: user.sub,
      companyName: companyName,
    }),
  });
}, [isAuthenticated, user]);


  if (isLoading) {
  return <h2>Loading...</h2>;
}

if (!organizationCreated) {
  return (
    <OrganizationPage
      onOrganizationCreated={() =>
        setOrganizationCreated(true)
      }
    />
  );
}

if (!isAuthenticated) {
  return <AuthPage />;
}

const companyName = localStorage.getItem("companyName");

  return (
    <div
      style={{
        padding: "2rem",
      }}
    >
      <h1>Organization: {companyName}</h1>

      <p>{message}</p>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          maxWidth: "500px",
        }}
      >
        <img
          src={user?.picture}
          alt={user?.name}
          width="80"
          style={{
            borderRadius: "50%",
          }}
        />

        <h3>{user?.name}</h3>

        <p>{user?.email}</p>

        <button
          onClick={() =>
            logout({
              logoutParams: {
                returnTo: window.location.origin,
              },
            })
          }
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;