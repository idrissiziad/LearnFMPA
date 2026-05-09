'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const ADMIN_EMAILS = ['idrissiziad7@gmail.com'];
const ADMIN_SECRET = 'learnfmpa2024';
const VALID_YEARS = [
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année',
];

interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  subscription_status: string;
  years: string[];
  activation_days: number;
  activated_at: string | null;
  has_paid: boolean;
  daily_answer_count: number;
  daily_answer_reset: string | null;
  must_change_password: boolean;
  opted_out: boolean;
  created_at: string;
  last_login: string | null;
is_trial: boolean;
  trial_started_at: string | null;
  is_admin: boolean;
}

interface UserDetails extends User {
  trial_days_left?: number | null;
}

type Tab = 'users' | 'add' | 'optouts' | 'cleanup' | 'mailbcc';

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  type: 'welcome' | 'activation' | 'reset';
  name: string;
  password: string;
}

function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let pwd = '';
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) {
    pwd += chars[arr[i] % chars.length];
  }
  return pwd;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Il y a ${months}mois`;
  return `Il y a ${Math.floor(months / 12)}an`;
}

function getDaysLeft(activatedAt: string | null, activationDays: number, subscriptionStatus: string): string {
  if (subscriptionStatus === 'inactive') return 'N/A';
  if (subscriptionStatus === 'paid' && activationDays > 365) return 'Illimité';
  if (!activatedAt) return `${activationDays}j`;
  try {
    const activated = new Date(activatedAt);
    const expiry = new Date(activated.getTime() + activationDays * 86400000);
    const now = new Date();
    const remaining = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    if (remaining > 0) return `${remaining}j`;
    return 'Expiré';
  } catch {
    return 'N/A';
  }
}

function getExpiryDate(activatedAt: string | null, activationDays: number): string {
  if (!activatedAt) return 'N/A';
  try {
    const activated = new Date(activatedAt);
    const expiry = new Date(activated.getTime() + activationDays * 86400000);
    return expiry.toLocaleDateString('fr-FR');
  } catch {
    return 'N/A';
  }
}

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://www.learnfmpa.com';

function generateWelcomeEmail(name: string, email: string, tempPassword: string, sub: string, activationDays: number): EmailDraft {
  const loginUrl = `${SITE_URL}/login`;
  const isPaid = sub === 'paid';
  const planLine = isPaid
    ? '\u{1F451} Acc\u00e8s complet et illimit\u00e9 \u2014 questions, explications et suivi de progression'
    : `\u2728 Essai Premium de ${activationDays} jours, puis acc\u00e8s gratuit (10 questions expliqu\u00e9es/jour, pratique illimit\u00e9e)`;
  const subject = '\u2764\uFE0F Bienvenue sur LearnFMPA \u2014 Votre compte est pr\u00eat !';
  const body = `Bonjour ${name},

\u{1F389} Bienvenue sur LearnFMPA ! Je suis ravi de vous compter parmi nous.

J'ai cr\u00e9\u00e9 LearnFMPA pour aider les \u00e9tudiants en m\u00e9decine au Maroc \u00e0 r\u00e9viser les annales dans les meilleures conditions. Des milliers de questions corrig\u00e9es, des explications d\u00e9taill\u00e9es, et un suivi de progression \u2014 tout ce qu'il faut pour r\u00e9ussir.

\u{1F511} Vos identifiants de connexion :
   \u{1F4E7}  Email : ${email}
   \u{1F510}  Mot de passe temporaire : ${tempPassword}
   ${planLine}

\u26A0\uFE0F  Important : veuillez changer ce mot de passe lors de votre premi\u00e8re connexion.

\u{1F449} Connectez-vous ici : ${loginUrl}

\u{1F4AB} Ce qui vous attend sur LearnFMPA :
   \u2022 Des annales class\u00e9es par module et par ann\u00e9e
   \u2022 Des corrections r\u00e9dig\u00e9es par des enseignants
   \u2022 Un tableau de bord pour suivre votre progression
   \u2022 Un mode entra\u00eenement pour vous tester

Si vous avez la moindre question, n'h\u00e9sitez pas \u00e0 me contacter. Je suis l\u00e0 pour vous aider.

\u{1F4AA} Bonnes r\u00e9visions et beaucoup de r\u00e9ussite !

Cherellement,
Le cr\u00e9ateur de LearnFMPA`;

  return { to: email, subject, body, type: 'welcome', name, password: tempPassword };
}

function generateActivationEmail(name: string, email: string, tempPassword: string, paid: boolean, days: number): EmailDraft {
  const loginUrl = `${SITE_URL}/login`;
  const planLine = paid
    ? '\u{1F451} Acc\u00e8s complet et illimit\u00e9 \u2014 questions, explications et suivi de progression'
    : `\u2728 Essai Premium de ${days} jours, puis acc\u00e8s gratuit (10 questions expliqu\u00e9es/jour, pratique illimit\u00e9e)`;
  const subject = '\u{1F680} Votre compte LearnFMPA est activ\u00e9 !';
  const body = `Bonjour ${name},

\u{1F389} Bonne nouvelle : votre compte LearnFMPA est maintenant activ\u00e9 !

Vous pouvez d\u00e8s \u00e0 pr\u00e9sent acc\u00e9der \u00e0 toutes les annales de m\u00e9decine et commencer \u00e0 r\u00e9viser efficacement. J'ai con\u00e7u cette plateforme pour que chaque \u00e9tudiant puisse progresser \u00e0 son rythme, avec des outils pens\u00e9s pour la r\u00e9ussite.

