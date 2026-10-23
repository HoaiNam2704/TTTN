"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserImportModal } from "@/components/admin/users/user-import-modal";
import { AdminBreadcrumb, AdminHeader } from "@/components/layout/admin-header";
import { Alert } from "@/components/ui/alert";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/select";
import { Select } from "@/components/ui/select";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { AdminTablePagination } from "@/components/admin/admin-table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { userService } from "@/services/user.service";
import type { ApiError } from "@/services/api";
import type { UserResponseDto, UserRole } from "@/types/user";
import {
  AlertCircle,
  CalendarDays,
  CircleAlert,
  Eye,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

type DialogMode = "view" | "edit";
type FilterRole = "all" | UserRole;
type UserDraft = {
  username: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  dob: string;
  studentId: string;
  studentClass: string;
  studentMajor: string;
  password: string;
};

const PAGE_SIZE = 8;
const EMPTY_USERS: UserResponseDto[] = [];

const ROLE_OPTIONS: { value: FilterRole; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "USER", label: "User" },
  { value: "ITIS_MEMBER", label: "ITIS Member" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  USER: "User",
  ITIS_MEMBER: "ITIS Member",
};

const ROLE_BADGE_VARIANTS: Record<UserRole, "danger" | "info" | "purple"> = {
  ADMIN: "danger",
  USER: "info",
  ITIS_MEMBER: "purple",
};

function getErrorMessage(error: unknown) {
  return (error as ApiError)?.message || "Failed to load user data.";
}

function getDisplayName(user: UserResponseDto) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username;
}

