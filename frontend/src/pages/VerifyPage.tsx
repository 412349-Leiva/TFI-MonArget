import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';

type VerificationLocationState = {
  password?: string;
  code?: string;
};

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = searchParams.get('email') ?? '';
  const codeFromState = (location.state as VerificationLocationState | null)?.code;
  const nameFromState = (location.state as VerificationLocationState | null)?.name;
  const lastnameFromState = (location.state as VerificationLocationState | null)?.lastname;
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const copyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Código copiado al portapapeles');
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setError('No se pudo copiar el código');
    }
  };

  useEffect(() => {
    if (codeFromState) {
      setCode(codeFromState);
    }
  }, [codeFromState]);

  // password is handled in the final registration step (CompleteRegisterPage)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authService.verify({ email, code });
      setMessage('Código verificado. Completá tu contraseña para crear la cuenta.');
      // Navigate to complete registration (password set) passing name/lastname from previous step
      navigate(`/complete-register?email=${encodeURIComponent(email)}`, { state: { name: nameFromState, lastname: lastnameFromState } });
    } catch {
      setError('No pudimos verificar el código. Revisá el email o pedí uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setMessage(null);

    try {
      await authService.resendCode({ email });
      setMessage('Código reenviado. Revisá tu casilla.');
    } catch {
      setError('No pudimos reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full animate-[fadeIn_0.45s_ease-out]">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gold-500 text-2xl font-semibold text-navy-950 shadow-glow">MA</div>
        <h1 className="font-display text-4xl text-stone-50">Verificar cuenta</h1>
        <p className="mt-2 text-sm text-stone-400">Ingresá el código que enviamos a <strong className="text-stone-100">{email || 'tu email'}</strong>.</p>

        <Card className="mt-6 w-full p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Código de verificación" value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" inputMode="numeric" />

            {codeFromState ? (
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-stone-200">
                <div>
                  <div className="text-xs text-stone-400">Código devuelto (solo desarrollo)</div>
                  <div className="mt-1 font-medium">{codeFromState}</div>
                </div>
                <button type="button" className="ml-4 rounded-md bg-white/6 px-3 py-2 text-sm" onClick={() => void copyCode(codeFromState)}>Copiar</button>
              </div>
            ) : null}

            {/* Password is set in the final step after verification */}

            {message ? <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p> : null}
            {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

            <div className="grid gap-3">
              <Button fullWidth type="submit" disabled={loading}>
                {loading ? 'Verificando...' : 'Confirmar email'}
              </Button>
              <Button fullWidth type="button" variant="secondary" onClick={handleResend} disabled={resending}>
                {resending ? 'Enviando...' : 'Reenviar código'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}