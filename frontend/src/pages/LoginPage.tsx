import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('tamara@ejemplo.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('No pudimos iniciar sesión. Verificá tus datos o si ya confirmaste tu email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-[fadeIn_0.45s_ease-out]">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-gold-500 text-2xl font-semibold text-navy-950 shadow-glow">MA</div>
        <h1 className="font-display text-4xl text-stone-50">MonArgent</h1>
        <p className="mt-2 text-sm text-stone-400">Tu control financiero, en un diseño simple y elegante.</p>

        <Card className="mt-8 w-full p-5 md:p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tamara@ejemplo.com"
              icon={<FiMail />}
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                icon={<FiLock />}
              />
              <button
                type="button"
                className="absolute right-4 top-[2.55rem] text-stone-400 transition hover:text-stone-100"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

            <div className="flex justify-end text-sm text-gold-500">
              <button type="button">¿Olvidaste tu contraseña?</button>
            </div>

            <Button fullWidth type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-400">
            ¿No tenés cuenta? <Link className="font-semibold text-gold-500" to="/register">Registrarse</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}