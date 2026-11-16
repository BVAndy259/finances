export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-4 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {children}
    </div>
  );
}
