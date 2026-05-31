import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  const { register } = useAuth();
  
  // Estados de los campos (adecuados a tu estructura del backend)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados de feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      // Envía el RegisterRequest real a tu endpoint /api/v1/auth/register
      await register({ name, email, password });
    } catch (error) {
      // Captura si el email ya existe o si hay un error de validación
      const message = error.response?.data?.message || 'Error al registrar la cuenta. Intentá nuevamente.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a8a] via-[#0f1c38] to-[#0a1224] flex flex-col items-center justify-center px-6 py-12 antialiased select-none">
      
      {/* Encabezado */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-white text-3xl font-semibold tracking-wide font-serif">
          Crear <span className="text-[#D9B44A]">Cuenta</span>
        </h1>
        <p className="text-[#94A3B8] text-xs mt-2 tracking-wide text-center max-w-xs">
          Unite a MonArgent y empezá a gestionar tus finanzas de forma inteligente.
        </p>
      </div>

      {/* Tarjeta del Formulario */}
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Campo Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase block pl-1">
              Nombre Completo
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#D9B44A] transition-colors duration-200">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tamara Argento"
                className="w-full bg-[#162238] border border-transparent text-white placeholder-[#475569] text-sm rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all duration-200 shadow-inner"
              />
            </div>
          </div>

          {/* Campo Email */}
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
                placeholder="Mínimo 6 caracteres"
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

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-xs font-medium px-4 py-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D9B44A] hover:bg-[#c29e3d] disabled:bg-[#D9B44A]/50 text-[#0B1528] font-bold text-sm py-4 rounded-xl shadow-lg shadow-[#D9B44A]/15 active:scale-[0.99] transform transition duration-150 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              'Registrarme'
            )}
          </button>
        </form>

        {/* Link para volver al Login */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-[#94A3B8]">
            ¿Ya tenés una cuenta?{' '}
            <Link to="/login" className="text-[#D9B44A] font-bold hover:underline ml-1">
              Iniciá sesión
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;