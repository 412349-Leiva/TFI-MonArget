import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

const inputCls =
  'w-full rounded-xl bg-[#0a1525] border border-[#243a5c] text-white px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition';

const RegisterPage = () => {
  const { register } = useAuth();
  const [params] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.get('email') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await register({ name, email });
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar la cuenta. Intentá nuevamente.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      backTo="/login"
      backLabel="← Volver al inicio de sesión"
      title="Registrarse"
      subtitle="Ingresá tu nombre y correo. Te enviamos un código de verificación."
      footer={(
        <p>
          Al registrarte, aceptás nuestros{' '}
          <Link to="/terminos" className="text-slate-300 hover:text-white underline underline-offset-2 transition-colors">
            Términos de servicio
          </Link>
          {' '}y la{' '}
          <Link to="/privacidad" className="text-slate-300 hover:text-white underline underline-offset-2 transition-colors">
            Política de privacidad
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Nombre</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mon Argent"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="MonArgent@example.com"
            className={inputCls}
          />
        </div>

        {errorMsg && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/25 px-4 py-3 rounded-xl">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-amber-400 to-[#E8B923] text-slate-900 font-semibold py-3.5 rounded-xl shadow-[0_4px_24px_rgba(232,185,35,0.25)] hover:brightness-110 active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Enviar código'}
        </button>
      </form>

      <p className="text-center auth-footer-link mt-5">
        ¿Ya tenés una cuenta?{' '}
        <Link to="/login" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
          Iniciá sesión
        </Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
