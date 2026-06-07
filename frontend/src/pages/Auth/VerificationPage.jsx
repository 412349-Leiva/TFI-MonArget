import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

const VerificationPage = () => {
  const { verifyCode, resendCode, logout } = useAuth();
  
  // Estado para los 6 dígitos individuales del código OTP
  const [code, setCode] = useState(new Array(6).fill(""));
  
  // Estados de feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  // Referencias para controlar el salto automático de los inputs
  const inputRefs = useRef([]);

  // Recuperamos el email para mostrárselo al usuario de manera informativa
  const userEmail = localStorage.getItem('user_email_for_verification') || 'tu correo';

  // Hacemos foco automático en el primer casillero al cargar la pantalla
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element, index) => {
    const value = element.value;
    if (isNaN(value)) return; // Solo permitimos números

    let newCode = [...code];
    // Tomamos solo el último carácter ingresado por si copian/pegan
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    // Si el usuario escribió un número, movemos el foco al siguiente casillero
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Si presiona "Borrar" (Backspace) y el casillero está vacío, retrocedemos el foco
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Juntamos los 6 dígitos en un único string
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setErrorMsg('Por favor, completa los 6 dígitos.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Envía el email y el código al endpoint real /api/v1/auth/verify
      await verifyCode({ code: fullCode, password, passwordConfirm });
    } catch (error) {
      const message = error.response?.data?.message || 'Código inválido o vencido. Verificá y volvé a intentar.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMsg('');
    setIsResending(true);
    try {
      await resendCode();
      alert('Te enviamos un nuevo código de verificación.');
    } catch (error) {
      const message = error.response?.data?.message || 'No se pudo reenviar el código.';
      setErrorMsg(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a8a] via-[#0f1c38] to-[#0a1224] flex flex-col items-center justify-center px-6 py-12 antialiased select-none">
      
      {/* Botón sutil para cancelar/volver que limpia la sesión actual */}
      <button 
        onClick={logout}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors duration-200 cursor-pointer"
      >
        <ArrowLeft size={16} /> Volver al Login
      </button>

      {/* Encabezado */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-14 h-14 bg-[#34D399]/10 rounded-2xl flex items-center justify-center border border-[#34D399]/20 mb-4 text-[#34D399]">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-white text-3xl font-semibold tracking-wide font-serif">
          Verificá tu <span className="text-[#D9B44A]">Cuenta</span>
        </h1>
        <p className="text-[#94A3B8] text-xs mt-3 tracking-wide max-w-xs leading-relaxed">
          Ingresá el código de 6 dígitos que enviamos a <br />
          <span className="text-white font-medium break-all">{userEmail}</span>
        </p>
      </div>

      {/* Formulario */}
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Fila de Inputs del Código OTP */}
          <div className="flex justify-between gap-2 px-2">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 bg-[#162238] border-2 border-transparent text-center text-xl font-bold text-white rounded-xl outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all duration-150 shadow-inner"
              />
            ))}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase block pl-1">
              Nueva contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#D9B44A] transition-colors duration-200">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
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

          {/* Password confirm */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase block pl-1">
              Repetir contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#D9B44A] transition-colors duration-200">
                <Lock size={18} />
              </div>
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                className="w-full bg-[#162238] border border-transparent text-white placeholder-[#475569] text-sm rounded-xl pl-11 pr-12 py-3.5 outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all duration-200 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-white transition-colors duration-200"
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-xs font-medium px-4 py-3 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Botón de Confirmación */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D9B44A] hover:bg-[#c29e3d] disabled:bg-[#D9B44A]/50 text-[#0B1528] font-bold text-sm py-4 rounded-xl shadow-lg shadow-[#D9B44A]/15 active:scale-[0.99] transform transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              'Confirmar código'
            )}
          </button>
        </form>

        {/* Reenvío de código */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-[#94A3B8]">
            ¿No te llegó el correo?{' '}
            <button 
              type="button"
              disabled={isResending}
              onClick={handleResendCode}
              className="text-[#D9B44A] font-bold hover:underline ml-1 cursor-pointer bg-transparent border-none outline-none"
            >
              {isResending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerificationPage;