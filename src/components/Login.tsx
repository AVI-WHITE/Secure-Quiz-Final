import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const { user, role, login, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && role) {
      navigate(role === "admin" ? "/admin" : "/participant");
    } else if (user && !role) {
      navigate("/role-selection");
    }
  }, [user, role, navigate]);

  const handleEmailLogin = async () => {
    if (!email || !password) { toast.error("Fill all fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) toast.error(error.message);
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !name) { toast.error("Fill all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account");
      setMode("login");
    }
  };

  const handleGoogleLogin = async () => {
    try { await login(); } catch (err) { console.error("Login failed", err); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm border border-border rounded p-6 space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Secure Quiz</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-background text-foreground"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded text-sm bg-background text-foreground"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded text-sm bg-background text-foreground"
          />
          <button
            onClick={mode === "login" ? handleEmailLogin : handleEmailSignup}
            disabled={submitting}
            className="w-full px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground">or</div>
<button
          type="button" // <-- Add this
          onClick={(e) => {
            
            e.preventDefault(); // <-- Add this
            handleGoogleLogin();
          }}
          className="w-full px-4 py-2 rounded border border-border text-sm text-foreground font-medium"
        >
          Sign in with Google
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="underline text-foreground">Sign Up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => setMode("login")} className="underline text-foreground">Sign In</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
