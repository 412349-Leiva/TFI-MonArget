import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

const LoginPage = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="MonArgent"
      subtitle="Gestión financiera personal"
      footer={(
        <p className="font-label-sm text-on-surface-variant opacity-60">
          Al iniciar sesión, aceptás nuestros{' '}
          <a href="#" className="underline">Términos de servicio</a> y{' '}
          <a href="#" className="underline">Política de privacidad</a>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pablo@example.com"
            className="w-full rounded-lg input-recessed border-none focus:ring-1 focus:ring-primary text-on-surface px-4 py-3 transition-all placeholder:text-surface-container-highest"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block font-label-sm text-label-sm text-on-surface-variant">
              Contraseña
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg input-recessed border-none focus:ring-1 focus:ring-primary text-on-surface px-4 py-3 pr-12 transition-all placeholder:text-surface-container-highest"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-error-container/20 border border-error/30 text-error text-label-sm px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-container text-on-primary-container font-title-md py-4 rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Iniciando...</span>
            </>
          ) : (
            'Iniciar sesión'
          )}
        </button>
      </form>

      <div className="flex items-center gap-4 py-2">
        <div className="h-[1px] flex-1 bg-outline-variant" />
        <span className="font-label-sm text-on-surface-variant">O</span>
        <div className="h-[1px] flex-1 bg-outline-variant" />
      </div>

      <div className="text-center">
        <p className="font-label-sm text-on-surface-variant">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-primary hover:underline font-bold">
            Registrate acá
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
