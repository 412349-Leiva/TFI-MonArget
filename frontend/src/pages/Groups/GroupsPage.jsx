import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import GroupDetailView from '../../components/groups/GroupDetailView';
import MpHostWarning from '../../components/groups/MpHostWarning';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import { mercadoPagoService } from '../../services/mercadoPagoService';
import { ChevronRight, Loader2 } from 'lucide-react';
import { formatPeso, formatPesoBalance } from '../../utils/format';
import { consumeMpConnectPending, markMpConnectPending } from '../../utils/authRedirect';
import { isStandalonePwa, refreshPwaAfterOAuth, shouldOpenOAuthInSystemBrowser } from '../../utils/pwa';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, refreshUser, clearSession } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aliasInput, setAliasInput] = useState(user?.mpAlias || '');
  const [savingAlias, setSavingAlias] = useState(false);
  const [mpConnecting, setMpConnecting] = useState(false);
  const [mpDisconnecting, setMpDisconnecting] = useState(false);
  const [showMpConnectModal, setShowMpConnectModal] = useState(false);
  const [mpAuthUrl, setMpAuthUrl] = useState('');
  const [mpOpenedExternally, setMpOpenedExternally] = useState(false);
  const mpResumeStarted = useRef(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [groupsRes, invitationsRes] = await Promise.all([
        groupService.list(),
        groupService.listInvitations(),
      ]);
      setGroups(groupsRes.data);
      setInvitations(invitationsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los grupos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setAliasInput(user?.mpAlias || '');
  }, [user?.mpAlias]);

  useEffect(() => {
    const mpStatus = searchParams.get('mp');
    const mpMessage = searchParams.get('mpMessage');
    if (!mpStatus) return;

    if (mpStatus === 'connected') {
      setSuccess('Mercado Pago conectado correctamente.');
      refreshUser?.();
      void refreshPwaAfterOAuth();
    } else if (mpStatus === 'error') {
      setError(mpMessage || 'No se pudo conectar Mercado Pago.');
    }

    searchParams.delete('mp');
    searchParams.delete('mpMessage');
    searchParams.delete('mpTs');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, refreshUser]);

  const handleConnectMercadoPago = async () => {
    setMpConnecting(true);
    setError('');
    setMpAuthUrl('');
    setMpOpenedExternally(false);
    try {
      const { url, openedExternally } = await mercadoPagoService.connect();
      setMpAuthUrl(url);
      setMpOpenedExternally(openedExternally);
      if (openedExternally) {
        setMpConnecting(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar la conexión con Mercado Pago. Volvé a iniciar sesión e intentá de nuevo.');
      setMpConnecting(false);
      setShowMpConnectModal(false);
    }
  };

  const ensureSessionForMp = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      markMpConnectPending();
      clearSession();
      navigate('/login');
      return false;
    }
    try {
      await refreshUser?.();
      return true;
    } catch {
      markMpConnectPending();
      clearSession();
      navigate('/login');
      return false;
    }
  }, [navigate, refreshUser, clearSession]);

  const openMpConnectModal = async () => {
    setError('');
    if (!(await ensureSessionForMp())) return;
    setShowMpConnectModal(true);
  };

  useEffect(() => {
    if (!user || mpResumeStarted.current) return;
    if (!consumeMpConnectPending()) return;

    mpResumeStarted.current = true;
    setSuccess('Sesión renovada. Tocá Continuar para ir a Mercado Pago.');
    setShowMpConnectModal(true);
  }, [user]);

  const handleDisconnectMercadoPago = async () => {
    setMpDisconnecting(true);
    setError('');
    try {
      await mercadoPagoService.disconnect();
      await refreshUser?.();
      setSuccess('Mercado Pago desconectado.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo desconectar Mercado Pago.');
    } finally {
      setMpDisconnecting(false);
    }
  };

  const openGroup = async (groupId) => {
    setError('');
    try {
      const { data } = await groupService.getById(groupId);
      setSelectedGroup(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo abrir el grupo.');
    }
  };

  const handleSaveAlias = async (e) => {
    e.preventDefault();
    setSavingAlias(true);
    setError('');
    try {
      await updateProfile(aliasInput.trim());
      setSuccess('Alias guardado.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el alias.');
    } finally {
      setSavingAlias(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await groupService.create({ title: newTitle, description: newDescription });
      setShowCreate(false);
      setNewTitle('');
      setNewDescription('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el grupo.');
    }
  };


  const handleAcceptInvitation = async (id) => {    setError('');
    try {
      await groupService.acceptInvitation(id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo aceptar la invitación.');
    }
  };

  const handleRejectInvitation = async (id) => {
    setError('');
    try {
      await groupService.rejectInvitation(id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo rechazar la invitación.');
    }
  };

  const mpConnectModal = showMpConnectModal && (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#284567] bg-[#0f2543] p-6 space-y-4">
        <h3 className="text-lg font-semibold">Conectar Mercado Pago</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Te vamos a redirigir al sitio oficial de Mercado Pago para autorizar la app.
          Si ves el login de Mercado Libre, es normal: es la misma cuenta.
        </p>
        {(isStandalonePwa() || shouldOpenOAuthInSystemBrowser()) && (
          <p className="text-xs text-amber-200/90 leading-relaxed rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2">
            En el celular, Mercado Pago se abre en Safari o Chrome (no dentro del ícono de la app).
            Cuando termines, volvé a MonArgent desde el navegador o reabrí la app.
          </p>
        )}
        <p className="text-xs text-slate-500">
          Usá el email y la contraseña de tu cuenta de Mercado Pago / Mercado Libre.
        </p>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setShowMpConnectModal(false); setMpConnecting(false); }}
            disabled={mpConnecting}
            className="flex-1 rounded-lg border border-[#284567] py-2.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConnectMercadoPago}
            disabled={mpConnecting}
            className="flex-1 rounded-lg bg-[#009ee3] text-white py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {mpConnecting ? 'Redirigiendo...' : 'Continuar'}
          </button>
        </div>
        {mpOpenedExternally && mpAuthUrl && (
          <div className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-3 text-sm text-sky-100 space-y-2">
            <p>Si no se abrió Mercado Pago, tocá el botón de abajo.</p>
            <a
              href={mpAuthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#009ee3] text-white py-2.5 text-sm font-semibold"
            >
              Abrir Mercado Pago
            </a>
          </div>
        )}
        {mpAuthUrl && !mpOpenedExternally && (
          <p className="text-xs text-slate-500 pt-1">
            Si no se abre Mercado Pago,{' '}
            <a href={mpAuthUrl} className="text-sky-300 underline">
              tocá acá
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );

  if (selectedGroup) {
    return (
      <Layout>
        <div className="text-white max-w-xl mx-auto">
          <GroupDetailView
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
            onRefresh={(data) => {
              setSelectedGroup(data);
              loadData();
            }}
            onError={setError}
          />
          {error && <p className="text-sm text-red-300 text-center mt-2">{error}</p>}
        </div>
        {mpConnectModal}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-white max-w-xl mx-auto">
        <MpHostWarning />

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-400 text-slate-900 font-semibold shadow-lg hover:brightness-110"
            aria-label="Nuevo grupo"
          >
            <span className="text-xl leading-none">+</span>
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-[#284567] bg-[#0f2543] p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Tu Mercado Pago</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {user?.mpConnected
                ? `Conectado${user?.mpAlias ? ` · ${user.mpAlias}` : ''}. Otros te pagan con el monto listo.`
                : 'Conectá tu cuenta para cobrar con un toque. Si no tenés MP, podés guardar tu alias o pagar copiando el del cobrador.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {user?.mpConnected ? (
              <button
                type="button"
                onClick={handleDisconnectMercadoPago}
                disabled={mpDisconnecting}
                className="rounded-lg border border-[#284567] px-4 py-2 text-sm text-slate-300"
              >
                {mpDisconnecting ? 'Desconectando...' : 'Desconectar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={openMpConnectModal}
                disabled={mpConnecting}
                className="rounded-lg bg-[#009ee3] px-4 py-2 text-sm font-semibold text-white"
              >
                {mpConnecting ? 'Redirigiendo...' : 'Conectar con Mercado Pago'}
              </button>
            )}
          </div>
          <form onSubmit={handleSaveAlias} className="flex gap-2">
            <input
              minLength={3}
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="Tu alias (opcional si conectás MP)"
              className="flex-1 rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm text-slate-100"
            />
            <button
              type="submit"
              disabled={savingAlias || !aliasInput.trim()}
              className="rounded-lg border border-[#284567] px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
            >
              {savingAlias ? '...' : 'Guardar'}
            </button>
          </form>
          <p className="text-xs text-slate-500">
            Sin MP conectado, otros pueden pagarte copiando tu alias manualmente.
          </p>
        </div>

        {success && <p className="text-sm text-emerald-300 mb-3">{success}</p>}

        {invitations.length > 0 && (
          <section className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-300">Invitaciones pendientes</p>
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {inv.invitedByName} te invitó a <strong>{inv.groupTitle}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptInvitation(inv.id)}
                    className="rounded-lg bg-amber-400 text-slate-900 px-3 py-1 text-xs font-semibold"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectInvitation(inv.id)}
                    className="rounded-lg border border-[#284567] px-3 py-1 text-xs"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {groups.length === 0 ? (
              <p className="text-slate-400 text-sm">Todavía no tenés grupos. Creá uno para empezar.</p>
            ) : (
              groups.map((group) => (
                <article
                  key={group.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openGroup(group.id)}
                  onKeyDown={(e) => e.key === 'Enter' && openGroup(group.id)}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 md:p-4 cursor-pointer transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-item-title truncate">{group.title}</p>
                      <p className="text-item-meta">{group.memberCount} miembros</p>
                      <p className="text-item-meta pt-0.5">
                        <span className="text-label-caps mr-2">Total</span>
                        <span className="font-amount text-slate-200">{formatPeso(group.totalExpenses)}</span>
                      </p>
                      <p className="text-item-meta">
                        <span className="text-label-caps mr-2">Balance</span>
                        <span className={`font-amount ${Number(group.myBalance) >= 0 ? 'text-money-income' : 'text-money-expense'}`}>
                          {formatPesoBalance(group.myBalance)}
                        </span>
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-slate-500 mt-1 shrink-0" />
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateGroup}
              className="w-full max-w-md rounded-2xl border border-[#284567] bg-[#0f2543] p-6 space-y-4"
            >
              <h3 className="text-xl font-semibold">Nuevo grupo</h3>
              <input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nombre del grupo"
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-4 py-3"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-4 py-3 min-h-[80px]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-[#284567] py-2"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-amber-400 text-slate-900 py-2 font-semibold">
                  Crear
                </button>
              </div>
            </form>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        {mpConnectModal}
      </div>
    </Layout>
  );
};

export default GroupsPage;
