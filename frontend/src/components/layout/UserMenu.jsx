import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, LogOut, X } from 'lucide-react';
import apiClient from '../../services/api';
import { getErrorMessage } from '../../utils/apiErrors';

const UserMenu = ({ initials, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
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

  useEffect(() => {
    if (!open || !showPasswordForm || typeof window === 'undefined' || !window.visualViewport) {
      setKeyboardOffset(0);
      return undefined;
    }

    const update = () => {
      const viewport = window.visualViewport;
      const gap = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardOffset(gap > 40 ? gap : 0);
    };

    update();
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, [open, showPasswordForm]);

  const closeMenu = () => {
    setOpen(false);
    setShowPasswordForm(false);
    setErrorMsg('');
  };

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
      setErrorMsg(getErrorMessage(error, 'No se pudo cambiar la contraseña.'));
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
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMenu}
            aria-hidden
          />
          <div
            className="fixed left-0 right-0 top-14 bottom-0 z-50 flex flex-col bg-[#0f2543] border-t border-[#284567] shadow-2xl p-4 overflow-y-auto md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:bottom-auto md:w-72 md:rounded-xl md:border md:max-h-none"
            style={{ paddingBottom: keyboardOffset ? `${keyboardOffset + 16}px` : undefined }}
          >
            <div className="flex justify-end mb-2 md:hidden">
              <button
                type="button"
                onClick={closeMenu}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a3457]"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>

            {!showPasswordForm ? (
              <div className="space-y-1 flex-1 md:flex-none">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full flex items-center gap-2 px-3 py-3 md:py-2 rounded-lg text-sm text-slate-200 hover:bg-[#1a3457] transition-colors"
                >
                  <KeyRound size={16} />
                  Cambiar contraseña
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-3 md:py-2 rounded-lg text-sm text-red-300 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3 flex-1 md:flex-none">
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
        </>
      )}
    </div>
  );
};

export default UserMenu;
