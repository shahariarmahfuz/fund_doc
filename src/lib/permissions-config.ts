export interface PermissionActionConfig {
  module: string
  action: string
  label: string
}

export interface SubmenuPermissionConfig {
  id: string
  name: string
  href?: string
  permissions: PermissionActionConfig[]
}

export interface ModulePermissionConfig {
  id: string
  name: string
  moduleKey: string
  submenus: SubmenuPermissionConfig[]
}

export const HIERARCHICAL_PERMISSIONS_CONFIG: ModulePermissionConfig[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    moduleKey: "Dashboard",
    submenus: [
      {
        id: "dashboard_overview",
        name: "Dashboard Overview",
        href: "/",
        permissions: [
          { module: "Dashboard", action: "View", label: "View Dashboard" }
        ]
      }
    ]
  },
  {
    id: "members",
    name: "Members",
    moduleKey: "Members",
    submenus: [
      {
        id: "members_manage",
        name: "Manage Members",
        href: "/members/manage",
        permissions: [
          { module: "Members", action: "View", label: "View Members List" },
          { module: "Members", action: "Edit", label: "Edit Member" },
          { module: "Members", action: "Delete", label: "Delete Member" }
        ]
      },
      {
        id: "members_add",
        name: "Add Member",
        href: "/members/new",
        permissions: [
          { module: "Members", action: "Add", label: "Create New Member" }
        ]
      },
      {
        id: "members_ledger",
        name: "Member Ledger",
        href: "/members/ledger",
        permissions: [
          { module: "Members", action: "View", label: "View Member Ledger" }
        ]
      },
      {
        id: "members_dues",
        name: "Member Dues",
        href: "/members/dues",
        permissions: [
          { module: "Members", action: "View", label: "View Dues List" }
        ]
      }
    ]
  },
  {
    id: "beneficiaries",
    name: "Beneficiaries",
    moduleKey: "Beneficiaries",
    submenus: [
      {
        id: "beneficiaries_manage",
        name: "Manage Beneficiaries",
        href: "/beneficiaries/manage",
        permissions: [
          { module: "Beneficiaries", action: "View", label: "View Beneficiaries List" },
          { module: "Beneficiaries", action: "Edit", label: "Edit Beneficiary & Status" },
          { module: "Beneficiaries", action: "Delete", label: "Delete Beneficiary" }
        ]
      },
      {
        id: "beneficiaries_add",
        name: "Add Beneficiary",
        href: "/beneficiaries/new",
        permissions: [
          { module: "Beneficiaries", action: "Add", label: "Create New Beneficiary" }
        ]
      },
      {
        id: "beneficiaries_ledger",
        name: "Beneficiary Ledger & History",
        href: "/beneficiaries/ledger",
        permissions: [
          { module: "Beneficiaries", action: "View", label: "View Beneficiary Ledger & History" }
        ]
      }
    ]
  },
  {
    id: "donors",
    name: "Donors",
    moduleKey: "Donors",
    submenus: [
      {
        id: "donors_manage",
        name: "Manage Donors",
        href: "/donors/manage",
        permissions: [
          { module: "Donors", action: "View", label: "View Donors List" },
          { module: "Donors", action: "Edit", label: "Edit Donor" },
          { module: "Donors", action: "Delete", label: "Delete Donor" }
        ]
      },
      {
        id: "donors_add",
        name: "Add Donor",
        href: "/donors/new",
        permissions: [
          { module: "Donors", action: "Add", label: "Create New Donor" }
        ]
      },
      {
        id: "donors_receive",
        name: "Receive Donation",
        href: "/donors/receive",
        permissions: [
          { module: "Donors", action: "Receive Installment", label: "Record / Receive Donation" }
        ]
      }
    ]
  },
  {
    id: "fund_collection",
    name: "Fund Collection",
    moduleKey: "Fund Collection",
    submenus: [
      {
        id: "contributions_manage",
        name: "Manage Contributions",
        href: "/contributions",
        permissions: [
          { module: "Fund Collection", action: "View", label: "View Contributions List" },
          { module: "Fund Collection", action: "Edit", label: "Edit Contribution Details" },
          { module: "Fund Collection", action: "Delete", label: "Delete Contribution Record" }
        ]
      },
      {
        id: "contributions_add",
        name: "Collect Contribution",
        href: "/contributions/new",
        permissions: [
          { module: "Fund Collection", action: "Add", label: "Record New Contribution" }
        ]
      }
    ]
  },
  {
    id: "loans",
    name: "Qard Hasan",
    moduleKey: "Loans",
    submenus: [
      {
        id: "loans_manage",
        name: "Manage Qard Hasan",
        href: "/loans",
        permissions: [
          { module: "Loans", action: "View", label: "View Qard Hasan List" },
          { module: "Loans", action: "Edit", label: "Edit Qard Hasan Application" },
          { module: "Loans", action: "Delete", label: "Delete Qard Hasan" }
        ]
      },
      {
        id: "loans_add",
        name: "New Qard Hasan",
        href: "/loans/new",
        permissions: [
          { module: "Loans", action: "Add", label: "Create New Qard Hasan" }
        ]
      },
      {
        id: "loans_repayments",
        name: "Qard Hasan Repayments",
        href: "/loans/repayments",
        permissions: [
          { module: "Loans", action: "Manage", label: "Receive & Complete Installments" }
        ]
      }
    ]
  },
  {
    id: "grants",
    name: "Sadaqah",
    moduleKey: "Grants",
    submenus: [
      {
        id: "grants_manage",
        name: "Manage Sadaqah",
        href: "/grants/manage",
        permissions: [
          { module: "Grants", action: "View", label: "View Sadaqah List" },
          { module: "Grants", action: "Edit", label: "Edit Sadaqah" },
          { module: "Grants", action: "Delete", label: "Delete Sadaqah" }
        ]
      },
      {
        id: "grants_add",
        name: "New Sadaqah",
        href: "/grants/new",
        permissions: [
          { module: "Grants", action: "Add", label: "Disburse New Sadaqah" }
        ]
      }
    ]
  },
  {
    id: "expenses",
    name: "Expenses",
    moduleKey: "Expenses",
    submenus: [
      {
        id: "expenses_names",
        name: "Add Expense Name",
        href: "/expenses/names",
        permissions: [
          { module: "Expenses", action: "View", label: "View Expense Names" },
          { module: "Expenses", action: "Add", label: "Create Expense Name" }
        ]
      },
      {
        id: "expenses_manage_names",
        name: "Manage Expense Names",
        href: "/expenses/names/manage",
        permissions: [
          { module: "Expenses", action: "View", label: "View Expense Names" },
          { module: "Expenses", action: "Edit", label: "Edit Expense Name" },
          { module: "Expenses", action: "Delete", label: "Delete Expense Name" }
        ]
      },
      {
        id: "expenses_add",
        name: "Add Expense",
        href: "/expenses/new",
        permissions: [
          { module: "Expenses", action: "Add", label: "Record Expense" }
        ]
      },
      {
        id: "expenses_manage",
        name: "Manage Expenses",
        href: "/expenses/manage",
        permissions: [
          { module: "Expenses", action: "View", label: "View Expenses List" },
          { module: "Expenses", action: "Edit", label: "Edit Expense" },
          { module: "Expenses", action: "Delete", label: "Delete Expense" }
        ]
      },
      {
        id: "expenses_reports",
        name: "Expense Report",
        href: "/expenses/reports",
        permissions: [
          { module: "Expenses", action: "View", label: "View Expense Report" }
        ]
      },
      {
        id: "expenses_ledger",
        name: "Expense Ledger",
        href: "/expenses/ledger",
        permissions: [
          { module: "Expenses", action: "View", label: "View Expense Ledger" }
        ]
      }
    ]
  },
  {
    id: "groups",
    name: "Groups",
    moduleKey: "Groups",
    submenus: [
      {
        id: "groups_manage",
        name: "Manage Groups",
        href: "/groups/manage",
        permissions: [
          { module: "Groups", action: "View", label: "View Groups List" },
          { module: "Groups", action: "Edit", label: "Edit Group Info" },
          { module: "Groups", action: "Delete", label: "Archive / Delete Group" }
        ]
      },
      {
        id: "groups_add",
        name: "New Group",
        href: "/groups/new",
        permissions: [
          { module: "Groups", action: "Add", label: "Create New Group" }
        ]
      }
    ]
  },
  {
    id: "reports",
    name: "Reports",
    moduleKey: "Reports",
    submenus: [
      {
        id: "reports_view",
        name: "Reports & Analytics",
        href: "/reports",
        permissions: [
          { module: "Reports", action: "View", label: "View Financial & Operational Reports" }
        ]
      }
    ]
  },
  {
    id: "users",
    name: "Users",
    moduleKey: "Users",
    submenus: [
      {
        id: "users_manage",
        name: "User List & Permissions",
        href: "/settings/users",
        permissions: [
          { module: "Users", action: "View", label: "View Users List" },
          { module: "Users", action: "Edit", label: "Edit User & Custom Permissions" },
          { module: "Users", action: "Delete", label: "Delete User" }
        ]
      },
      {
        id: "users_add",
        name: "New User",
        href: "/settings/users",
        permissions: [
          { module: "Users", action: "Add", label: "Create New User Account" }
        ]
      }
    ]
  },
  {
    id: "roles_permissions",
    name: "Roles & Permissions",
    moduleKey: "Roles & Permissions",
    submenus: [
      {
        id: "roles_manage",
        name: "Role Permission Configuration",
        href: "/settings/roles",
        permissions: [
          { module: "Roles & Permissions", action: "View", label: "View Roles" },
          { module: "Roles & Permissions", action: "Manage", label: "Modify & Save Permissions" }
        ]
      }
    ]
  },
  {
    id: "settings",
    name: "Settings",
    moduleKey: "Settings",
    submenus: [
      {
        id: "settings_general",
        name: "General & System Settings",
        href: "/settings",
        permissions: [
          { module: "Settings", action: "View", label: "View Settings" },
          { module: "Settings", action: "Edit", label: "Save Settings" },
          { module: "Settings", action: "Manage", label: "Advanced Configurations" }
        ]
      }
    ]
  }
]
