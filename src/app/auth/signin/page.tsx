'use client';

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    if (result?.error) {
      setError("Sai tài khoản hoặc mật khẩu");
    } else {
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">Nền tảng Quản lý Nhân sự</h1>
        <p className="mt-1 text-sm text-slate-500">
          Đăng nhập để quản lý nhân sự, hợp đồng, báo cáo và tự động hóa.
        </p>
        <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Hướng dẫn nhanh</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Admin: xem/thiết lập phân quyền, nhân sự, hợp đồng, báo cáo.</li>
            <li>HR: quản lý nhân sự, hợp đồng, báo cáo, lịch gửi.</li>
            <li>Quản lý: xem nhân sự trong phòng ban và báo cáo liên quan.</li>
          </ul>
        </div>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Đăng nhập
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Tài khoản mẫu: admin@demo.com / Admin123!, hr@demo.com / Hr123!, manager@demo.com / Manager123!
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
