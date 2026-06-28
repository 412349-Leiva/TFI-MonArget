import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';

const ForgotPasswordPage = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'No se pudo enviar el código de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      backTo="/login"
      backLabel="← Volver al login"
      title="Recuperar acceso"
      subtitle="Te enviaremos un código de 6 dígitos a tu correo"
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
              <span>Enviando...</span>
            </>
          ) : (
            'Enviar código'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
