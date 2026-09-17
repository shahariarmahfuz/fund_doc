"use client"

import { useState, useMemo, useEffect } from "react"
import { updateRolePermissions } from "./actions"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/ui/section-header"
import { Badge } from "@/components/ui/badge"
import { Save, ShieldCheck, ChevronRight, ChevronDown, Folder, FolderOpen, Layers, Lock, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  HIERARCHICAL_PERMISSIONS_CONFIG,
  type ModulePermissionConfig,
  type SubmenuPermissionConfig,
  type PermissionActionConfig
} from "@/lib/permissions-config"

export function RolesManager({
  roles,
  permissions,
  rolePermissions
}: {
  roles: any[]
  permissions: any[]
  rolePermissions: any[]
}) {
  const router = useRouter()
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || "")
  const [saving, setSaving] = useState(false)

  // Map module+action to permission ID
  const permMap = useMemo(() => {
    const map = new Map<string, string>()
    permissions.forEach(p => {
      map.set(`${p.module}:${p.action}`, p.id)
    })
    return map
  }, [permissions])

  // Set of selected permission IDs for selected role
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(() => {
    return new Set(
      rolePermissions
        .filter(rp => rp.roleId === (roles[0]?.id || ""))
        .map(rp => rp.permissionId)
    )
  })

  // Update selectedPerms when role changes
  useEffect(() => {
    setSelectedPerms(
      new Set(
        rolePermissions
          .filter(rp => rp.roleId === selectedRoleId)
          .map(rp => rp.permissionId)
      )
    )
  }, [rolePermissions, selectedRoleId])

  // Track expanded state for modules and submenus
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    dashboard: true,
    members: true,
    beneficiaries: true,
  })
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({
    members_manage: true,
    beneficiaries_manage: true,
  })

  const toggleModuleExpand = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }))
  }

  const toggleSubmenuExpand = (subId: string) => {
    setExpandedSubmenus(prev => ({ ...prev, [subId]: !prev[subId] }))
  }

  // Helpers to resolve DB Permission IDs for a submenu
  const getSubmenuPermIds = (sub: SubmenuPermissionConfig): string[] => {
    const ids: string[] = []
    sub.permissions.forEach(p => {
      const id = permMap.get(`${p.module}:${p.action}`)
      if (id) ids.push(id)
    })
    return ids
  }

  // Helpers to resolve DB Permission IDs for a module
  const getModulePermIds = (mod: ModulePermissionConfig): string[] => {
    const ids: string[] = []
    mod.submenus.forEach(sub => {
      ids.push(...getSubmenuPermIds(sub))
    })
    return Array.from(new Set(ids))
  }

  // Toggle all permissions under a module
  const handleToggleModule = (mod: ModulePermissionConfig, enable: boolean) => {
    const ids = getModulePermIds(mod)
    setSelectedPerms(prev => {
      const next = new Set(prev)
      ids.forEach(id => {
        if (enable) next.add(id)
        else next.delete(id)
      })
      return next
    })
    if (enable) {
      setExpandedModules(prev => ({ ...prev, [mod.id]: true }))
    }
  }

  // Toggle all permissions under a submenu
  const handleToggleSubmenu = (sub: SubmenuPermissionConfig, enable: boolean, modId: string) => {
    const ids = getSubmenuPermIds(sub)
    setSelectedPerms(prev => {
      const next = new Set(prev)
      ids.forEach(id => {
        if (enable) next.add(id)
        else next.delete(id)
      })
      return next
    })
    if (enable) {
      setExpandedModules(prev => ({ ...prev, [modId]: true }))
      setExpandedSubmenus(prev => ({ ...prev, [sub.id]: true }))
    }
  }

  // Toggle a single permission
  const handleTogglePermission = (permId: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev)
      if (next.has(permId)) next.delete(permId)
      else next.add(permId)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await updateRolePermissions(selectedRoleId, Array.from(selectedPerms))
    if (res.success) {
      toast.success("Role permissions updated successfully")
      router.refresh()
    } else {
      toast.error(res.error || "Failed to update permissions")
    }
    setSaving(false)
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId)
  const isSuperAdmin = selectedRole?.name === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Role & Permission Control" 
        description="Select hierarchical module, submenu, and action permissions."
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar for Roles */}
        <Card className="md:w-1/4 h-fit border-border/50 shadow-sm">
          <CardHeader className="bg-muted/10 pb-4 border-b">
            <CardTitle className="text-lg">Roles</CardTitle>
            <CardDescription>Select a role to manage its permissions</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="md:hidden">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="hidden md:flex flex-col space-y-1">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium border flex items-center justify-between ${
                    selectedRoleId === r.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                      : "bg-background border-transparent hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{r.name}</span>
                  {r.name === 'SUPER_ADMIN' && <Lock className="w-3.5 h-3.5 opacity-70" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Area: Hierarchical Tree */}
        <Card className="flex-1 shadow-sm border-border/50">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b bg-muted/10 pb-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Permission Tree: <span className="text-primary">{selectedRole?.name}</span>
              </CardTitle>
              <CardDescription className="mt-1.5">
                Assign permissions across module ➔ submenu ➔ action hierarchy.
              </CardDescription>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving || isSuperAdmin}
              className="w-full sm:w-auto shadow-sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 space-y-4">
            {isSuperAdmin && (
              <div className="p-4 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600" />
                <span>All modules and actions are automatically active for the SUPER_ADMIN role.</span>
              </div>
            )}

            {/* Tree View */}
            <div className="space-y-3">
              {HIERARCHICAL_PERMISSIONS_CONFIG.map(mod => {
                const modPermIds = getModulePermIds(mod)
                const enabledModPerms = modPermIds.filter(id => selectedPerms.has(id))
                const isModAllChecked = modPermIds.length > 0 && enabledModPerms.length === modPermIds.length
                const isModSomeChecked = enabledModPerms.length > 0 && !isModAllChecked
                const isModExpanded = expandedModules[mod.id] ?? (enabledModPerms.length > 0)

                return (
                  <div key={mod.id} className="border rounded-xl bg-card shadow-xs overflow-hidden">
                    {/* Module Header Row */}
                    <div className={`flex items-center justify-between px-4 py-3.5 transition-colors ${isModExpanded ? "bg-muted/40 border-b" : "hover:bg-muted/20"}`}>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleModuleExpand(mod.id)}
                          className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isModExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <Checkbox
                          id={`mod-${mod.id}`}
                          checked={isSuperAdmin ? true : isModAllChecked ? true : isModSomeChecked ? "indeterminate" : false}
                          onCheckedChange={(c) => handleToggleModule(mod, !!c)}
                          disabled={isSuperAdmin}
                          className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                        />

                        <label
                          htmlFor={`mod-${mod.id}`}
                          className="font-semibold text-base text-foreground cursor-pointer flex items-center gap-2 select-none"
                        >
                          <Layers className="w-4 h-4 text-primary" />
                          {mod.name}
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={enabledModPerms.length > 0 ? "default" : "outline"} className="text-xs">
                          {enabledModPerms.length} / {modPermIds.length} active
                        </Badge>
                      </div>
                    </div>

                    {/* Submenus (Expanded view) */}
                    {isModExpanded && (
                      <div className="p-4 sm:pl-10 space-y-4 bg-muted/10">
                        {mod.submenus.map(sub => {
                          const subPermIds = getSubmenuPermIds(sub)
                          const enabledSubPerms = subPermIds.filter(id => selectedPerms.has(id))
                          const isSubAllChecked = subPermIds.length > 0 && enabledSubPerms.length === subPermIds.length
                          const isSubSomeChecked = enabledSubPerms.length > 0 && !isSubAllChecked
                          const isSubExpanded = expandedSubmenus[sub.id] ?? (enabledSubPerms.length > 0)

                          return (
                            <div key={sub.id} className="border border-border/70 rounded-lg bg-background p-3.5 shadow-xs space-y-3">
                              {/* Submenu Header Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleSubmenuExpand(sub.id)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {isSubExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <Checkbox
                                    id={`sub-${sub.id}`}
                                    checked={isSuperAdmin ? true : isSubAllChecked ? true : isSubSomeChecked ? "indeterminate" : false}
                                    onCheckedChange={(c) => handleToggleSubmenu(sub, !!c, mod.id)}
                                    disabled={isSuperAdmin}
                                    className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                                  />

                                  <label
                                    htmlFor={`sub-${sub.id}`}
                                    className="font-medium text-sm text-foreground cursor-pointer flex items-center gap-1.5 select-none"
                                  >
                                    {isSubExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />}
                                    {sub.name}
                                  </label>
                                </div>

                                <Badge variant="secondary" className="text-[11px] font-mono">
                                  {enabledSubPerms.length} / {subPermIds.length}
                                </Badge>
                              </div>

                              {/* Permissions List under Submenu */}
                              {isSubExpanded && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 pl-7 border-t border-border/40">
                                  {sub.permissions.map(p => {
                                    const permId = permMap.get(`${p.module}:${p.action}`)
                                    if (!permId) return null
                                    const isChecked = isSuperAdmin || selectedPerms.has(permId)

                                    return (
                                      <div
                                        key={permId}
                                        onClick={() => !isSuperAdmin && handleTogglePermission(permId)}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-md border text-xs font-medium cursor-pointer transition-all ${
                                          isChecked
                                            ? "bg-primary/5 border-primary/40 text-foreground"
                                            : "bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/50"
                                        }`}
                                      >
                                        <Checkbox
                                          id={`perm-${permId}`}
                                          checked={isChecked}
                                          onCheckedChange={() => !isSuperAdmin && handleTogglePermission(permId)}
                                          disabled={isSuperAdmin}
                                        />
                                        <label htmlFor={`perm-${permId}`} className="cursor-pointer select-none flex-1 truncate">
                                          {p.label}
                                        </label>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
