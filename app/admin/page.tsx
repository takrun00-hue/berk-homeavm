"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin/products");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.message || "Şifre yanlış.");
    }
  };

  return (
    <section className="py-20 px-4 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-center">Admin Giriş</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-4 py-3 text-sm pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-gold py-3 rounded-md font-bold disabled:opacity-50"
        >
          {loading ? "..." : "Giriş Yap"}
        </button>
      </form>
    </section>
  );
}
