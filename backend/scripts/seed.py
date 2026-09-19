import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    Permission,
    Role,
    RolePermission,
    User,
    Foundation,
    Group,
    Fund,
    SystemSettings,
    FoundationProfile
)

DEFAULT_PERMISSIONS = [
    # Dashboard
    {"module": "Dashboard", "action": "View Dashboard"},
    {"module": "Dashboard", "action": "View Financial Cards"},
    {"module": "Dashboard", "action": "View Loan Summary"},
    {"module": "Dashboard", "action": "View Donation Summary"},
    {"module": "Dashboard", "action": "View Reports"},
    {"module": "Dashboard", "action": "View Charts"},

    # Members
    {"module": "Members", "action": "View"},
    {"module": "Members", "action": "Add"},
    {"module": "Members", "action": "Edit"},
    {"module": "Members", "action": "Delete"},

    # Beneficiaries
    {"module": "Beneficiaries", "action": "View"},
    {"module": "Beneficiaries", "action": "Add"},
    {"module": "Beneficiaries", "action": "Edit"},
    {"module": "Beneficiaries", "action": "Delete"},

    # Donors
    {"module": "Donors", "action": "View"},
    {"module": "Donors", "action": "Add"},
    {"module": "Donors", "action": "Edit"},
    {"module": "Donors", "action": "Delete"},

    # Fund Collection
    {"module": "Fund Collection", "action": "View"},
    {"module": "Fund Collection", "action": "Add"},
    {"module": "Fund Collection", "action": "Edit"},
    {"module": "Fund Collection", "action": "Delete"},

    # Financial Support
    {"module": "Financial Support", "action": "View"},
    {"module": "Financial Support", "action": "Add"},
    {"module": "Financial Support", "action": "Edit"},
    {"module": "Financial Support", "action": "Delete"},

    # Loans
    {"module": "Loans", "action": "View"},
    {"module": "Loans", "action": "Create"},
    {"module": "Loans", "action": "Edit"},
    {"module": "Loans", "action": "Delete"},
    {"module": "Loans", "action": "Approve"},
    {"module": "Loans", "action": "Receive Installment"},

    # Grants
    {"module": "Grants", "action": "View"},
    {"module": "Grants", "action": "Create"},
    {"module": "Grants", "action": "Edit"},
    {"module": "Grants", "action": "Delete"},
    {"module": "Grants", "action": "Approve"},

    # Groups
    {"module": "Groups", "action": "View"},
    {"module": "Groups", "action": "Create"},
    {"module": "Groups", "action": "Edit"},
    {"module": "Groups", "action": "Delete"},

    # Reports
    {"module": "Reports", "action": "View"},

    # Settings
    {"module": "Settings", "action": "View"},
    {"module": "Settings", "action": "Edit"},
    {"module": "Settings", "action": "Manage"},

    # Users
    {"module": "Users", "action": "View"},
    {"module": "Users", "action": "Create"},
    {"module": "Users", "action": "Edit"},
    {"module": "Users", "action": "Delete"},
    {"module": "Users", "action": "Manage"},

    # Roles & Permissions
    {"module": "Roles & Permissions", "action": "View"},
    {"module": "Roles & Permissions", "action": "Manage"},
]

ROLES = [
    "Super Admin",
    "Admin",
    "Manager",
    "Cashier",
    "Employee",
]

def seed():
    import app.models
    from app.core.database import Base, engine
    print("0. Ensuring all database tables exist in PostgreSQL...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("1. Seeding permissions...")
        created_permissions = []
        for perm in DEFAULT_PERMISSIONS:
            existing = db.query(Permission).filter_by(module=perm["module"], action=perm["action"]).first()
            if not existing:
                existing = Permission(module=perm["module"], action=perm["action"], description=f"{perm['action']} {perm['module']}")
                db.add(existing)
                db.flush()
            created_permissions.append(existing)
        db.commit()
        print(f"   -> {len(created_permissions)} permissions seeded.")

        print("2. Seeding roles...")
        role_map = {}
        for role_name in ROLES:
            existing = db.query(Role).filter_by(name=role_name).first()
            if not existing:
                existing = Role(name=role_name, description=f"{role_name} Role")
                db.add(existing)
                db.flush()
            role_map[role_name] = existing
        db.commit()
        print(f"   -> {len(role_map)} roles ready.")

        print("3. Mapping all permissions to Super Admin...")
        super_admin_role = role_map["Super Admin"]
        for p in created_permissions:
            rp = db.query(RolePermission).filter_by(roleId=super_admin_role.id, permissionId=p.id).first()
            if not rp:
                db.add(RolePermission(roleId=super_admin_role.id, permissionId=p.id))
        db.commit()
        print("   -> Super Admin permissions mapped.")

        print("4. Creating initial Super Admin user...")
        admin_user = db.query(User).filter_by(username="admin").first()
        hashed_password = get_password_hash("admin123")
        if not admin_user:
            admin_user = User(
                name="Super Admin",
                username="admin",
                email="admin@foundation.org",
                password=hashed_password,
                roleId=super_admin_role.id,
                status="ACTIVE"
            )
            db.add(admin_user)
        else:
            admin_user.password = hashed_password
            admin_user.roleId = super_admin_role.id
            admin_user.status = "ACTIVE"
        db.commit()
        print(f"   -> Super Admin user ready: username='admin', password='admin123'")

        print("5. Ensuring default Foundation & Foundation Group...")
        foundation = db.query(Foundation).first()
        if not foundation:
            foundation = Foundation(
                name="ভ্রাতৃত্ব ফাউন্ডেশন",
                description="Bhratritya Foundation Main Foundation"
            )
            db.add(foundation)
            db.flush()

        foundation_group = db.query(Group).filter_by(isFoundationGroup=True).first()
        if not foundation_group:
            foundation_group = Group(
                foundationId=foundation.id,
                name="ভ্রাতৃত্ব ফাউন্ডেশন",
                code="FOUNDATION-MAIN",
                shortName="ফাউন্ডেশন",
                description="Bhratritya Foundation Main Central Fund",
                status="ACTIVE",
                isFoundationGroup=True,
                memberSignupEnabled=False
            )
            db.add(foundation_group)
            db.flush()

        # Ensure general foundation fund (groupId is None)
        general_fund = db.query(Fund).filter_by(groupId=None).first()
        if not general_fund:
            general_fund = Fund(
                groupId=None,
                name="General Foundation Fund",
                description="Main unallocated asset pool"
            )
            db.add(general_fund)

        # Ensure Foundation Profile
        profile = db.query(FoundationProfile).first()
        if not profile:
            profile = FoundationProfile(
                name="Brotherhood Foundation",
                description="Brotherhood Foundation",
                currency="BDT",
                timezone="Asia/Dhaka",
                language="en"
            )
            db.add(profile)

        # Ensure SystemSettings
        default_settings = {
            "DEFAULT_MONTHLY_CONTRIBUTION": "100",
            "membership.monthlyFee": "100",
            "BRANDING_FOUNDATION_NAME": "Brotherhood Foundation",
            "BRANDING_SHORT_NAME": "Foundation",
            "APP_TIMEZONE": "Asia/Dhaka",
            "APP_DATE_FORMAT": "DD MMM YYYY"
        }
        for k, v in default_settings.items():
            s = db.query(SystemSettings).filter_by(key=k).first()
            if not s:
                db.add(SystemSettings(key=k, value=v, group="System"))

        db.commit()
        print("   -> Foundation, General Fund, Profile, and Settings seeded successfully.")
        print("\nSeed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
