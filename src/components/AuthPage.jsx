import { Brand } from "./ui/ProductUI";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

function AuthPage({ onDevBypass }) {
  const { loginWithRedirect } = useAuth0();

  return <main className="q-auth q-signin">
    <div className="q-signin-visual"><img src="/auth-page.jpg" alt="" /><div className="q-auth-brand"><Brand /></div></div>
    <section className="q-signin-panel"><div className="q-auth-content">
      <div className="q-eyebrow">Workspace access</div>
      <h1>Welcome to<br />your workspace.</h1>
      <p className="q-auth-lead">Sign in with Google to access your team's metrics and integrations.</p>
      <button className="q-button q-button--primary" onClick={() => loginWithRedirect()}>Continue with Google<ArrowRight size={18} /></button>
      <p className="q-auth-meta"><ShieldCheck size={14} style={{display:"inline",verticalAlign:"middle",marginRight:8}} />Secured by Auth0 · SSO enabled</p>
    </div></section>
  </main>;
}
export default AuthPage;
