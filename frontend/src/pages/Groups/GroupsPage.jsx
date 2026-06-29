import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import GroupDetailView from '../../components/groups/GroupDetailView';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import { mercadoPagoService } from '../../services/mercadoPagoService';
import { ChevronRight, Loader2 } from 'lucide-react';
import { formatPeso, formatPesoBalance } from '../../utils/format';

const GroupsPage = () => {
  const { user, updateProfile, refreshUser } = useAuth();
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
    } else if (mpStatus === 'error') {
      setError(mpMessage || 'No se pudo conectar Mercado Pago.');
    }

    searchParams.delete('mp');
    searchParams.delete('mpMessage');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, refreshUser]);

  const handleConnectMercadoPago = async () => {
    setMpConnecting(true);
    setError('');
    try {
      await mercadoPagoService.connect();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar la conexión con Mercado Pago.');
      setMpConnecting(false);
    }
  };

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

  if (!user?.mpAlias && !user?.mpConnected) {
    return (
      <Layout>
        <div className="text-white max-w-md mx-auto rounded-2xl border border-[#284567] bg-[#0f2543] p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Configurá Mercado Pago</h2>
          <p className="text-sm text-slate-400">
            Conectá tu cuenta para recibir pagos con Checkout Pro en gastos grupales, o cargá tu alias manualmente.
          </p>

          {user?.mpConnected ? (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              Cuenta de Mercado Pago conectada.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectMercadoPago}
              disabled={mpConnecting}
              className="w-full rounded-lg bg-[#009ee3] text-white py-3 font-semibold disabled:opacity-60"
            >
              {mpConnecting ? 'Redirigiendo...' : 'Conectar con Mercado Pago'}
            </button>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#284567]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f2543] px-2 text-slate-500">o alias manual</span>
            </div>
          </div>

          <form onSubmit={handleSaveAlias} className="space-y-4">
            <input
              required
              minLength={3}
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="tu.alias.mp"
              className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-4 py-3 text-slate-100"
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            {success && <p className="text-sm text-emerald-300">{success}</p>}
            <button
              type="submit"
              disabled={savingAlias}
              className="w-full rounded-lg bg-amber-400 text-slate-900 py-3 font-semibold disabled:opacity-60"
            >
              {savingAlias ? 'Guardando...' : 'Guardar alias'}
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  if (selectedGroup) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-white max-w-xl mx-auto">
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

        <div className="mb-4 rounded-xl border border-[#284567] bg-[#0f2543] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Mercado Pago</p>
            <p className="text-xs text-slate-400">
              {user?.mpConnected
                ? `Conectado${user?.mpAlias ? ` · alias ${user.mpAlias}` : ''}`
                : 'Conectá tu cuenta para que otros paguen con Checkout Pro'}
            </p>
          </div>
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
              onClick={handleConnectMercadoPago}
              disabled={mpConnecting}
              className="rounded-lg bg-[#009ee3] px-4 py-2 text-sm font-semibold text-white"
            >
              {mpConnecting ? 'Redirigiendo...' : 'Conectar'}
            </button>
          )}
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
      </div>
    </Layout>
  );
};

export default GroupsPage;
