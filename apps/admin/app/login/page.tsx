import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-navy-950 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <p className="text-sm font-semibold text-pitch-600">CricketAtlas GroundIQ</p>
        <h1 className="mt-1 text-2xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Access is by invitation only.</p>
        <LoginForm notice={error === "not_admin" ? "This account does not have admin access." : undefined} />
      </div>
    </main>
  );
}
