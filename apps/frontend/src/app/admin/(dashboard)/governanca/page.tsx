'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { Shield, CheckCircle, XCircle, UserX, UserCheck, RefreshCw, Search, X, Award, Phone, Mail, MapPin, Calendar, FileText, User, Settings } from 'lucide-react';

type DoctorProfile = {
  id: number;
  name: string;
  crm: string;
  specialty: string | null;
  bio: string | null;
  phone: string | null;
  profilePictureUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  address: {
    id: number;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  user: {
    id: number;
    email: string;
    createdAt: string;
    isActive: boolean;
  };
};

type UserItem = {
  id: number;
  email: string;
  phone?: string | null;
  role: 'DOCTOR' | 'PATIENT' | 'ADMIN';
  name?: string | null;
  isActive: boolean;
  createdAt: string;
  doctorProfile: { 
    id: number; 
    name: string; 
    crm: string; 
    specialty: string | null; 
    bio: string | null;
    phone: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    address: {
      id: number;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    } | null;
  } | null;
  patientProfile: { 
    id: number;
    name: string; 
    cpf: string;
    dateOfBirth: string;
    sex: 'MALE' | 'FEMALE' | 'OTHER' | null;
    phone: string | null;
    address: {
      id: number;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    } | null;
  } | null;
};

type RoleFilter = 'ALL' | 'DOCTOR' | 'PATIENT' | 'ADMIN';

export default function AdminGovernancePage() {
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'users'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    crm: '',
    specialty: '',
    bio: '',
    cpf: '',
    dateOfBirth: '',
    sex: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [doctorsRes, usersRes] = await Promise.all([
        api.get('/admin/doctors/pending'),
        api.get('/admin/users'),
      ]);
      console.log('USERS FROM API:', usersRes.data);
      setPendingDoctors(doctorsRes.data);
      setUsers(usersRes.data);
    } catch {
      setError('Erro ao carregar dados. Verifique suas permissões.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleApprove = async (id: number, name: string) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.patch(`/admin/doctors/${id}/approve`);
      setPendingDoctors((prev) => prev.filter((d) => d.id !== id));
      setUsers((prev) =>
        prev.map((u) =>
          u.doctorProfile && u.doctorProfile.id === id
            ? { ...u, doctorProfile: { ...u.doctorProfile, status: 'APPROVED' } }
            : u
        )
      );
      showSuccess(`Dr(a). ${name} aprovado(a) com sucesso.`);
      setSelectedDoctor(null);
    } catch {
      setError('Erro ao aprovar médico.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number, name: string) => {
    setActionLoading(`reject-${id}`);
    try {
      await api.patch(`/admin/doctors/${id}/reject`);
      setPendingDoctors((prev) => prev.filter((d) => d.id !== id));
      setUsers((prev) =>
        prev.map((u) =>
          u.doctorProfile && u.doctorProfile.id === id
            ? { ...u, doctorProfile: { ...u.doctorProfile, status: 'REJECTED' } }
            : u
        )
      );
      showSuccess(`Cadastro de ${name} rejeitado.`);
      setSelectedDoctor(null);
    } catch {
      setError('Erro ao rejeitar médico.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'activate';
    setActionLoading(`toggle-${userId}`);
    try {
      await api.patch(`/admin/users/${userId}/${action}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !isActive } : u))
      );
      showSuccess(`Conta ${isActive ? 'desativada' : 'reativada'} com sucesso.`);
    } catch {
      setError(`Erro ao ${isActive ? 'desativar' : 'ativar'} a conta.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getUserName = (user: UserItem) => {
    return user.name || user.doctorProfile?.name || user.patientProfile?.name || user.email;
  };

  const handleOpenUserModal = (user: UserItem) => {
    setSelectedUser(user);
    setIsEditing(false);
    // Phone is stored in both User.phone and Profile.phone (same value from registration)
    // Read from the profile as the canonical source
    const userPhone = user.doctorProfile?.phone || user.patientProfile?.phone || user.phone || '';
    const userAddress = user.doctorProfile?.address || user.patientProfile?.address || null;
    setEditForm({
      name: getUserName(user) || '',
      email: user.email || '',
      phone: userPhone,
      crm: user.doctorProfile?.crm || '',
      specialty: user.doctorProfile?.specialty || '',
      bio: user.doctorProfile?.bio || '',
      cpf: user.patientProfile?.cpf || '',
      dateOfBirth: user.patientProfile?.dateOfBirth 
        ? new Date(user.patientProfile.dateOfBirth).toISOString().split('T')[0] 
        : '',
      sex: user.patientProfile?.sex || '',
      street: userAddress?.street || '',
      number: userAddress?.number || '',
      complement: userAddress?.complement || '',
      neighborhood: userAddress?.neighborhood || '',
      city: userAddress?.city || '',
      state: userAddress?.state || '',
      zipCode: userAddress?.zipCode || '',
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setActionLoading(`save-${selectedUser.id}`);
    try {
      const res = await api.patch(`/admin/users/${selectedUser.id}`, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        crm: selectedUser.role === 'DOCTOR' ? editForm.crm : undefined,
        specialty: selectedUser.role === 'DOCTOR' ? editForm.specialty : undefined,
        bio: selectedUser.role === 'DOCTOR' ? editForm.bio : undefined,
        cpf: selectedUser.role === 'PATIENT' ? editForm.cpf : undefined,
        dateOfBirth: selectedUser.role === 'PATIENT' 
          ? (editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString() : null) 
          : undefined,
        sex: selectedUser.role === 'PATIENT' ? (editForm.sex || null) : undefined,
        street: (selectedUser.role === 'DOCTOR' || selectedUser.role === 'PATIENT') ? editForm.street : undefined,
        number: (selectedUser.role === 'DOCTOR' || selectedUser.role === 'PATIENT') ? editForm.number : undefined,
        complement: (selectedUser.role === 'DOCTOR' || selectedUser.role === 'PATIENT') ? editForm.complement : undefined,
        neighborhood: (selectedUser.role === 'DOCTOR' || selectedUser.role === 'PATIENT') ? editForm.neighborhood : undefined,
        city: (selectedUser.role === 'DOCTOR' || selectedUser.role === 'PATIENT') ? editForm.city : undefined,
        state: (selectedUser.role === 'DOCTOR' || selectedUser.role === 'PATIENT') ? editForm.state : undefined,
        zipCode: (selectedUser.role === 'DOCTOR' || selectedUser.role === 'PATIENT') ? editForm.zipCode : undefined,
      });
      const updatedUser = res.data;
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setSelectedUser(updatedUser);
      setIsEditing(false);
      showSuccess("Dados do usuário atualizados com sucesso.");
    } catch {
      setError("Erro ao atualizar dados do usuário.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ─── Filtered users ─── */
  const filteredUsers = useMemo(() => {
    let result = users;

    // Role filter
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => {
        const name = getUserName(u).toLowerCase();
        const email = u.email.toLowerCase();
        const id = String(u.id);
        return name.includes(q) || email.includes(q) || id.includes(q);
      });
    }

    return result;
  }, [users, roleFilter, searchQuery]);

  const roleBadge = (role: string) => {
    const classes: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      DOCTOR: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
      PATIENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    };
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      DOCTOR: 'Médico',
      PATIENT: 'Paciente',
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes[role] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const roleFilterOptions: { value: RoleFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'DOCTOR', label: 'Médicos' },
    { value: 'PATIENT', label: 'Pacientes' },
    { value: 'ADMIN', label: 'Admins' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Governança de Contas</h1>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-800 dark:text-green-300" role="status">
          ✅ {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-300" role="alert">
          ❌ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Médicos Pendentes {pendingDoctors.length > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
              {pendingDoctors.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Todos os Usuários
          <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({users.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600 border-t-teal-600 dark:border-t-teal-400" />
        </div>
      ) : (
        <>
          {/* Pending Doctors Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingDoctors.length === 0 ? (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400 dark:text-green-500" />
                  <p className="mt-2 text-slate-500 dark:text-slate-400">Nenhum médico pendente de aprovação.</p>
                </div>
              ) : (
                pendingDoctors.map((doctor) => (
                  <div key={doctor.id} className="rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">{doctor.name}</h3>
                          <span className="rounded-md bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                            CRM {doctor.crm}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{doctor.user.email}</p>
                        
                        <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                          {doctor.specialty && (
                            <span className="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-lg">
                              {doctor.specialty}
                            </span>
                          )}
                          <span className="bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg">
                            Cadastrado em: {new Date(doctor.user.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 self-start md:self-auto">
                        <button
                          onClick={() => setSelectedDoctor(doctor)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
                        >
                          <Search className="h-4 w-4" />
                          Analisar
                        </button>
                        <button
                          onClick={() => handleApprove(doctor.id, doctor.name)}
                          disabled={actionLoading === `approve-${doctor.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shadow-md shadow-green-500/10"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(doctor.id, doctor.name)}
                          disabled={actionLoading === `reject-${doctor.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shadow-md shadow-red-500/10"
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* All Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, email ou ID..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>
                <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  {roleFilterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRoleFilter(opt.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        roleFilter === opt.value
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results count */}
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {filteredUsers.length} de {users.length} usuário(s)
              </p>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 w-16">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Usuário</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Papel</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => handleOpenUserModal(user)}
                          className={`cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors ${!user.isActive ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                        >
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{user.id}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">{getUserName(user)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">{roleBadge(user.role)}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit ${
                                user.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                {user.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                              {user.role === 'DOCTOR' && user.doctorProfile && user.doctorProfile.status !== 'APPROVED' && (
                                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider w-fit ${
                                  user.doctorProfile.status === 'REJECTED'
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {user.doctorProfile.status === 'REJECTED' ? 'Recusado' : 'Pendente'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenUserModal(user)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              Gerenciar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalhes do Médico */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Análise de Cadastro
              </h2>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Doctor Hero Header inside Modal */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/70">
                <div className="h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center flex-shrink-0 relative overflow-hidden ring-2 ring-teal-500/15 dark:ring-teal-400/20">
                  {selectedDoctor.profilePictureUrl ? (
                    <img
                      src={selectedDoctor.profilePictureUrl}
                      alt={selectedDoctor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedDoctor.name}</h3>
                  <p className="text-xs font-bold text-teal-600 dark:text-teal-450 uppercase mt-0.5">
                    {selectedDoctor.specialty || 'Clínico Geral'}
                  </p>
                  <span className="inline-block mt-2 rounded bg-amber-500/10 text-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Aguardando Aprovação
                  </span>
                </div>
              </div>

              {/* Grid de Detalhes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Informações Profissionais */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    Dados Profissionais
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">CRM</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedDoctor.crm}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Especialidade</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedDoctor.specialty || 'Não cadastrada'}</p>
                    </div>
                    {selectedDoctor.phone && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Telefone de Contato</span>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          {selectedDoctor.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações de Conta */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    Dados de Acesso
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">E-mail de Login</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {selectedDoctor.user.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Data de Cadastro</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {new Date(selectedDoctor.user.createdAt).toLocaleDateString('pt-BR')} às {new Date(selectedDoctor.user.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-450">Identificador (User ID)</span>
                      <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-0.5">#{selectedDoctor.user.id}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Endereço do Consultório */}
              {selectedDoctor.address ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Endereço de Atendimento
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedDoctor.address.street}, Nº {selectedDoctor.address.number}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Bairro: {selectedDoctor.address.neighborhood} | CEP: {selectedDoctor.address.zipCode}
                    </p>
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-2.5">
                      {selectedDoctor.address.city} — {selectedDoctor.address.state}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Endereço de Atendimento
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center text-xs text-slate-450 dark:text-slate-400 py-6">
                    Nenhum consultório presencial cadastrado. Atendimento exclusivo via Telemedicina.
                  </div>
                </div>
              )}

              {/* Biografia / Sobre */}
              {selectedDoctor.bio && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Biografia / Apresentação</h4>
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
                    {selectedDoctor.bio}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => handleReject(selectedDoctor.id, selectedDoctor.name)}
                disabled={actionLoading === `reject-${selectedDoctor.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shadow-md"
              >
                <XCircle className="h-4 w-4" />
                Rejeitar
              </button>
              <button
                onClick={() => handleApprove(selectedDoctor.id, selectedDoctor.name)}
                disabled={actionLoading === `approve-${selectedDoctor.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shadow-md"
              >
                <CheckCircle className="h-4 w-4" />
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Usuário */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Gerenciar Usuário
              </h2>
              <button 
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* User Hero Header inside Modal - click to edit */}
              <div 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/70 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all group"
                title="Clique aqui ou na foto para editar os dados do usuário"
              >
                <div className="h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-950/80 flex items-center justify-center flex-shrink-0 relative overflow-hidden ring-2 ring-teal-500/15 dark:ring-teal-400/20 group-hover:ring-teal-500 transition-all">
                  <User className="h-8 w-8 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Settings className="h-5 w-5 text-white animate-pulse" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5 group-hover:text-teal-600 dark:group-hover:text-teal-450 transition-colors">
                    {getUserName(selectedUser)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{selectedUser.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {roleBadge(selectedUser.role)}
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      selectedUser.isActive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {selectedUser.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-450 font-bold uppercase tracking-wider underline opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                      Editar
                    </span>
                  </div>
                </div>
              </div>

              {isEditing ? (
                /* Edit Form Mode */
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Editar Dados do Usuário
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Nome do usuário"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="E-mail do usuário"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    {selectedUser.role === 'DOCTOR' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            CRM
                          </label>
                          <input
                            type="text"
                            value={editForm.crm}
                            onChange={(e) => setEditForm({ ...editForm, crm: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            placeholder="CRM"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            Especialidade
                          </label>
                          <input
                            type="text"
                            value={editForm.specialty}
                            onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            placeholder="Ex: Clínico Geral, Cardiologia"
                          />
                        </div>



                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            Biografia / Apresentação
                          </label>
                          <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-none"
                            placeholder="Sobre o médico..."
                          />
                        </div>
                      </>
                    )}

                    {selectedUser.role === 'PATIENT' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            CPF
                          </label>
                          <input
                            type="text"
                            value={editForm.cpf}
                            onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            placeholder="CPF do paciente"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            Data de Nascimento
                          </label>
                          <input
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            Sexo / Gênero
                          </label>
                          <select
                            value={editForm.sex}
                            onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="">Não informado</option>
                            <option value="MALE">Masculino</option>
                            <option value="FEMALE">Feminino</option>
                            <option value="OTHER">Outro</option>
                          </select>
                        </div>


                      </>
                    )}

                    {selectedUser.role === 'DOCTOR' && (
                      <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Endereço
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              CEP
                            </label>
                            <input
                              type="text"
                              value={editForm.zipCode}
                              onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="00000-000"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Logradouro
                            </label>
                            <input
                              type="text"
                              value={editForm.street}
                              onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Rua, Avenida, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Número
                            </label>
                            <input
                              type="text"
                              value={editForm.number}
                              onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Nº"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Complemento
                            </label>
                            <input
                              type="text"
                              value={editForm.complement}
                              onChange={(e) => setEditForm({ ...editForm, complement: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Apt, Bloco, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Bairro
                            </label>
                            <input
                              type="text"
                              value={editForm.neighborhood}
                              onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Bairro"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Cidade
                            </label>
                            <input
                              type="text"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Cidade"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Estado (UF)
                            </label>
                            <input
                              type="text"
                              value={editForm.state}
                              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-550 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Ex: SP"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={actionLoading === `save-${selectedUser.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shadow-md"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Grid of Details */}
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 dark:text-slate-400">Identificador (User ID)</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">#{selectedUser.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 dark:text-slate-400">Data de Cadastro</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')} às {new Date(selectedUser.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-500 dark:text-slate-400">E-mail</span>
                      <span className="text-slate-700 dark:text-slate-300">{selectedUser.email}</span>
                    </div>
                    {(selectedUser.doctorProfile?.phone || selectedUser.patientProfile?.phone || selectedUser.phone) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500 dark:text-slate-400">Telefone</span>
                        <span className="text-slate-700 dark:text-slate-300">{selectedUser.doctorProfile?.phone || selectedUser.patientProfile?.phone || selectedUser.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Account Actions Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status da Conta
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {selectedUser.isActive ? 'Desativar acesso do usuário' : 'Reativar acesso do usuário'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {selectedUser.isActive 
                            ? 'O usuário não poderá acessar o sistema.' 
                            : 'O usuário recuperará acesso ao sistema.'}
                        </p>
                      </div>
                      {selectedUser.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleActive(selectedUser.id, selectedUser.isActive)}
                          disabled={actionLoading === `toggle-${selectedUser.id}`}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                            selectedUser.isActive
                              ? 'border border-red-300 dark:border-red-700 text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                              : 'border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20'
                          }`}
                        >
                          {selectedUser.isActive ? (
                            <><UserX className="h-4 w-4" /> Desativar</>
                          ) : (
                            <><UserCheck className="h-4 w-4" /> Reativar</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Doctor Status & CRM Actions Section */}
                  {selectedUser.role === 'DOCTOR' && selectedUser.doctorProfile && (
                    <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Dados Profissionais & CRM
                      </h4>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700/60">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-500 dark:text-slate-400">CRM</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{selectedUser.doctorProfile.crm}</span>
                        </div>
                        {selectedUser.doctorProfile.specialty && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500 dark:text-slate-400">Especialidade</span>
                            <span className="text-slate-700 dark:text-slate-300">{selectedUser.doctorProfile.specialty}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-500 dark:text-slate-400">Status do CRM</span>
                          <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            selectedUser.doctorProfile.status === 'APPROVED'
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : selectedUser.doctorProfile.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {selectedUser.doctorProfile.status === 'APPROVED' ? 'Aprovado' : selectedUser.doctorProfile.status === 'REJECTED' ? 'Recusado' : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      {selectedUser.doctorProfile.bio && (
                        <div className="space-y-2">
                          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Biografia / Apresentação
                          </span>
                          <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line">
                            {selectedUser.doctorProfile.bio}
                          </div>
                        </div>
                      )}

                      {selectedUser.doctorProfile.status !== 'APPROVED' && (
                        <div className="flex gap-3 justify-end mt-4">
                          <button
                            onClick={() => handleApprove(selectedUser.doctorProfile!.id, selectedUser.doctorProfile!.name)}
                            disabled={actionLoading === `approve-${selectedUser.doctorProfile.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shadow-md"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprovar CRM
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Patient Profile Section */}
                  {selectedUser.role === 'PATIENT' && selectedUser.patientProfile && (
                    <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Informações do Paciente
                      </h4>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700/60">
                        {selectedUser.patientProfile.cpf && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500 dark:text-slate-400">CPF</span>
                            <span className="font-mono text-slate-700 dark:text-slate-200">{selectedUser.patientProfile.cpf}</span>
                          </div>
                        )}
                        {selectedUser.patientProfile.dateOfBirth && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500 dark:text-slate-400">Data de Nascimento</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {new Date(selectedUser.patientProfile.dateOfBirth).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        {selectedUser.patientProfile.sex && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500 dark:text-slate-400">Sexo / Gênero</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {selectedUser.patientProfile.sex === 'MALE' ? 'Masculino' : selectedUser.patientProfile.sex === 'FEMALE' ? 'Feminino' : 'Outro'}
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {/* Address Section */}
                  {selectedUser.role === 'DOCTOR' && selectedUser.doctorProfile?.address && (
                    <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Endereço
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700/60 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 dark:text-slate-400">Logradouro</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {selectedUser.doctorProfile.address.street}, {selectedUser.doctorProfile.address.number}
                          </span>
                        </div>
                        {selectedUser.doctorProfile.address.complement && (
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-500 dark:text-slate-400">Complemento</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {selectedUser.doctorProfile.address.complement}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 dark:text-slate-400">Bairro</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {selectedUser.doctorProfile.address.neighborhood}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 dark:text-slate-400">Cidade / UF</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {selectedUser.doctorProfile.address.city} - {selectedUser.doctorProfile.address.state}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-500 dark:text-slate-400">CEP</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {selectedUser.doctorProfile.address.zipCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
