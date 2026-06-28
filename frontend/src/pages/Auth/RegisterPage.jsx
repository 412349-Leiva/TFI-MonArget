import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

const RegisterPage = () => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
      backLabel="← Volver al login"
      title="Crear cuenta"
      subtitle="Paso 1 de 2: ingresá tu nombre y correo para recibir el código de verificación."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
            Nombre
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tamara Leiva"
            className="w-full rounded-lg input-recessed border-none focus:ring-1 focus:ring-primary text-on-surface px-4 py-3 transition-all placeholder:text-surface-container-highest"
          />
        </div>

        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tamara@ejemplo.com"
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
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Enviar código'}
        </button>
      </form>

      <div className="text-center">
        <p className="font-label-sm text-on-surface-variant">
          ¿Ya tenés una cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
