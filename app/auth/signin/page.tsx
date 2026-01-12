"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      alert("Proszę podać adres email");
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting sign in with email:", email.trim());
      const result = await signIn("credentials", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/today",
      });
      console.log("Sign in result:", result);
      
      if (result?.ok) {
        console.log("Sign in successful, redirecting to /today...");
        // Use router.push for better Next.js integration
        router.push("/today");
        router.refresh();
      } else if (result?.error) {
        console.error("Sign in failed with error:", result.error);
        alert(`Logowanie nie powiodło się: ${result.error}\nSprawdź konsolę przeglądarki (F12) i terminal serwera dla szczegółów.`);
      } else {
        console.error("Sign in failed - unknown reason:", result);
        alert(`Logowanie nie powiodło się. Sprawdź konsolę przeglądarki (F12) i terminal serwera.`);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      alert(`Błąd logowania: ${error instanceof Error ? error.message : "Nieznany błąd"}\nSprawdź konsolę przeglądarki (F12) i terminal serwera.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card shadow-large">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Ops Planner</h1>
            <p className="text-gray-600">Plan your day, track your progress</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="your@email.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <p className="mt-6 text-xs text-gray-500 text-center">
            For MVP: Enter your email to sign in. No password required.
          </p>
        </div>
      </div>
    </div>
  );
}

