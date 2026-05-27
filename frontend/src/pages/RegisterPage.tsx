import { useState } from 'react';
import type { FormEvent } from 'react';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';

export function RegisterPage() {
  const [name, setName] = useState('Tamara');
  const [lastname, setLastname] = useState('Leiva');
  const [email, setEmail] = useState('tamara@ejemplo.com');
  const [password, setPassword] = useState('12345678');
  const [confirmPassword, setConfirmPassword] = useState('12345678');
  // salaryDate removed per UX request
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // First step: request verification code to email
      const response = await authService.requestRegistration({ name, lastname, email });
      navigate(`/verify?email=${encodeURIComponent(email)}`, { state: { code: response.verificationCode, name, lastname } });
    } catch {
      setError('No pudimos iniciar el registro. Revisá los datos e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-[fadeIn_0.45s_ease-out]">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-gold-500 text-2xl font-semibold text-navy-950 shadow-glow">MA</div>
        <h1 className="font-display text-4xl text-stone-50">Crear cuenta</h1>
        <p className="mt-2 text-sm text-stone-400">Sumate a MonArgent y arrancá con tu control financiero.</p>

        <Card className="mt-8 w-full p-5 md:p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Nombre" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tamara" icon={<FiUser />} />
            <Input label="Apellido" value={lastname} onChange={(event) => setLastname(event.target.value)} placeholder="Leiva" icon={<FiUser />} />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tamara@ejemplo.com" icon={<FiMail />} />
            <Input label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" icon={<FiLock />} />
            <Input label="Confirmar contraseña" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" icon={<FiLock />} />
            {/* salaryDate removed */}

            {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}

            <Button fullWidth type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-400">
            ¿Ya tenés cuenta? <Link className="font-semibold text-gold-500" to="/login">Iniciar sesión</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}