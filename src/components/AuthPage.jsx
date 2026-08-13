import { useAuth0 } from "@auth0/auth0-react";

function AuthPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="h-screen w-full bg-gradient-to-b from-[#0f0f12] via-[#08080a] to-[#000000] text-white flex overflow-hidden font-sans relative">
      <div className="relative hidden lg:block lg:w-[55%] border-r border-[#1e1e24] overflow-hidden">
        <img
          src="/auth-page.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 relative z-10">
        <div className="w-full max-w-[440px]">
          <p className="font-mono text-xs tracking-[0.3em] text-[#888888] uppercase mb-6">
            // Workspace Access
          </p>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Sign in to your workspace
          </h1>

          <p className="text-[#999999] text-base leading-relaxed mb-10 font-normal">
            Sign in with Google to access your workspace metrics and integrations.
          </p>

          <button
            onClick={() => loginWithRedirect()}
            className="w-full h-14 flex items-center justify-center gap-3 px-6 bg-white hover:bg-neutral-200 text-black font-extrabold text-base rounded-full shadow-xl transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Continue with Google
          </button>

          <p className="font-mono text-[11px] tracking-[0.15em] text-[#666666] mt-8 uppercase text-center sm:text-left">
            Secured by Auth0 · SSO enabled
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;