\u{1F511} Vos identifiants de connexion :
   \u{1F4E7}  Email : ${email}
   \u{1F510}  Mot de passe temporaire : ${tempPassword}
   ${planLine}

\u26A0\uFE0F  Important : veuillez changer ce mot de passe lors de votre premi\u00e8re connexion.

\u{1F449} Connectez-vous ici : ${loginUrl}

\u{1F4AB} Ce qui vous attend :
   \u2022 Des annales class\u00e9es par module et par ann\u00e9e
   \u2022 Des corrections r\u00e9dig\u00e9es par des enseignants
   \u2022 Un tableau de bord pour suivre votre progression
   \u2022 Un mode entra\u00eenement pour vous tester

Si vous avez besoin d'aide, n'h\u00e9sitez pas \u00e0 me contacter. Je suis l\u00e0 pour \u00e7a.

\u{1F4AA} Bonnes r\u00e9visions !

Cherellement,
Le cr\u00e9ateur de LearnFMPA`;

  return { to: email, subject, body, type: 'activation', name, password: tempPassword };
}

function generateResetEmail(name: string, email: string, tempPassword: string): EmailDraft {
  const loginUrl = `${SITE_URL}/login`;
  const subject = '\u{1F512} R\u00e9initialisation de votre mot de passe LearnFMPA';
  const body = `Bonjour ${name},

\u{1F512} Votre mot de passe LearnFMPA a \u00e9t\u00e9 r\u00e9initialis\u00e9.

Voici vos nouveaux identifiants de connexion :

   \u{1F4E7}  Email : ${email}
   \u{1F510}  Nouveau mot de passe temporaire : ${tempPassword}

\u26A0\uFE0F  Important : veuillez changer ce mot de passe lors de votre prochaine connexion.

\u{1F449} Connectez-vous ici : ${loginUrl}

Si vous n'\u00eates pas \u00e0 l'origine de cette r\u00e9initialisation, veuillez me contacter imm\u00e9diatement.

\u{1F4AA} \u00C0 tr\u00e8s vite sur LearnFMPA !

