import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a192f]">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: 'url("/images/login-bg.png")' }}
      />
      <div className="absolute inset-0 z-1 bg-gradient-to-br from-blue-900/80 to-gray-900/90" />

      {/* Content */}
      <div className="z-10 w-full max-w-lg px-4 animate-in fade-in zoom-in duration-700">
        <div className="mb-8 text-center">
          <div className="inline-block p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-2xl">
            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            <span className="text-blue-500">DMS REPORT</span> V4
          </h1>
          <p className="text-blue-100/60 text-lg font-medium">Hệ thống báo cáo DMS Report V4</p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center">
          <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-medium">
            Copyright © 2026 Cholimexfood. All rights reserved.
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
    </main>
  );
}
