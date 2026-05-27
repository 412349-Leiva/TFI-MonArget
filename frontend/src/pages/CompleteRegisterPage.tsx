import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';

type State = {
  name?: string;
  lastname?: string;
};

export function CompleteRegisterPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = searchParams.get('email') ?? '';
  const state = (location.state as State | null) ?? {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.register({
        name: state.name ?? '',
        lastname: state.lastname ?? '',
        email,
        password,
      });

      if (response.token) {
        // token is set by backend, now login in context
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
        // Try to show backend error message if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr = err as any;
        const serverMessage = anyErr?.response?.data?.message ?? anyErr?.message;
        setError(serverMessage ?? 'No pudimos completar el registro. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-[fadeIn_0.45s_ease-out]">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        <h1 className="font-display text-3xl text-stone-50">Crear contraseña</h1>
        <p className="mt-2 text-sm text-stone-400">Completá tu contraseña para finalizar el registro de <strong className="text-stone-100">{email}</strong>.</p>
        <Card className="mt-6 w-full p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <Input label="Confirmar contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}
            <Button fullWidth type="submit" disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
