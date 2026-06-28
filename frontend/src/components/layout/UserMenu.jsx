import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import apiClient from '../../services/api';

const UserMenu = ({ initials, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
        setShowPasswordForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
        passwordConfirm: confirmPassword,
      });
      setSuccessMsg('Contraseña actualizada.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full border border-[#2a4466] bg-[#102946] text-slate-100 text-xs font-semibold flex items-center justify-center"
        aria-label="Menú de perfil"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#284567] bg-[#0f2543] shadow-2xl z-50 p-3">
          {!showPasswordForm ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-[#1a3457] transition-colors"
              >
                <KeyRound size={16} />
                Cambiar contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <p className="text-sm font-medium text-slate-100">Cambiar contraseña</p>
              <input
                type="password"
                required
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm text-slate-100"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm text-slate-100"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Repetir nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm text-slate-100"
              />
              {errorMsg && <p className="text-xs text-red-300">{errorMsg}</p>}
              {successMsg && <p className="text-xs text-emerald-300">{successMsg}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 rounded-lg border border-[#284567] px-3 py-2 text-sm text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-amber-400 text-slate-900 px-3 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMenu;