Cherellement,
Le cr\u00e9ateur de LearnFMPA`;

  return { to: email, subject, body, type: 'reset', name, password: tempPassword };
}

async function adminGet(endpoint: string): Promise<any> {
  const res = await fetch(`/api/admin/${endpoint}&admin_secret=${ADMIN_SECRET}`);
  return res.json();
}

async function adminPost(endpoint: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, admin_secret: ADMIN_SECRET }),
  });
  return res.json();
}

async function adminDelete(endpoint: string): Promise<any> {
  const res = await fetch(`/api/admin/${endpoint}&admin_secret=${ADMIN_SECRET}`, {
    method: 'DELETE',
  });
  return res.json();
}

export default function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const isDarkMode = theme === 'dark';
  const isAdmin = user ? (ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.is_admin) : false;

  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSub, setFilterSub] = useState<string>('all');
  const [filterEdu, setFilterEdu] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, any> | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [optOuts, setOptOuts] = useState<string[]>([]);
  const [unconfirmedUsers, setUnconfirmedUsers] = useState<{ email: string; name: string; created_at: string; hours_ago: number }[]>([]);

  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    subscription: 'free' as 'free' | 'paid',
    years: ['3ème année'] as string[],
    days: 7,
  });

  const [editModal, setEditModal] = useState<{
    type: 'subscription' | 'name' | 'years' | 'days' | 'activate' | 'resetPassword' | 'batchActivate';
    email: string;
    name?: string;
  } | null>(null);

  const [editValue, setEditValue] = useState('');
  const [editYears, setEditYears] = useState<string[]>([]);
  const [editDays, setEditDays] = useState(7);
  const [editPaid, setEditPaid] = useState(false);

  const [mailBccEmails, setMailBccEmails] = useState<string[]>([]);
  const [mailBccSkipped, setMailBccSkipped] = useState<string[]>([]);
  const [mailBccCopied, setMailBccCopied] = useState(false);

  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [emailBodyCopied, setEmailBodyCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminGet('users?');
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Erreur de chargement');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptOuts = useCallback(async () => {
    try {
      const data = await adminGet('opt-outs?');
      if (data.success) {
        setOptOuts(data.opt_outs || []);
      }
    } catch {}
  }, []);

  const fetchUnconfirmed = useCallback(async () => {
    try {
      const data = await adminGet('cleanup-unconfirmed?');
      if (data.success) {
        setUnconfirmedUsers(data.unconfirmed || []);
      }
    } catch {}
  }, []);

  const fetchUserDetails = useCallback(async (email: string) => {
    try {
      setActionLoading(true);
      const data = await adminGet(`users?email=${encodeURIComponent(email)}`);
      if (data.success) {
        setSelectedUser(data.user);
        setShowUserDetail(true);
      } else {
        showMsg(data.error || 'Utilisateur non trouvé', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
    }
  }, []);

  const fetchUserProgress = useCallback(async (email: string) => {
    try {
      const data = await adminGet(`users/progress?email=${encodeURIComponent(email)}`);
      if (data.success) {
        setUserProgress(data.progress || {});
      } else {
        setUserProgress(null);
      }
    } catch {
      setUserProgress(null);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  useEffect(() => {
    if (isAdmin && activeTab === 'optouts') fetchOptOuts();
    if (isAdmin && activeTab === 'cleanup') fetchUnconfirmed();
    if (isAdmin && activeTab === 'mailbcc') generateMailBcc();
  }, [activeTab, isAdmin, fetchOptOuts, fetchUnconfirmed]);

  function showMsg(msg: string, isError = false) {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage('');
    } else {
      setSuccessMessage(msg);
      setErrorMessage('');
    }
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 5000);
  }

  async function handleAddUser() {
    if (!addForm.name || !addForm.email) {
      showMsg('Nom et email requis', true);
      return;
    }
    try {
      setActionLoading(true);
      const pwd = addForm.password || generateTempPassword();
      const data = await adminPost('users', {
        name: addForm.name,
        email: addForm.email,
        password: pwd,
        subscription_status: addForm.subscription,
        years: addForm.years,
        activation_days: addForm.days,
        has_paid: addForm.subscription === 'paid',
      });
      if (data.success) {
        const draft = generateWelcomeEmail(addForm.name || data.user?.name || addForm.email, addForm.email, pwd, addForm.subscription, addForm.days);
        setEmailDraft(draft);
        setEmailConfirmed(false);
        setEmailBodyCopied(false);
        setAddForm({ name: '', email: '', password: '', subscription: 'free', years: ['3ème année'], days: 7 });
        fetchUsers();
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleActivate(email: string, paid: boolean, days: number) {
    try {
      setActionLoading(true);
      const userResult = await adminGet(`users?email=${encodeURIComponent(email)}`);
      const userName = userResult.success ? (userResult.user?.name || email) : email;
      const activateRes = await adminPost('users', { action: 'activate', email });
      if (!activateRes.success) {
        showMsg(activateRes.error || "Erreur d'activation", true);
        return;
      }
      if (days !== 7) {
        await adminPost('users', { action: 'update_user', email, activation_days: days });
      }
      const tempPwd = generateTempPassword();
      const resetRes = await adminPost('users', { action: 'reset_password', email, new_password: tempPwd });
      if (paid) {
        await adminPost('users', { action: 'update_user', email, subscription_status: 'paid' });
      }
      const draft = generateActivationEmail(userName, email, resetRes.success ? tempPwd : '(échec réinitialisation)', paid, days);
      setEmailDraft(draft);
      setEmailConfirmed(false);
      setEmailBodyCopied(false);
      fetchUsers();
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setEditModal(null);
    }
  }

  async function handleBatchActivate(paid: boolean, days: number) {
    try {
      setActionLoading(true);
      const inactiveEdu = users.filter(u => !u.is_active && u.email.endsWith('@edu.uiz.ac.ma'));
      if (inactiveEdu.length === 0) {
        showMsg('Aucun compte edu inactif trouvé', true);
        return;
      }
      let succeeded = 0;
      let failed = 0;
      const results: { email: string; name: string; password: string }[] = [];
      for (const u of inactiveEdu) {
        const res = await adminPost('users', { action: 'activate', email: u.email });
        if (!res.success) { failed++; continue; }
        if (days !== 7) {
          await adminPost('users', { action: 'update_user', email: u.email, activation_days: days });
        }
        const pwd = generateTempPassword();
        const resetRes = await adminPost('users', { action: 'reset_password', email: u.email, new_password: pwd });
        if (!resetRes.success) { failed++; continue; }
        if (paid) {
          await adminPost('users', { action: 'update_user', email: u.email, subscription_status: 'paid' });
        }
        results.push({ email: u.email, name: u.name, password: pwd });
        succeeded++;
      }
      if (results.length > 0) {
        const last = results[results.length - 1];
        const draft = generateActivationEmail(last.name, last.email, last.password, paid, days);
        const allLines = results.map(r => `${r.email} — Mot de passe : ${r.password}`).join('\n');
        draft.body = `RÉSULTATS D'ACTIVATION EN LOT (${succeeded} réussi(s), ${failed} échoué(s))\n${'='.repeat(50)}\n\n${allLines}\n\n${'='.repeat(50)}\n\n--- Ci-dessous, un modèle d'email pour le dernier utilisateur ---\n\n${draft.body}`;
        draft.subject = `Activation en lot — ${succeeded} compte(s) activé(s)`;
        draft.name = `${succeeded} utilisateurs`;
        setEmailDraft(draft);
        setEmailConfirmed(false);
        setEmailBodyCopied(false);
      } else {
        showMsg(`Aucune activation réussie (${failed} échoué(s))`, true);
      }
      fetchUsers();
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setEditModal(null);
    }
  }

  async function handleSetSubscription(email: string, status: string) {
    try {
      setActionLoading(true);
      const data = await adminPost('users', { action: 'update_user', email, subscription_status: status });
      if (data.success) {
        showMsg(`Abonnement mis à jour: ${status}`);
        fetchUsers();
        if (selectedUser?.email?.toLowerCase() === email.toLowerCase()) {
          fetchUserDetails(email);
        }
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setEditModal(null);
    }
  }

  async function handleRename(email: string, newName: string) {
    try {
      setActionLoading(true);
      const data = await adminPost('users', { action: 'update_user', email, name: newName });
      if (data.success) {
        showMsg('Nom mis à jour');
        fetchUsers();
        if (selectedUser?.email?.toLowerCase() === email.toLowerCase()) {
          fetchUserDetails(email);
        }
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setEditModal(null);
    }
  }

  async function handleSetYears(email: string, years: string[]) {
    try {
      setActionLoading(true);
      const data = await adminPost('users', { action: 'update_user', email, years });
      if (data.success) {
        showMsg('Année(s) mise(s) à jour');
        fetchUsers();
        if (selectedUser?.email?.toLowerCase() === email.toLowerCase()) {
          fetchUserDetails(email);
        }
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setEditModal(null);
    }
  }

  async function handleSetDays(email: string, days: number) {
    try {
      setActionLoading(true);
      const data = await adminPost('users', { action: 'update_user', email, activation_days: days });
      if (data.success) {
        showMsg(`Durée mise à jour: ${days} jours`);
        fetchUsers();
        if (selectedUser?.email?.toLowerCase() === email.toLowerCase()) {
          fetchUserDetails(email);
        }
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setEditModal(null);
    }
  }

  async function handleResetPassword(email: string) {
    try {
      setActionLoading(true);
      const userResult = await adminGet(`users?email=${encodeURIComponent(email)}`);
      const userName = userResult.success ? (userResult.user?.name || email) : email;
      const pwd = generateTempPassword();
      const data = await adminPost('users', { action: 'reset_password', email, new_password: pwd });
      if (data.success) {
        const draft = generateResetEmail(userName, email, pwd);
        setEmailDraft(draft);
        setEmailConfirmed(false);
        setEmailBodyCopied(false);
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setEditModal(null);
    }
  }

  async function handleDeactivate(email: string) {
    try {
      setActionLoading(true);
      const data = await adminPost('users', { action: 'set_active', email, is_active: false });
      if (data.success) {
        showMsg('Utilisateur désactivé');
        fetchUsers();
        if (selectedUser?.email?.toLowerCase() === email.toLowerCase()) {
          fetchUserDetails(email);
        }
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setConfirmDeactivate(null);
    }
  }

  async function handleDelete(email: string) {
    try {
      setActionLoading(true);
      const data = await adminDelete(`users?email=${encodeURIComponent(email)}`);
      if (data.success) {
        showMsg('Utilisateur supprimé');
        setShowUserDetail(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
      setConfirmDelete(null);
    }
  }

  async function handleOptIn(email: string) {
    try {
      setActionLoading(true);
      const res = await fetch('/api/opt-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'opt-in' }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(`${email} réinscrit(e)`);
        fetchOptOuts();
      } else {
        showMsg(data.error || 'Erreur', true);
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCleanup(force: boolean) {
    try {
      setActionLoading(true);
      if (force) {
        const data = await adminPost('cleanup-unconfirmed', { action: 'cleanup_unconfirmed' });
        if (data.success) {
          showMsg(`${data.deleted} compte(s) non confirmé(s) supprimé(s)`);
          fetchUnconfirmed();
          fetchUsers();
        } else {
          showMsg(data.error || 'Erreur', true);
        }
      } else {
        fetchUnconfirmed();
      }
    } catch {
      showMsg('Erreur de connexion', true);
    } finally {
      setActionLoading(false);
    }
  }

  function generateMailBcc() {
    const filtered = filterEdu ? users.filter(u => u.email.endsWith('@edu.uiz.ac.ma')) : users;
    const optedOutSet = new Set(optOuts.map(e => e.toLowerCase()));
    const recipients: string[] = [];
    const skipped: string[] = [];
    for (const u of filtered) {
      if (optedOutSet.has(u.email.toLowerCase())) {
        continue;
      }
      if (u.subscription_status === 'paid') {
        const left = getDaysLeft(u.activated_at, u.activation_days, u.subscription_status);
        if (left !== 'Expiré' && left !== 'N/A' && left !== 'Illimité') {
          const days = parseInt(left);
          if (!isNaN(days) && days > 30) {
            skipped.push(u.email);
            continue;
          }
        } else if (left === 'Illimité') {
          skipped.push(u.email);
          continue;
        }
      }
      recipients.push(u.email);
    }
    setMailBccEmails(recipients);
    setMailBccSkipped(skipped);
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSub = filterSub === 'all' || u.subscription_status === filterSub;
    const matchesEdu = !filterEdu || u.email.endsWith('@edu.uiz.ac.ma');
    return matchesSearch && matchesSub && matchesEdu;
  });

  const activeToday = users.filter(u => {
    if (!u.last_login || u.last_login === 'Never') return false;
    try {
      const d = new Date(u.last_login);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    } catch { return false; }
  }).length;

  const activeThisWeek = users.filter(u => {
    if (!u.last_login || u.last_login === 'Never') return false;
    try {
      const d = new Date(u.last_login);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return d >= weekAgo;
    } catch { return false; }
  }).length;

  if (authLoading || !user || !isAdmin) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {!isAdmin && user ? 'Accès non autorisé' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  const SubBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      paid: isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700',
      free: isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700',
      inactive: isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600',
    };
    const labels: Record<string, string> = { paid: 'Paid', free: 'Free', inactive: 'Inactive' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || colors.inactive}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md border-gray-700' : 'bg-white/95 backdrop-blur-md border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center min-w-0 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow flex-shrink-0">
                <div className="flex space-x-0.5 sm:space-x-1">
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} truncate`}>LearnFMPA</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Tableau de bord
              </Link>
              <Link href="/dashboard/reports" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Signalements
              </Link>
              <span className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium text-sm relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:rounded-full`}>
                Admin
              </span>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {(successMessage || errorMessage) && (
          <div className={`mb-4 p-4 rounded-xl ${successMessage ? (isDarkMode ? 'bg-green-900/30 border border-green-800/50 text-green-300' : 'bg-green-50 border border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/30 border border-red-800/50 text-red-300' : 'bg-red-50 border border-red-200 text-red-700')}`}>
            {successMessage || errorMessage}
          </div>
        )}

        {showUserDetail && selectedUser ? (
          <div>
            <button onClick={() => { setShowUserDetail(false); setSelectedUser(null); setUserProgress(null); }}
              className={`flex items-center gap-2 mb-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Retour à la liste
            </button>

            <div className={`rounded-xl border overflow-hidden mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <SubBadge status={selectedUser.subscription_status} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedUser.is_active ? (isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') : (isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')}`}>
                    {selectedUser.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  {selectedUser.opted_out && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Opt-out</span>
                  )}
                  {selectedUser.must_change_password && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Mot de passe à changer</span>
                  )}
                  {selectedUser.is_admin && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">Admin</span>
                  )}
                </div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedUser.name}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.email}</p>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID</p>
                  <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedUser.id}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Année(s)</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{(selectedUser.years || []).join(', ')}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Durée abonnement</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedUser.activation_days} jours</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Activé le</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedUser.activated_at ? new Date(selectedUser.activated_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Expire le</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{getExpiryDate(selectedUser.activated_at, selectedUser.activation_days)}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Temps restant</p>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{getDaysLeft(selectedUser.activated_at, selectedUser.activation_days, selectedUser.subscription_status)}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Has Paid</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedUser.has_paid ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Réponses aujourd&apos;hui</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedUser.daily_answer_count}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Dernière connexion</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedUser.last_login && selectedUser.last_login !== 'Never' ? timeAgo(selectedUser.last_login) : 'Jamais'}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Créé le</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Administrateur</p>
                  <p className={`text-sm font-semibold ${selectedUser.is_admin ? (isDarkMode ? 'text-yellow-300' : 'text-yellow-700') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                    {selectedUser.is_admin ? 'Oui' : 'Non'}
                  </p>
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                  <button onClick={() => fetchUserProgress(selectedUser.email)}
                    className={`text-sm px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} transition-colors`}>
                    Voir la progression
                  </button>
                </div>
              </div>

              {userProgress && (
                <div className={`px-5 pb-5`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Progression</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(userProgress).filter(([k]) => k.startsWith('module_')).map(([key, value]: [string, any]) => {
                      const answered = typeof value === 'object' ? Object.values(value).filter((v: any) => v).length : 0;
                      return (
                        <div key={key} className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{key}</span>
                          <span className={`text-sm ml-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{answered} répondues</span>
                        </div>
                      );
                    })}
                    {Object.keys(userProgress).filter(k => k.startsWith('module_')).length === 0 && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune progression</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button onClick={() => { setEditModal({ type: 'name', email: selectedUser.email, name: selectedUser.name }); setEditValue(selectedUser.name); }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'} transition-colors`}>
                Renommer
              </button>
              <button onClick={() => { setEditModal({ type: 'subscription', email: selectedUser.email }); setEditValue(selectedUser.subscription_status); }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'} transition-colors`}>
                Changer abonnement
              </button>
              <button onClick={() => { setEditModal({ type: 'years', email: selectedUser.email }); setEditYears(selectedUser.years || ['3ème année']); }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'} transition-colors`}>
                Changer année(s)
              </button>
              <button onClick={() => { setEditModal({ type: 'days', email: selectedUser.email }); setEditDays(selectedUser.activation_days || 7); }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'} transition-colors`}>
                Durée essai (jours)
              </button>
              <button onClick={() => setEditModal({ type: 'resetPassword', email: selectedUser.email })}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60 border border-amber-800/50' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'} transition-colors`}>
                Réinitialiser mot de passe
              </button>
              {selectedUser.is_active ? (
                <button onClick={() => setConfirmDeactivate(selectedUser.email)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-orange-900/40 text-orange-300 hover:bg-orange-900/60 border border-orange-800/50' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'} transition-colors`}>
                  Désactiver
                </button>
              ) : (
                <button onClick={() => setEditModal({ type: 'activate', email: selectedUser.email })}
                  className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-green-900/40 text-green-300 hover:bg-green-900/60 border border-green-800/50' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'} transition-colors`}>
                  Activer
                </button>
              )}
              <button onClick={() => setConfirmDelete(selectedUser.email)}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-800/50' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'} transition-colors`}>
                Supprimer
              </button>
              <button onClick={async () => {
                const u = selectedUser;
                const pwd = generateTempPassword();
                setEmailDraft(generateWelcomeEmail(u.name, u.email, pwd, u.subscription_status, u.activation_days));
                setEmailConfirmed(false);
                setEmailBodyCopied(false);
                try {
                  const data = await adminPost('users', { action: 'reset_password', email: u.email, new_password: pwd });
                  if (!data.success) {
                    showMsg('Erreur lors de la mise à jour du mot de passe: ' + (data.error || 'Erreur'), true);
                    setEmailDraft(null);
                  }
                } catch {
                  showMsg('Erreur de connexion lors de la mise à jour du mot de passe', true);
                  setEmailDraft(null);
                }
              }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-800/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'} transition-colors`}>
                Générer email bienvenue
              </button>
              <button onClick={async () => {
                const u = selectedUser;
                const pwd = generateTempPassword();
                setEmailDraft(generateResetEmail(u.name, u.email, pwd));
                setEmailConfirmed(false);
                setEmailBodyCopied(false);
                try {
                  const data = await adminPost('users', { action: 'reset_password', email: u.email, new_password: pwd });
                  if (!data.success) {
                    showMsg('Erreur lors de la mise à jour du mot de passe: ' + (data.error || 'Erreur'), true);
                    setEmailDraft(null);
                  }
                } catch {
                  showMsg('Erreur de connexion lors de la mise à jour du mot de passe', true);
                  setEmailDraft(null);
                }
              }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-800/50' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'} transition-colors`}>
                Générer email reset MDP
              </button>
              <button onClick={async () => {
                if (!selectedUser) return;
                const newAdmin = !selectedUser.is_admin;
                try {
                  setActionLoading(true);
                  const data = await adminPost('users', { action: 'update_user', email: selectedUser.email, is_admin: newAdmin });
                  if (data.success) {
                    showMsg(newAdmin ? 'Admin accordé' : 'Admin retiré');
                    fetchUserDetails(selectedUser.email);
                    fetchUsers();
                  } else {
                    showMsg(data.error || 'Erreur', true);
                  }
                } catch {
                  showMsg('Erreur de connexion', true);
                } finally {
                  setActionLoading(false);
                }
              }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${selectedUser.is_admin ? (isDarkMode ? 'bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60 border border-yellow-800/50' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200') : (isDarkMode ? 'bg-violet-900/40 text-violet-300 hover:bg-violet-900/60 border border-violet-800/50' : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200')} transition-colors`}>
                {selectedUser.is_admin ? '✓ Admin — Retirer' : '✦ Donner Admin'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Gestion des utilisateurs
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Gérer les comptes, activations, abonnements et plus.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {(['users', 'add', 'optouts', 'cleanup', 'mailbcc'] as Tab[]).map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm'
                      : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}>
                  {{ users: 'Utilisateurs', add: 'Ajouter', optouts: 'Opt-outs', cleanup: 'Nettoyage', mailbcc: 'Email BCC' }[tab]}
                </button>
              ))}
            </div>

            {activeTab === 'users' && (
              <>
                <div className={`flex flex-col sm:flex-row gap-3 mb-4 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                  <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}>
                    <option value="all">Tous les abonnements</option>
                    <option value="paid">Paid</option>
                    <option value="free">Free</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'} cursor-pointer`}>
                    <input type="checkbox" checked={filterEdu} onChange={e => setFilterEdu(e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    @edu uniquement
                  </label>
                  <button onClick={fetchUsers}
                    className={`px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>
                </div>

                <div className={`flex flex-wrap gap-4 mb-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>Total: <strong>{users.length}</strong></span>
                  <span>Actifs aujourd&apos;hui: <strong>{activeToday}</strong></span>
                  <span>Actifs cette semaine: <strong>{activeThisWeek}</strong></span>
                  <span>Paid: <strong>{users.filter(u => u.subscription_status === 'paid').length}</strong></span>
                  <span>Free: <strong>{users.filter(u => u.subscription_status === 'free').length}</strong></span>
                  <span>Inactive: <strong>{users.filter(u => u.subscription_status === 'inactive').length}</strong></span>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
                  </div>
                ) : error ? (
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>{error}</div>
                ) : (
                  <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</th>
                            <th className={`text-left px-4 py-3 font-medium hidden md:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nom</th>
                            <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Abonn.</th>
                            <th className={`text-left px-4 py-3 font-medium hidden lg:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Restant</th>
                            <th className={`text-left px-4 py-3 font-medium hidden sm:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actif</th>
                            <th className={`text-left px-4 py-3 font-medium hidden lg:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dernière co.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <tr key={u.id} onClick={() => fetchUserDetails(u.email)}
                              className={`border-b cursor-pointer transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                <div className="flex items-center gap-2">
                                  {u.must_change_password && <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" title="Mot de passe à changer" />}
                                  {u.opted_out && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Opt-out" />}
                                  <span className="truncate max-w-[200px]">{u.email}</span>
                                </div>
                              </td>
                              <td className={`px-4 py-3 hidden md:table-cell ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{u.name}</td>
                              <td className="px-4 py-3"><SubBadge status={u.subscription_status} /></td>
                              <td className={`px-4 py-3 hidden lg:table-cell ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{getDaysLeft(u.activated_at, u.activation_days, u.subscription_status)}</td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? (isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') : (isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')}`}>
                                  {u.is_active ? 'Oui' : 'Non'}
                                </span>
                              </td>
                              <td className={`px-4 py-3 hidden lg:table-cell text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {u.last_login && u.last_login !== 'Never' ? timeAgo(u.last_login) : 'Jamais'}
                              </td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan={6} className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Aucun utilisateur trouvé
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => { setEditModal({ type: 'batchActivate', email: '' }); setEditPaid(false); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-green-900/40 text-green-300 hover:bg-green-900/60 border border-green-800/50' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'} transition-colors`}>
                    Activation en lot (Edu inactifs)
                  </button>
                </div>
              </>
            )}

            {activeTab === 'add' && (
              <div className={`max-w-lg mx-auto p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ajouter un utilisateur</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nom</label>
                    <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                      placeholder="Nom complet" />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                    <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                      placeholder="student@edu.uiz.ac.ma" />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mot de passe temporaire (auto-généré si vide)</label>
                    <input type="text" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                      placeholder="Auto-généré" />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Abonnement</label>
                    <select value={addForm.subscription} onChange={e => setAddForm(f => ({ ...f, subscription: e.target.value as 'free' | 'paid' }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}>
                      <option value="free">Free (essai premium)</option>
                      <option value="paid">Paid (accès complet)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Année(s)</label>
                    <div className="flex flex-wrap gap-2">
                      {VALID_YEARS.map(y => (
                        <button key={y} onClick={() => setAddForm(f => ({
                          ...f,
                          years: f.years.includes(y) ? f.years.filter(yy => yy !== y) : [...f.years, y]
                        }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            addForm.years.includes(y)
                              ? 'bg-green-600 text-white'
                              : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Durée essai (jours)</label>
                    <input type="number" value={addForm.days} onChange={e => setAddForm(f => ({ ...f, days: parseInt(e.target.value) || 7 }))}
                      min={1} className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`} />
                  </div>
                  <button onClick={handleAddUser} disabled={actionLoading}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50 transition-all">
                    {actionLoading ? 'Création...' : 'Créer l\'utilisateur'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'optouts' && (
              <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Opt-outs email ({optOuts.length})
                  </h2>
                </div>
                {optOuts.length === 0 ? (
                  <div className={`p-8 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Aucun opt-out trouvé
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {optOuts.map(email => (
                      <div key={email} className={`flex items-center justify-between px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{email}</span>
                        <button onClick={() => handleOptIn(email)} disabled={actionLoading}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-green-900/40 text-green-300 hover:bg-green-900/60' : 'bg-green-50 text-green-700 hover:bg-green-100'} transition-colors`}>
                          Réinscrire
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cleanup' && (
              <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Comptes non confirmés (&gt;48h)
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Comptes créés il y a plus de 48h qui n&apos;ont jamais changé leur mot de passe.
                  </p>
                </div>
                {unconfirmedUsers.length === 0 ? (
                  <div className={`p-8 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Aucun compte non confirmé trouvé
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                            <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</th>
                            <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nom</th>
                            <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Créé il y a</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unconfirmedUsers.map(u => (
                            <tr key={u.email} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{u.email}</td>
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{u.name}</td>
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{u.hours_ago}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <button onClick={() => handleCleanup(true)} disabled={actionLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-800/50' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'} transition-colors`}>
                        {actionLoading ? 'Suppression...' : `Supprimer ${unconfirmedUsers.length} compte(s)`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'mailbcc' && (
              <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Liste BCC Email ({mailBccEmails.length} destinataires)
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Emails pour BCC, opt-outs exclus, paid avec 30j+ restants exclus.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <label className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input type="checkbox" checked={filterEdu} onChange={e => { setFilterEdu(e.target.checked); }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      @edu uniquement
                    </label>
                  </div>
                </div>
                <div className={`p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <textarea readOnly value={mailBccEmails.join(', ')}
                    className={`w-full h-32 px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} focus:outline-none resize-none`}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { navigator.clipboard.writeText(mailBccEmails.join(', ')); setMailBccCopied(true); setTimeout(() => setMailBccCopied(false), 3000); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm transition-all">
                      {mailBccCopied ? 'Copié !' : 'Copier BCC'}
                    </button>
                    <button onClick={() => { window.open('mailto:?bcc=' + encodeURIComponent(mailBccEmails.join(','))); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'} transition-colors`}>
                      Ouvrir client email
                    </button>
                  </div>
                </div>
                {mailBccSkipped.length > 0 && (
                  <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Exclus (paid &gt;30j restants) :</p>
                    <div className="flex flex-wrap gap-1">
                      {mailBccSkipped.map(e => (
                        <span key={e} className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {editModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditModal(null)}>
            <div className={`w-full max-w-md rounded-xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} onClick={e => e.stopPropagation()}>
              <div className={`p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {{
                    subscription: 'Changer l\'abonnement',
                    name: 'Renommer l\'utilisateur',
                    years: 'Changer l\'année(s)',
                    days: 'Durée de l\'essai (jours)',
                    activate: 'Activer l\'utilisateur',
                    resetPassword: 'Réinitialiser le mot de passe',
                    batchActivate: 'Activation en lot',
                  }[editModal.type]}
                </h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{editModal.email}</p>
              </div>

              <div className="p-5">
                {editModal.type === 'subscription' && (
                  <div className="space-y-3">
                    {['inactive', 'free', 'paid'].map(status => (
                      <button key={status} onClick={() => handleSetSubscription(editModal.email, status)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          editValue === status
                            ? isDarkMode ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
                            : isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}>
                        <div className="font-medium">{{ inactive: 'Inactive (ne peut pas se connecter)', free: 'Free (10 questions expliquées/jour)', paid: 'Paid (accès illimité)' }[status]}</div>
                      </button>
                    ))}
                  </div>
                )}

                {editModal.type === 'name' && (
                  <div className="space-y-3">
                    <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`} />
                    <button onClick={() => handleRename(editModal.email, editValue)} disabled={actionLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50">
                      {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}

                {editModal.type === 'years' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {VALID_YEARS.map(y => (
                        <button key={y} onClick={() => setEditYears(ey => ey.includes(y) ? ey.filter(yy => yy !== y) : [...ey, y])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            editYears.includes(y)
                              ? 'bg-green-600 text-white'
                              : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {y}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => handleSetYears(editModal.email, editYears)} disabled={actionLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50">
                      {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}

                {editModal.type === 'days' && (
                  <div className="space-y-3">
                    <input type="number" value={editDays} onChange={e => setEditDays(parseInt(e.target.value) || 7)} min={1}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`} />
                    <div className="flex gap-2 flex-wrap">
                      {[7, 14, 30, 90, 365, 3650].map(d => (
                        <button key={d} onClick={() => setEditDays(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editDays === d ? 'bg-green-600 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}>
                          {d}j
                        </button>
                      ))}
                    </div>
                    <button onClick={() => handleSetDays(editModal.email, editDays)} disabled={actionLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50">
                      {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}

                {editModal.type === 'activate' && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Durée de l&apos;essai (jours)</label>
                      <input type="number" value={editDays} onChange={e => setEditDays(parseInt(e.target.value) || 7)} min={1}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`} />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {[7, 14, 30, 90, 365].map(d => (
                          <button key={d} onClick={() => setEditDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editDays === d ? 'bg-green-600 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}>
                            {d}j
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input type="checkbox" checked={editPaid} onChange={e => setEditPaid(e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className="text-sm">Abonnement Paid (accès complet)</span>
                    </label>
                    <button onClick={() => handleActivate(editModal.email, editPaid, editDays)} disabled={actionLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50">
                      {actionLoading ? 'Activation...' : 'Activer'}
                    </button>
                  </div>
                )}

                {editModal.type === 'resetPassword' && (
                  <div className="space-y-3">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Un nouveau mot de passe temporaire sera généré automatiquement. L&apos;utilisateur devra le changer à la prochaine connexion.
                    </p>
                    <button onClick={() => handleResetPassword(editModal.email)} disabled={actionLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-sm disabled:opacity-50">
                      {actionLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                    </button>
                  </div>
                )}

                {editModal.type === 'batchActivate' && (
                  <div className="space-y-3">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tous les comptes @edu.uiz.ac.ma inactifs seront activés avec un mot de passe temporaire.
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Comptes inactifs edu trouvés: <strong>{users.filter(u => !u.is_active && u.email.endsWith('@edu.uiz.ac.ma')).length}</strong>
                    </p>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Durée de l&apos;essai (jours)</label>
                      <input type="number" value={editDays} onChange={e => setEditDays(parseInt(e.target.value) || 7)} min={1}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`} />
                      <div className="flex gap-2 mt-2">
                        {[7, 14, 30, 90, 365].map(d => (
                          <button key={d} onClick={() => setEditDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editDays === d ? 'bg-green-600 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} transition-colors`}>
                            {d}j
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input type="checkbox" checked={editPaid} onChange={e => setEditPaid(e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className="text-sm">Abonnement Paid pour tous</span>
                    </label>
                    <button onClick={() => handleBatchActivate(editPaid, editDays)} disabled={actionLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-50">
                      {actionLoading ? 'Activation...' : 'Activer tous les comptes edu inactifs'}
                    </button>
                  </div>
                )}
              </div>

              <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-end`}>
                <button onClick={() => setEditModal(null)}
                  className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDelete(null)}>
            <div className={`w-full max-w-sm rounded-xl shadow-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Confirmer la suppression</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Êtes-vous sûr de vouloir supprimer <strong>{confirmDelete}</strong> ? Cette action est irréversible.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmDelete(null)}
                  className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>
                  Annuler
                </button>
                <button onClick={() => handleDelete(confirmDelete)} disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {actionLoading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeactivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDeactivate(null)}>
            <div className={`w-full max-w-sm rounded-xl shadow-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Confirmer la désactivation</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Êtes-vous sûr de vouloir désactiver <strong>{confirmDeactivate}</strong> ? L&apos;utilisateur ne pourra plus se connecter.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmDeactivate(null)}
                  className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>
                  Annuler
                </button>
                <button onClick={() => handleDeactivate(confirmDeactivate)} disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors">
                  {actionLoading ? 'Désactivation...' : 'Désactiver'}
                </button>
              </div>
            </div>
          </div>
        )}

        {emailDraft && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-8 overflow-y-auto bg-black/50" onClick={() => { if (emailConfirmed) { setEmailDraft(null); } }}>
            <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} mb-8`} onClick={e => e.stopPropagation()}>
              <div className={`p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emailDraft.type === 'welcome' ? (isDarkMode ? 'bg-green-900/40' : 'bg-green-100') : emailDraft.type === 'activation' ? (isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100') : (isDarkMode ? 'bg-amber-900/40' : 'bg-amber-100')}`}>
                    <span className="text-lg">{emailDraft.type === 'welcome' ? '✉️' : emailDraft.type === 'activation' ? '🚀' : '🔒'}</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {{ welcome: 'Email de bienvenue', activation: "Email d'activation", reset: 'Email de réinitialisation' }[emailDraft.type]}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pour : {emailDraft.to}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-800/50' : 'bg-amber-50 border border-amber-200'}`}>
                  <svg className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-yellow-400' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-amber-700'}`}>
                    Vous devez envoyer cet email manuellement. Copiez le contenu ou ouvrez votre client email ci-dessous.
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mot de passe temporaire</label>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 px-3 py-2 rounded-lg font-mono text-sm ${isDarkMode ? 'bg-gray-900 text-green-400 border border-gray-700' : 'bg-gray-50 text-green-700 border border-gray-200'}`}>
                      {emailDraft.password}
                    </code>
                    <button onClick={() => { navigator.clipboard.writeText(emailDraft.password); }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}>
                      Copier
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sujet</label>
                  <div className={`px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-900 text-gray-200 border border-gray-700' : 'bg-gray-50 text-gray-800 border border-gray-200'}`}>
                    {emailDraft.subject}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Corps de l&apos;email</label>
                  <textarea readOnly value={emailDraft.body}
                    className={`w-full h-64 px-3 py-2 rounded-lg text-sm border resize-none ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'} focus:outline-none`} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { navigator.clipboard.writeText(emailDraft.body); setEmailBodyCopied(true); setTimeout(() => setEmailBodyCopied(false), 3000); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailBodyCopied ? 'bg-green-600 text-white' : (isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}>
                      {emailBodyCopied ? '✓ Copié !' : 'Copier le corps'}
                    </button>
                    <button onClick={() => {
                      const mailto = `mailto:${encodeURIComponent(emailDraft.to)}?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`;
                      window.open(mailto, '_blank');
                    }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm transition-all`}>
                      📧 Ouvrir client email
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-5 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <label className={`flex items-start gap-3 cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input type="checkbox" checked={emailConfirmed} onChange={e => setEmailConfirmed(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm">
                    Je confirme avoir envoyé (ou avoir l&apos;intention d&apos;envoyer) cet email à <strong>{emailDraft.to}</strong>
                  </span>
                </label>
                <div className="flex gap-2 mt-4 justify-end">
                  <button onClick={() => setEmailDraft(null)}
                    className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>
                    Fermer sans confirmer
                  </button>
                  <button onClick={() => { setEmailDraft(null); showMsg('Email enregistré comme envoyé'); }}
                    disabled={!emailConfirmed}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    ✓ Confirmer l&apos;envoi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}