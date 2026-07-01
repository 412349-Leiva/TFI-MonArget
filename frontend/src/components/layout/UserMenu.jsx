import React, { useEffect, useRef, useState } from 'react';
import { Eye, FileText, KeyRound, LogOut, X } from 'lucide-react';
import apiClient from '../../services/api';
import { documentService } from '../../services/documentService';
import { getErrorMessage } from '../../utils/apiErrors';
import { formatPeso } from '../../utils/format';
import { openProofBlob, resolveProofContentType } from '../../utils/proofBlob';
import useKeyboardOffset from '../../hooks/useKeyboardOffset';

const UserMenu = ({ initials, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('menu');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [openingDocId, setOpeningDocId] = useState(null);
  const keyboardOffset = useKeyboardOffset(open && panel === 'password');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
        setPanel('menu');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setPanel('menu');
    setErrorMsg('');
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    setErrorMsg('');
    try {
      const { data } = await documentService.listReceived();
      setDocuments(data);
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'No se pudieron cargar los documentos.'));
    } finally {
      setLoadingDocs(false);
    }
  };

  const openDocuments = () => {
    setPanel('documents');
    setErrorMsg('');
    loadDocuments();
  };

  const openDocument = async (doc) => {
    setOpeningDocId(doc.id);
    setErrorMsg('');
    try {
      const response = await documentService.download(
        doc.groupId,
        doc.fromMemberKey,
        doc.toMemberKey,
      );
      const contentType = resolveProofContentType(response.headers, doc.contentType);
      openProofBlob(response.data, contentType);
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'No se pudo abrir el documento.'));
    } finally {
      setOpeningDocId(null);
    }
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
      setPanel('menu');
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
            className="fixed left-0 right-0 top-14 bottom-0 z-50 flex flex-col bg-[#0f2543] border-t border-[#284567] shadow-2xl p-4 overflow-y-auto md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:bottom-auto md:w-80 md:rounded-xl md:border md:max-h-[80vh]"
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

            {panel === 'menu' && (
              <div className="space-y-1 flex-1 md:flex-none">
                <button
                  type="button"
                  onClick={openDocuments}
                  className="w-full flex items-center gap-2 px-3 py-3 md:py-2 rounded-lg text-sm text-slate-200 hover:bg-[#1a3457] transition-colors"
                >
                  <FileText size={16} />
                  Mis documentos
                </button>
                <button
                  type="button"
                  onClick={() => { setPanel('password'); setErrorMsg(''); }}
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
            )}

            {panel === 'documents' && (
              <div className="space-y-3 flex-1 md:flex-none">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-100">Mis documentos</p>
                  <button
                    type="button"
                    onClick={() => setPanel('menu')}
                    className="text-xs text-slate-400 hover:text-amber-300"
                  >
                    Volver
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Comprobantes que te enviaron en grupos.
                </p>
                {loadingDocs ? (
                  <p className="text-sm text-slate-400">Cargando...</p>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-slate-500">Todavía no recibiste comprobantes.</p>
                ) : (
                  <ul className="space-y-2">
                    {documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="rounded-lg border border-[#284567] bg-[#0b2034]/50 p-3 text-sm"
                      >
                        <p className="font-medium text-slate-100">{doc.groupTitle}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          De {doc.fromMemberName}
                          {doc.amount != null && (
                            <> · {formatPeso(doc.amount, { decimals: 2 })}</>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {doc.confirmed ? 'Confirmado' : 'Pendiente de confirmación'}
                        </p>
                        <button
                          type="button"
                          disabled={openingDocId === doc.id}
                          onClick={() => openDocument(doc)}
                          className="mt-2 flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 disabled:opacity-60"
                        >
                          <Eye size={14} />
                          {openingDocId === doc.id ? 'Abriendo...' : 'Ver comprobante'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {errorMsg && <p className="text-xs text-red-300">{errorMsg}</p>}
              </div>
            )}

            {panel === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-3 flex-1 md:flex-none">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-100">Cambiar contraseña</p>
                  <button
                    type="button"
                    onClick={() => setPanel('menu')}
                    className="text-xs text-slate-400 hover:text-amber-300"
                  >
                    Volver
                  </button>
                </div>
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
                    onClick={() => setPanel('menu')}
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
