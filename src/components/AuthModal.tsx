import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { User } from "../types";
import { api } from "../services/api";

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<"freelancer" | "client">("freelancer");
  const [companyName, setCompanyName] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error("Please enter your full name.");
        }
        const result = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          companyName: companyName.trim() || undefined,
        });
        onSuccess(result.user);
      } else {
        const result = await api.login({
          email: email.trim(),
          password,
        });
        onSuccess(result.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await api.login({ email: demoEmail, password: demoPass });
      onSuccess(result.user);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in with demo account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Container Box */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Navy Header Card */}
        <div className="bg-slate-900 text-white p-8 text-center relative">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center text-white shadow-md shadow-blue-500/30 mb-3">
            <ShieldCheck className="h-7 w-7 stroke-[2.2]" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white">ClientVault</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Secure client file portal for freelancers, designers, and agencies
          </p>

          {/* Toggle Tab between Sign In and Sign Up */}
          <div className="mt-6 flex p-1 bg-slate-800 rounded-lg border border-slate-700/60">
            <button
              id="tab-sign-in"
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !isSignUp
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-create-account"
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isSignUp
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create an Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If Sign Up: Full Name */}
            {isSignUp && (
              <div>
                <label
                  htmlFor="auth-fullname-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="auth-fullname-input"
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* If Sign Up: Role Selection & Company */}
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    I am using ClientVault as a:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("freelancer")}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === "freelancer"
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold ring-2 ring-blue-100"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Freelancer / Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === "client"
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold ring-2 ring-blue-100"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>Client</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="auth-company-input"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Studio or Company Name (Optional)
                  </label>
                  <input
                    id="auth-company-input"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Innovations"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:bg-slate-400"
            >
              {isLoading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Account & Enter Portal" : "Sign In to ClientVault"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Accounts for Easy Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span>Instant Demo Accounts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="demo-login-designer"
                onClick={() => handleQuickLogin("designer@clientvault.com", "password123")}
                className="text-left p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg text-xs transition-all cursor-pointer"
              >
                <p className="font-bold text-slate-800">Elena (Designer)</p>
                <p className="text-[10px] text-slate-400 truncate">designer@clientvault.com</p>
              </button>

              <button
                type="button"
                id="demo-login-client"
                onClick={() => handleQuickLogin("client@acmecorp.com", "password123")}
                className="text-left p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg text-xs transition-all cursor-pointer"
              >
                <p className="font-bold text-slate-800">Marcus (Client)</p>
                <p className="text-[10px] text-slate-400 truncate">client@acmecorp.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <p className="text-xs text-slate-400 mt-6 text-center">
        Protected with role-based client isolation and encrypted file storage.
      </p>
    </div>
  );
};
