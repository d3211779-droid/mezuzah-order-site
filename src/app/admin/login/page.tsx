import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-gold-deep">מזוזה בעיצוב אישי</p>
        <h1 className="mb-6 mt-1 text-2xl font-bold">כניסה ללוח הניהול</h1>
        <LoginForm />
      </div>
    </main>
  );
}
