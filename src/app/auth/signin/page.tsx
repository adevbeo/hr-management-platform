'use client';

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const toastId = toast.loading("Đang đăng nhập...");

    try {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (result?.error) {
        const message = "Sai tài khoản hoặc mật khẩu";
        setError(message);
        toast.error(message, { id: toastId });
      } else {
        toast.success("Đăng nhập thành công", { id: toastId });
        window.location.href = callbackUrl;
      }
    } catch {
      const message = "Đăng nhập thất bại. Vui lòng thử lại";
      toast.error(message, { id: toastId });
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl text-center font-semibold text-slate-900">HR Management Platform</h1>
        <p className="mt-1 text-xs text-slate-500 mt-2 text-center">
          Đăng nhập để quản lý nhân sự, hợp đồng, báo cáo và tự động hóa.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-black placeholder:text-black placeholder:font-semibold focus:border-slate-500 focus:outline-none"
              type="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-black placeholder:text-black placeholder:font-semibold focus:border-slate-500 focus:outline-none"
              type="password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-slate-500">
          Sản phẩm thuộc về phòng ESD - HPT
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
