import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import GroupDetailView from '../../components/groups/GroupDetailView';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { ChevronRight, Loader2, Trash2 } from 'lucide-react';
import AppModal, { ModalActions, ModalField, modalInputClass } from '../../components/ui/AppModal';
import { formatPeso, formatPesoBalance } from '../../utils/format';

const GroupsPage = () => {
  const { user, updateProfile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aliasInput, setAliasInput] = useState(user?.mpAlias || '');
  const [savingAlias, setSavingAlias] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [listTab, setListTab] = useState('active');
  const [historyGroups, setHistoryGroups] = useState([]);
  const [deletingGroupId, setDeletingGroupId] = useState(null);

  const loadData = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const [groupsRes, invitationsRes, historyRes] = await Promise.all([
        groupService.list(),
        groupService.listInvitations(),
        groupService.listHistory(),
      ]);
      setGroups(groupsRes.data);
      setInvitations(invitationsRes.data);
      setHistoryGroups(historyRes.data);
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'No se pudieron cargar los grupos.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveRefresh(
    () => loadData({ silent: true }),
    { enabled: !selectedGroup, intervalMs: 6000 },
  );

  useEffect(() => {
    setAliasInput(user?.mpAlias || '');
  }, [user?.mpAlias]);

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
    if (!aliasInput.trim()) return;
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

  const handleAcceptInvitation = async (invitation) => {
    setError('');
    try {
      await groupService.acceptInvitation(invitation.id);
      await loadData({ silent: true });
      if (invitation.groupId) {
        await openGroup(invitation.groupId);
      } else {
        await loadData();
      }
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

  const handleDeleteGroup = async (e, group) => {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar "${group.title}" del historial? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingGroupId(group.id);
    setError('');
    try {
      await groupService.delete(group.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el grupo.');
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleGroupRefresh = useCallback((data, options) => {
    setSelectedGroup(data);
    if (!options?.silent) {
      loadData();
    }
  }, [loadData]);

  if (selectedGroup) {
    return (
      <Layout>
        <div className="text-white max-w-xl mx-auto">
          <GroupDetailView
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
            onRefresh={handleGroupRefresh}
            onError={setError}
          />
          {error && <p className="text-sm text-red-300 text-center mt-2">{error}</p>}
        </div>
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

        <div className="mb-4 rounded-xl border border-[#284567] bg-[#0f2543] p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Tu alias para cobros</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Ingresá tu alias (preferentemente de Mercado Pago) para que te transfieran cuando te deben.
            </p>
          </div>
          <form onSubmit={handleSaveAlias} className="flex gap-2">
            <input
              minLength={3}
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="Ej: tu.alias.mp"
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
                    onClick={() => handleAcceptInvitation(inv)}
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
          <>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setListTab('active')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                  listTab === 'active' ? 'bg-amber-400 text-slate-900' : 'border border-[#284567] text-slate-300'
                }`}
              >
                Activos
              </button>
              <button
                type="button"
                onClick={() => setListTab('history')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                  listTab === 'history' ? 'bg-amber-400 text-slate-900' : 'border border-[#284567] text-slate-300'
                }`}
              >
                Historial
              </button>
            </div>
            <div className="space-y-3">
              {(listTab === 'active' ? groups : historyGroups).length === 0 ? (
                <p className="text-slate-400 text-sm">
                  {listTab === 'active'
                    ? 'Todavía no tenés grupos. Creá uno para empezar.'
                    : 'No hay grupos cerrados en el historial.'}
                </p>
              ) : (
                (listTab === 'active' ? groups : historyGroups).map((group) => (
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
                        {listTab === 'history' && (
                          <p className="text-xs text-emerald-300">Cerrado</p>
                        )}
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
                      <div className="flex items-center gap-2 shrink-0 mt-1">
                        {listTab === 'history' && group.owner && (
                          <button
                            type="button"
                            aria-label="Eliminar grupo del historial"
                            disabled={deletingGroupId === group.id}
                            onClick={(e) => handleDeleteGroup(e, group)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <ChevronRight size={18} className="text-slate-500" />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}

        {showCreate && (
          <AppModal open title="Nuevo grupo" onClose={() => setShowCreate(false)}>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <ModalField label="Título">
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ejemplo: Asado del sábado"
                  className={modalInputClass}
                />
              </ModalField>
              <ModalField label="Descripción">
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="(Opcional)"
                  className={`${modalInputClass} min-h-[80px] resize-none`}
                />
              </ModalField>
              <ModalActions onCancel={() => setShowCreate(false)} submitLabel="Crear" />
            </form>
          </AppModal>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </Layout>
  );
};

export default GroupsPage;
