import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import { ChevronLeft, ChevronRight, Loader2, UserPlus, Users } from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Math.abs(Number(value) || 0));

const GroupsPage = () => {
  const { user, updateProfile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aliasInput, setAliasInput] = useState(user?.mpAlias || '');
  const [savingAlias, setSavingAlias] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [guestForm, setGuestForm] = useState({
    name: '',
    mpAlias: '',
    expenseTitle: '',
    expenseAmount: '',
  });

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

  const summary = useMemo(() => {
    const owedToMe = groups
      .filter((g) => Number(g.myBalance) > 0)
      .reduce((sum, g) => sum + Number(g.myBalance), 0);
    const iOwe = groups
      .filter((g) => Number(g.myBalance) < 0)
      .reduce((sum, g) => sum + Math.abs(Number(g.myBalance)), 0);
    return { owedToMe, iOwe };
  }, [groups]);

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

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setError('');
    try {
      await groupService.invite(selectedGroup.id, inviteEmail);
      setInviteEmail('');
      alert('Invitación enviada.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la invitación.');
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setError('');
    try {
      const payload = {
        name: guestForm.name,
        mpAlias: guestForm.mpAlias,
        expenseTitle: guestForm.expenseTitle || undefined,
        expenseAmount: guestForm.expenseAmount ? Number(guestForm.expenseAmount) : undefined,
      };
      const { data } = await groupService.addGuest(selectedGroup.id, payload);
      setSelectedGroup(data);
      setGuestForm({ name: '', mpAlias: '', expenseTitle: '', expenseAmount: '' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo agregar al integrante.');
    }
  };

  const handleAcceptInvitation = async (id) => {
    setError('');
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

  if (!user?.mpAlias) {
    return (
      <Layout>
        <div className="text-white max-w-md mx-auto rounded-2xl border border-[#284567] bg-[#0f2543] p-6">
          <h2 className="text-2xl font-semibold mb-2">Configurá tu alias</h2>
          <p className="text-sm text-slate-400 mb-4">
            Necesitamos tu alias de Mercado Pago para los gastos grupales y cobros entre integrantes.
          </p>
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
        <div className="text-white max-w-xl mx-auto space-y-4">
          <button
            type="button"
            onClick={() => setSelectedGroup(null)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-300"
          >
            <ChevronLeft size={16} /> Volver a grupos
          </button>

          <div className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
            <h2 className="text-2xl font-semibold">{selectedGroup.title}</h2>
            {selectedGroup.description && (
              <p className="text-sm text-slate-400 mt-1">{selectedGroup.description}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total</p>
                <p className="text-2xl font-mono text-amber-100">{formatCurrency(selectedGroup.totalExpenses)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Tu balance</p>
                <p className={`text-2xl font-mono ${Number(selectedGroup.myBalance) >= 0 ? 'text-amber-300' : 'text-red-300'}`}>
                  {Number(selectedGroup.myBalance) >= 0 ? '+' : '-'} {formatCurrency(selectedGroup.myBalance)}
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users size={16} /> Miembros ({selectedGroup.memberCount})
            </h3>
            <ul className="space-y-2 text-sm">
              {selectedGroup.members?.map((member) => (
                <li key={member.guest ? `guest-${member.guestId}` : member.userId} className="flex justify-between border-b border-[#284567]/60 pb-2">
                  <span>
                    {member.name}
                    {member.guest && <span className="ml-2 text-xs text-slate-500">(sin app)</span>}
                  </span>
                  <span className="text-amber-300 font-mono">{member.mpAlias || '—'}</span>
                </li>
              ))}
            </ul>
          </section>

          {selectedGroup.expenses?.length > 0 && (
            <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
              <h3 className="font-semibold mb-3">Gastos</h3>
              <ul className="space-y-2 text-sm">
                {selectedGroup.expenses.map((expense) => (
                  <li key={expense.id} className="flex justify-between border-b border-[#284567]/60 pb-2">
                    <div>
                      <p>{expense.title}</p>
                      <p className="text-xs text-slate-500">Pagó {expense.paidByName}</p>
                    </div>
                    <span className="font-mono text-amber-100">{formatCurrency(expense.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus size={16} /> Invitar por correo
            </h3>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-amber-400 text-slate-900 px-4 py-2 text-sm font-semibold">
                Invitar
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 space-y-3">
            <h3 className="font-semibold">Agregar sin app</h3>
            <p className="text-xs text-slate-400">
              Nombre, alias y opcionalmente qué compró y cuánto gastó.
            </p>
            <form onSubmit={handleAddGuest} className="space-y-2">
              <input
                required
                value={guestForm.name}
                onChange={(e) => setGuestForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre"
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
              />
              <input
                required
                value={guestForm.mpAlias}
                onChange={(e) => setGuestForm((prev) => ({ ...prev, mpAlias: e.target.value }))}
                placeholder="Alias Mercado Pago"
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
              />
              <input
                value={guestForm.expenseTitle}
                onChange={(e) => setGuestForm((prev) => ({ ...prev, expenseTitle: e.target.value }))}
                placeholder="Qué compró (opcional)"
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={guestForm.expenseAmount}
                onChange={(e) => setGuestForm((prev) => ({ ...prev, expenseAmount: e.target.value }))}
                placeholder="Monto (opcional)"
                className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
              />
              <button type="submit" className="w-full rounded-lg bg-[#1a3457] text-slate-100 py-2 text-sm font-medium">
                Agregar al grupo
              </button>
            </form>
          </section>

          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-white max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-semibold">Gastos grupales</h2>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-amber-400 text-slate-900 px-5 py-2 font-semibold text-sm"
          >
            + Nuevo grupo
          </button>
        </div>

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
                  className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 cursor-pointer hover:border-amber-400/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{group.title}</p>
                      <p className="text-sm text-slate-400">{group.memberCount} miembros</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total</p>
                      <p className="text-3xl font-mono text-amber-100 mt-1">{formatCurrency(group.totalExpenses)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Balance</p>
                      <p className={`text-3xl font-mono mt-1 ${Number(group.myBalance) >= 0 ? 'text-amber-300' : 'text-red-300'}`}>
                        {Number(group.myBalance) >= 0 ? '+' : '-'} {formatCurrency(group.myBalance)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {groups.length > 0 && (
          <section className="mt-4 rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">Resumen</p>
            <div className="grid grid-cols-2 divide-x divide-[#284567]">
              <div className="pr-3">
                <p className="text-xs text-slate-400">Te deben</p>
                <p className="text-4xl font-mono text-amber-300 mt-1">+ {formatCurrency(summary.owedToMe)}</p>
              </div>
              <div className="pl-3 text-right">
                <p className="text-xs text-slate-400">Debés</p>
                <p className="text-4xl font-mono text-red-300 mt-1">- {formatCurrency(summary.iOwe)}</p>
              </div>
            </div>
          </section>
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
