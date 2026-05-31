import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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
      // Envía las credenciales reales a tu endpoint de Spring Boot /api/v1/auth/login
      await login({ email, password });
    } catch (error) {
      // Captura los errores de validación o credenciales incorrectas de tu Backend
      const message = error.response?.data?.message || 'Email o contraseña incorrectos';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a8a] via-[#0f1c38] to-[#0a1224] flex flex-col items-center justify-center px-6 py-12 antialiased select-none">
      
      {/* Contenedor del Logo de MonArgent */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-[#D9B44A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D9B44A]/10 mb-3 transform transition hover:scale-105 duration-300">
          <span className="text-[#0B1528] text-2xl font-bold tracking-tight">MA</span>
        </div>
        <h1 className="text-white text-3xl font-semibold tracking-wide font-serif">
          Mon<span className="text-[#D9B44A]">Argent</span>
        </h1>
      </div>

      {/* Tarjeta del Formulario */}
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campo Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase block pl-1">
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#D9B44A] transition-colors duration-200">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tamara@ejemplo.com"
                className="w-full bg-[#162238] border border-transparent text-white placeholder-[#475569] text-sm rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all duration-200 shadow-inner"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase block pl-1">
              Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#D9B44A] transition-colors duration-200">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#162238] border border-transparent text-white placeholder-[#475569] text-sm rounded-xl pl-11 pr-12 py-3.5 outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all duration-200 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-white transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Alerta de Error de Autenticación */}
          {errorMsg && (
            <div className="bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-xs font-medium px-4 py-3 rounded-xl animate-shake">
              {errorMsg}
            </div>
          )}

          {/* Enlace de Contraseña Olvidada */}
          <div className="text-right">
            <a href="#forgot" className="text-xs font-semibold text-[#D9B44A] hover:underline transition duration-200">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón de Acción Principal */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D9B44A] hover:bg-[#c29e3d] disabled:bg-[#D9B44A]/50 text-[#0B1528] font-bold text-sm py-4 rounded-xl shadow-lg shadow-[#D9B44A]/15 active:scale-[0.99] transform transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Footer de navegación pública */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-[#94A3B8]">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-[#D9B44A] font-bold hover:underline ml-1">
              Registrarse
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;