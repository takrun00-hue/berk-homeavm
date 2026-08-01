"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/upload");
    } else {
      setError("Şifre yanlış.");
    }
  };

  return (
    <section className="py-20 px-4 max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-center">Admin Giriş</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-md px-4 py-3 text-sm"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          className="w-full bg-black text-gold py-3 rounded-md font-bold"
        >
          Giriş Yap
        </button>
      </form>
    </section>
  );
}
