import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';

const VerificationPage = () => {
  const { verifyCode, logout } = useAuth();
  
  // Estado para los 6 dígitos individuales del código OTP
  const [code, setCode] = useState(new Array(6).fill(""));
  
  // Estados de feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
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
      await verifyCode(fullCode);
    } catch (error) {
      const message = error.response?.data?.message || 'Código inválido o vencido. Verificá y volvé a intentar.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
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
              onClick={() => alert("Simulación: Código reenviado con éxito.")}
              className="text-[#D9B44A] font-bold hover:underline ml-1 cursor-pointer bg-transparent border-none outline-none"
            >
              Reenviar código
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerificationPage;