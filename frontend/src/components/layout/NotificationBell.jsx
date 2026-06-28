import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { groupService } from '../../services/groupService';

const NotificationBell = () => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [actingOn, setActingOn] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [countRes, notifRes, invRes] = await Promise.all([
        notificationService.unreadCount(),
        notificationService.list(),
        groupService.listInvitations(),
      ]);
      setUnreadCount(countRes.data.count || 0);
      setNotifications(notifRes.data || []);
      setInvitations(invRes.data || []);
    } catch {
      // silencioso si no hay sesión
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markInvitationNotificationRead = async (invitationId) => {
    const related = notifications.find(
      (n) => n.type === 'GROUP' && n.referenceId === invitationId && !n.read,
    );
    if (related) {
      await notificationService.markAsRead(related.id);
    }
  };

  const handleAccept = async (invitationId) => {
    setActingOn(invitationId);
    try {
      await groupService.acceptInvitation(invitationId);
      await markInvitationNotificationRead(invitationId);
      await loadData();
      setOpen(false);
      navigate('/groups');
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (invitationId) => {
    setActingOn(invitationId);
    try {
      await groupService.rejectInvitation(invitationId);
      await markInvitationNotificationRead(invitationId);
      await loadData();
    } finally {
      setActingOn(null);
    }
  };

  const otherNotifications = notifications.filter(
    (n) => n.type !== 'GROUP' || !invitations.some((inv) => inv.id === n.referenceId),
  );

  const badge = unreadCount > 0 ? unreadCount : invitations.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) loadData();
        }}
        className="relative w-9 h-9 rounded-full border border-[#2a4466] bg-[#102946] text-amber-300 flex items-center justify-center"
        aria-label="Notificaciones"
      >
        <Bell size={16} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-[#284567] bg-[#0f2543] shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-[#284567]">
            <p className="text-sm font-semibold text-slate-100">Notificaciones</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-amber-400" size={20} />
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {invitations.length === 0 && otherNotifications.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No tenés notificaciones.</p>
              )}

              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 space-y-2"
                >
                  <p className="text-sm text-slate-100">
                    <span className="font-medium">{inv.invitedByName}</span>
                    {' '}te invitó a{' '}
                    <span className="font-medium text-amber-300">{inv.groupTitle}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actingOn === inv.id}
                      onClick={() => handleAccept(inv.id)}
                      className="flex-1 rounded-lg bg-amber-400 text-slate-900 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {actingOn === inv.id ? '...' : 'Aceptar'}
                    </button>
                    <button
                      type="button"
                      disabled={actingOn === inv.id}
                      onClick={() => handleReject(inv.id)}
                      className="flex-1 rounded-lg border border-[#284567] text-slate-300 py-1.5 text-xs disabled:opacity-60"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}

              {otherNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    n.read ? 'text-slate-400' : 'text-slate-100 bg-[#1a3457]/50'
                  }`}
                >
                  {n.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
