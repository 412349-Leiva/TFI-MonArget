import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-4 py-12 antialiased">
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al login
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-2">Recuperar acceso</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Te enviaremos un código de 6 dígitos a tu correo
          </p>
        </div>

        <div className="glass-card rounded-xl p-8 shadow-2xl space-y-6">
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
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
