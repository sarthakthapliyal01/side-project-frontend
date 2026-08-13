import { useState } from "react";
import axios from "axios";
import { Loader2, ArrowRight } from "lucide-react";

function OrganizationPage({ onOrganizationCreated }) {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/companies", {
        companyName,
      });

      const savedName = response.data?.companyName || companyName;
      localStorage.setItem("companyName", savedName);
      onOrganizationCreated();
    } catch (error) {
      console.error("Organization submission error:", error);
      alert("Failed to process organization request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0f0f12] via-[#08080a] to-[#000000] text-white flex items-center justify-center p-8 font-sans relative overflow-hidden">
      
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Organization Workspace
          </h1>
          <p className="text-[#999999] text-base font-normal leading-relaxed max-w-[380px] mx-auto">
            Enter your company details to set up or access your dedicated workspace.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Organization Name Input */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#cccccc] tracking-wide ml-1">
              Organization Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Organization Name"
              required
              className="w-full h-14 rounded-full bg-[#121215] border border-[#26262b] px-6 text-base text-white placeholder:text-[#555555] outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-200 shadow-inner"
            />
          </div>

          {/* Submit Action Pill */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 mt-4 rounded-full bg-white hover:bg-neutral-200 text-black text-base font-bold transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-xl hover:shadow-white/10 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-black" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Continue to Workspace</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}

export default OrganizationPage;