function getInitials(user: UserResponseDto) {
  const name = getDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return user.username.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatNullable(value?: string | null) {
  return value && value.trim() ? value : "—";
}

function toDraft(user: UserResponseDto): UserDraft {
  return {
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    dob: user.dob ?? "",
    studentId: user.studentId ?? "",
    studentClass: user.studentClass ?? "",
    studentMajor: user.studentMajor ?? "",
    password: "",
  };
}

function trimOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 1000);
  const [studentClass, setStudentClass] = useState("");
  const [studentMajor, setStudentMajor] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [page, setPage] = useState(0);
  const { addToast } = useToast();
  const [activeUser, setActiveUser] = useState<UserResponseDto | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>("view");
  const [draftUser, setDraftUser] = useState<UserDraft | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserResponseDto | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const listFilters = useMemo(
    () => ({
      search: trimOrUndefined(debouncedSearch),
      studentClass: studentClass || undefined,
      studentMajor: studentMajor || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
    }),
    [debouncedSearch, studentClass, studentMajor, roleFilter]
  );

  const {
    data: usersPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-users", { page, ...listFilters }],
    queryFn: () =>
      userService.getUsers({
        page,
        size: PAGE_SIZE,
        ...listFilters,
      }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev,
  });

  const { data: statsPage } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: () => userService.getUsers({ size: 1000 }),
    staleTime: 30_000,
  });

  const { data: classOptionsData } = useQuery({
    queryKey: ["admin-users-classes"],
    queryFn: () => userService.getStudentClasses(),
    staleTime: 30_000,
  });

  const { data: majorOptionsData } = useQuery({
    queryKey: ["admin-users-majors"],
    queryFn: () => userService.getStudentMajors(),
    staleTime: 30_000,
  });

  const pageUsers = usersPage?.content ?? EMPTY_USERS;
  const totalUsers = usersPage?.totalElements ?? 0;
  const totalPages = Math.max(usersPage?.totalPages ?? 1, 1);
  const safePage = Math.min(page, totalPages - 1);

  const classOptions = useMemo(
    () => (classOptionsData ?? []).map((value) => ({ value, label: value })),
    [classOptionsData]
  );
  const majorOptions = useMemo(
    () => (majorOptionsData ?? []).map((value) => ({ value, label: value })),
    [majorOptionsData]
  );

  const stats = useMemo(() => {
    const allUsers = statsPage?.content ?? EMPTY_USERS;
    const admins = allUsers.filter((user) => user.role === "ADMIN").length;
    const regularUsers = allUsers.filter((user) => user.role === "USER").length;
    const members = allUsers.filter((user) => user.role === "ITIS_MEMBER").length;

    return [
      {
        label: "Total users",
        value: statsPage?.totalElements ?? allUsers.length,
        icon: Users,
        tone: "text-[#b01c24] bg-red-50",
      },
      { label: "Admin", value: admins, icon: UserCog, tone: "text-rose-600 bg-rose-50" },
      { label: "User", value: regularUsers, icon: CircleAlert, tone: "text-sky-600 bg-sky-50" },
      { label: "ITIS Member", value: members, icon: Sparkles, tone: "text-violet-600 bg-violet-50" },
    ];
  }, [statsPage]);

  const clearFilters = () => {
    setSearch("");
    setStudentClass("");
    setStudentMajor("");
    setRoleFilter("all");
    setPage(0);
  };

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-classes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-majors"] });
      setUserToDelete(null);
      addToast({ type: "success", message: "User deleted." });
    },
    onError: (mutationError) => {
      addToast({ type: "error", message: getErrorMessage(mutationError) });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Parameters<typeof userService.updateUser>[1] }) =>
      userService.updateUser(userId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-classes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-majors"] });
      addToast({ type: "success", message: "User details updated." });
    },
    onError: (mutationError) => {
      addToast({ type: "error", message: getErrorMessage(mutationError) });
    },
  });

  const openUser = (user: UserResponseDto, mode: DialogMode) => {
    setActiveUser(user);
    setDialogMode(mode);
    setDraftUser(toDraft(user));
  };

  const closeDialog = () => {
    setActiveUser(null);
    setDialogMode("view");
    setDraftUser(null);
  };

  const openDeleteModal = (user: UserResponseDto) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete.id);
  };

  const handleSaveUser = () => {
    if (!activeUser || !draftUser) return;
    updateUserMutation.mutate(
      {
        userId: activeUser.id,
        data: {
          username: draftUser.username,
          email: draftUser.email,
          phoneNumber: draftUser.phoneNumber,
          role: draftUser.role,
          firstName: draftUser.firstName,
          lastName: draftUser.lastName,
          dob: draftUser.dob || undefined,
          studentId: draftUser.studentId,
          studentClass: draftUser.studentClass || undefined,
          studentMajor: draftUser.studentMajor,
          ...(draftUser.password ? { password: draftUser.password } : {}),
        },
      },
      {
        onSuccess: () => {
          closeDialog();
        },
      }
    );
  };

  const handleRefresh = async () => {
    await refetch();
    addToast({ type: "success", message: "User list refreshed." });
  };

  const isDialogEditable = dialogMode === "edit";

  const visibleStart = totalUsers === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const visibleEnd = Math.min((safePage + 1) * PAGE_SIZE, totalUsers);

  const columns: AdminTableColumn<UserResponseDto>[] = [
    {
      key: "user",
      header: "User",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "whitespace-normal px-4 py-3 align-middle",
      cell: (user) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f2ef] text-xs font-semibold text-stone-600">
            {getInitials(user)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-stone-800">{getDisplayName(user)}</span>
            <span className="text-xs text-stone-400">{user.username}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (user) => (
        <div className="inline-flex items-center gap-2">
          <Mail className="h-4 w-4 text-stone-400" />
          <span>{user.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle",
      cell: (user) => (
        <Badge variant={ROLE_BADGE_VARIANTS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (user) => (
        <div className="inline-flex items-center gap-2">
          <Phone className="h-4 w-4 text-stone-400" />
          <span>{user.phoneNumber}</span>
        </div>
      ),
    },
    {
      key: "studentId",
      header: "Student ID",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (user) => formatNullable(user.studentId),
    },
    {
      key: "studentClass",
      header: "Class",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (user) => formatNullable(user.studentClass),
    },
    {
      key: "studentMajor",
      header: "Major",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (user) => formatNullable(user.studentMajor),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16 px-4 py-3 text-center uppercase",
      cellClassName: "w-16 px-4 py-3 text-center align-middle",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="cursor-pointer p-0" onClick={() => openUser(user, "view")}>
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Eye className="h-4 w-4" />
                View
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer p-0" onClick={() => openUser(user, "edit")}>
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Pencil className="h-4 w-4" />
                Change role
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer p-0"
              onClick={() => openDeleteModal(user)}
            >
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Trash2 className="h-4 w-4" />
                Delete
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="User management" showSearch={false} />

      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <AdminBreadcrumb
          items={[
            { label: "Admin", href: ROUTES.ADMIN },
            { label: "Users" },
          ]}
        />

        <section className="rounded-[1.5rem] border border-[#e8e4df] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Users</p>
              <h2 className="mt-1 text-2xl font-bold text-stone-850">User management</h2>
              <p className="mt-1 max-w-2xl text-sm text-stone-500">
                Data is loaded directly from the backend via `GET /api/v1/admin/users`.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleRefresh} leftIcon={<RefreshCw className="h-4 w-4" />}>
                Refresh
              </Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Card key={stat.label} className="border border-[#e8e4df] shadow-none" padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                        {stat.label}
                      </p>
                      <p className="mt-1.5 text-3xl font-bold text-stone-850">{stat.value}</p>
                    </div>
                    <div className={cn("rounded-xl p-2.5", stat.tone)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#e8e4df] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#e8e4df] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <AdminSearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(0);
                }}
                placeholder="Search username, name, email, phone..."
              />
              <FilterSelect
                value={roleFilter === "all" ? "" : roleFilter}
                onChange={(value) => {
                  setRoleFilter(value === "" ? "all" : (value as UserRole));
                  setPage(0);
                }}
                placeholder="Role"
                options={ROLE_OPTIONS.filter((option) => option.value !== "all")}
                searchable={false}
                className="min-w-[140px]"
              />
              <FilterSelect
                value={studentClass}
                onChange={(value) => {
                  setStudentClass(value);
                  setPage(0);
                }}
                placeholder="Class"
                options={classOptions}
                className="min-w-[140px]"
              />
              <FilterSelect
                value={studentMajor}
                onChange={(value) => {
                  setStudentMajor(value);
                  setPage(0);
                }}
                placeholder="Major"
                options={majorOptions}
                className="min-w-[160px]"
              />
              <Button variant="outline" className="h-9" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>

          {isError ? (
            <div className="px-5 pt-5">
              <Alert type="error" message={getErrorMessage(error)} />
            </div>
          ) : null}

          <AdminTable
            columns={columns}
            data={pageUsers}
            getRowId={(user) => user.id}
            isLoading={isLoading}
            loadingMessage="Loading user data..."
            cardClassName="border-0 shadow-none"
            headerRowClassName="border-[#e8e4df] bg-[#faf8f6] hover:bg-[#faf8f6]"
            rowClassName="border-[#e8e4df] transition-colors hover:bg-[#faf8f6]/60"
            emptyMessage={
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f2ef] text-stone-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-700">
                    No users match the current filters.
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Try clearing the search or resetting filters to see all data.
                  </p>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            }
            footer={
              <AdminTablePagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                className="border-[#e8e4df]"
                summary={`Showing ${visibleStart}-${visibleEnd} of ${totalUsers} users`}
              />
            }
          />
        </section>
      </div>

      <UserImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      <ConfirmDeleteDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
        title="Delete user?"
        description={
          <>
            {userToDelete?.username} will be permanently deleted from the system. This action cannot be
            undone.
          </>
        }
        confirmLabel="Delete user"
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      {activeUser && draftUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-xl border border-[#e8e4df] shadow-xl" padding="lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                  {dialogMode === "edit" ? "Change role" : "User details"}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-stone-850">{getDisplayName(activeUser)}</h3>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <AlertCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e8e4df] bg-[#faf8f6] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Email</p>
                <p className="mt-2 text-sm font-medium text-stone-800">{draftUser.email}</p>
              </div>
              <div className="rounded-xl border border-[#e8e4df] bg-[#faf8f6] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Phone</p>
                <p className="mt-2 text-sm font-medium text-stone-800">{draftUser.phoneNumber}</p>
              </div>
              <div className="rounded-xl border border-[#e8e4df] bg-[#faf8f6] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Student ID</p>
                <p className="mt-2 text-sm font-medium text-stone-800">{formatNullable(draftUser.studentId)}</p>
              </div>
              <div className="rounded-xl border border-[#e8e4df] bg-[#faf8f6] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Date of birth</p>
                <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-stone-800">
                  <CalendarDays className="h-4 w-4 text-stone-400" />
                  <span>{formatNullable(draftUser.dob)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Username"
                value={draftUser.username}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, username: event.target.value } : current)}
              />
              <Input
                label="Email"
                type="email"
                value={draftUser.email}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, email: event.target.value } : current)}
              />
              <Input
                label="Phone"
                value={draftUser.phoneNumber}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, phoneNumber: event.target.value } : current)}
              />
              <Select
                label="Role"
                value={draftUser.role}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, role: event.target.value as UserRole } : current)}
                options={ROLE_OPTIONS.filter((option) => option.value !== "all") as { value: UserRole; label: string }[]}
              />
              <Input
                label="First name"
                value={draftUser.firstName}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, firstName: event.target.value } : current)}
              />
              <Input
                label="Last name"
                value={draftUser.lastName}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, lastName: event.target.value } : current)}
              />
              <Input
                label="Date of birth"
                type="date"
                value={draftUser.dob}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, dob: event.target.value } : current)}
              />
              <Input
                label="Student ID"
                value={draftUser.studentId}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, studentId: event.target.value } : current)}
              />
              <Input
                label="Class"
                value={draftUser.studentClass}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, studentClass: event.target.value } : current)}
              />
              <Input
                label="Major"
                value={draftUser.studentMajor}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                onChange={(event) => setDraftUser((current) => current ? { ...current, studentMajor: event.target.value } : current)}
              />
              <Input
                label="New password"
                type="password"
                value={draftUser.password}
                readOnly={!isDialogEditable}
                disabled={!isDialogEditable}
                placeholder={isDialogEditable ? "Leave blank to keep current" : ""}
                onChange={(event) => setDraftUser((current) => current ? { ...current, password: event.target.value } : current)}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              {dialogMode === "edit" ? (
                <Button onClick={handleSaveUser} disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              ) : (
                <Button onClick={() => setDialogMode("edit")}>Edit</Button>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
