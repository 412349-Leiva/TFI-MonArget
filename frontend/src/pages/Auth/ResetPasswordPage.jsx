import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Loader2, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const { resetPassword, resendPasswordResetCode } = useAuth();

  const [code, setCode] = useState(new Array(6).fill(''));
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef([]);
  const userEmail = localStorage.getItem('user_email_for_password_reset') || '';

  useEffect(() => {
    if (!userEmail) return;
    inputRefs.current[0]?.focus();
  }, [userEmail]);

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-on-surface-variant">No hay una recuperación de contraseña en curso.</p>
          <Link to="/forgot-password" className="text-primary hover:underline font-medium">
            Solicitar código
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (element, index) => {
    const value = element.value;
    if (Number.isNaN(Number(value))) return;

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Completá los 6 dígitos del código.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ code: fullCode, password, passwordConfirm });
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Código inválido o vencido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg('');
    setIsResending(true);
    try {
      await resendPasswordResetCode();
      alert('Te enviamos un nuevo código de recuperación.');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'No se pudo reenviar el código.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a8a] via-[#0f1c38] to-[#0a1224] flex flex-col items-center justify-center px-6 py-12 antialiased select-none">
      <Link
        to="/forgot-password"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Cambiar email
      </Link>

      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-14 h-14 bg-[#D9B44A]/10 rounded-2xl flex items-center justify-center border border-[#D9B44A]/20 mb-4 text-[#D9B44A]">
          <KeyRound size={28} />
        </div>
        <h1 className="text-white text-3xl font-semibold tracking-wide font-serif">
          Nueva <span className="text-[#D9B44A]">contraseña</span>
        </h1>
        <p className="text-[#94A3B8] text-xs mt-3 tracking-wide max-w-xs leading-relaxed">
          Ingresá el código enviado a <br />
          <span className="text-white font-medium break-all">{userEmail}</span>
        </p>
      </div>

      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2 px-2">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => { inputRefs.current[index] = el; }}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 bg-[#162238] border-2 border-transparent text-center text-xl font-bold text-white rounded-xl outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all duration-150 shadow-inner"
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase block pl-1">
              Nueva contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#D9B44A] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-[#162238] border border-transparent text-white placeholder-[#475569] text-sm rounded-xl pl-11 pr-12 py-3.5 outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#94A3B8] tracking-widest uppercase block pl-1">
              Repetir contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#D9B44A] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                className="w-full bg-[#162238] border border-transparent text-white placeholder-[#475569] text-sm rounded-xl pl-11 pr-12 py-3.5 outline-none focus:border-[#D9B44A]/50 focus:bg-[#1a2942] transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-white transition-colors"
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-xs font-medium px-4 py-3 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D9B44A] hover:bg-[#c29e3d] disabled:bg-[#D9B44A]/50 text-[#0B1528] font-bold text-sm py-4 rounded-xl shadow-lg active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-[#94A3B8]">
            ¿No te llegó el correo?{' '}
            <button
              type="button"
              disabled={isResending}
              onClick={handleResend}
              className="text-[#D9B44A] font-bold hover:underline ml-1 bg-transparent border-none outline-none cursor-pointer"
            >
              {isResending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
