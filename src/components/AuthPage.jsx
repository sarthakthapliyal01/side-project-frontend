import { useAuth0 } from "@auth0/auth0-react";

function AuthPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="qmx-auth h-screen w-full bg-black text-white flex overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .qmx-auth { font-family: 'Inter', sans-serif; }
        .qmx-display { font-family: 'Space Grotesk', sans-serif; }
        .qmx-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="relative hidden lg:block lg:w-[55%] border-r border-white/10 overflow-hidden">
        <img
          src="/auth-page.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-sm">
          <p className="qmx-mono text-[11px] tracking-[0.3em] text-[#4D4D4D] uppercase mb-6">// Access</p>

          <h1 className="qmx-display text-3xl sm:text-4xl font-medium text-white tracking-tight mb-3">
            Sign in to your workspace
          </h1>

          <p className="text-[#8C8C8C] text-[15px] leading-relaxed mb-10">
            Sign in with Google to access your workspace.
          </p>

          <button
            onClick={() => loginWithRedirect()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black qmx-display font-medium text-[15px] rounded-lg transition-colors hover:bg-[#E5E5E5]"
          >
            Continue with Google
          </button>

          <p className="qmx-mono text-[10px] tracking-[0.15em] text-[#4D4D4D] mt-8 uppercase">
            Secured by Auth0 · SSO enabled
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;