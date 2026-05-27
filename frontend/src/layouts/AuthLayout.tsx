import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-black text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-6">
        <Outlet />
      </div>
    </main>
  );
}