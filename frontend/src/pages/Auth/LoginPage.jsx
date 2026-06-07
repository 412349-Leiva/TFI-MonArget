import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-4 py-12 antialiased">

      {/* Background Elements */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-2">MonArgent</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Gestión Financiera Personal</p>
        </div>

        {/* Form Container */}
        <div className="glass-card rounded-xl p-8 shadow-2xl space-y-6">

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Input */}
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
                Correo Electrónico
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

            {/* Password Input */}
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
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

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-error-container/20 border border-error/30 text-error text-label-sm px-4 py-3 rounded-lg">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
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
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
            <span className="font-label-sm text-on-surface-variant">O</span>
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="font-label-sm text-on-surface-variant">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline font-bold">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="font-label-sm text-on-surface-variant opacity-60">
            Al iniciar sesión, aceptas nuestros <br />
            <a href="#" className="underline">Términos de Servicio</a> y <a href="#" className="underline">Política de Privacidad</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;