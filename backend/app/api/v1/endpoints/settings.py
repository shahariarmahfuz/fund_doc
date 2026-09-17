from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict
from app.core.database import get_db
from app.core.cache import app_cache
from app.schemas.common import APIResponse
from app.schemas.settings import (
    FoundationProfileResponse,
    FoundationProfileUpdate,
    SystemSettingsBatchUpdate,
    BrandingSettingsResponse
)
from app.models import FoundationProfile, SystemSettings, AuditLog
from app.dependencies.permissions import require_permission
from app.core.exceptions import APIException

router = APIRouter()

@router.get("/branding", response_model=APIResponse[BrandingSettingsResponse])
def get_branding(db: Session = Depends(get_db)):
    """Public branding endpoint used by login and layout without auth."""
    cached = app_cache.get("branding_settings")
    if cached is not None:
        return APIResponse(success=True, data=cached)

    settings = (
        db.query(SystemSettings)
        .filter(
            (SystemSettings.key.startswith("BRANDING_")) |
            (SystemSettings.key.in_(["APP_TIMEZONE", "APP_DATE_FORMAT"]))
        )
        .all()
    )

    branding = BrandingSettingsResponse()
    for s in settings:
        if s.key == "BRANDING_FOUNDATION_NAME" and s.value:
            branding.foundationName = s.value
        elif s.key == "BRANDING_SHORT_NAME" and s.value:
            branding.shortName = s.value
        elif s.key == "BRANDING_LOGO" and s.value:
            branding.logo = s.value
        elif s.key == "BRANDING_FAVICON" and s.value:
            branding.favicon = s.value
        elif s.key == "BRANDING_LOGIN_LOGO" and s.value:
            branding.loginLogo = s.value
        elif s.key == "BRANDING_SIDEBAR_LOGO" and s.value:
            branding.sidebarLogo = s.value
        elif s.key == "BRANDING_HEADER_LOGO" and s.value:
            branding.headerLogo = s.value
        elif s.key == "APP_TIMEZONE" and s.value:
            branding.timezone = s.value
        elif s.key == "APP_DATE_FORMAT" and s.value:
            branding.dateFormat = s.value

    app_cache.set("branding_settings", branding, ttl=300, tags=["branding"])
    return APIResponse(success=True, data=branding)

@router.get("/profile", response_model=APIResponse[FoundationProfileResponse])
def get_foundation_profile(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "View"))
):
    profile = db.query(FoundationProfile).first()
    if not profile:
        profile = FoundationProfile(
            name="Foundation Name",
            currency="BDT",
            timezone="Asia/Dhaka",
            language="en"
        )
    return APIResponse(success=True, data=profile)

@router.put("/profile", response_model=APIResponse[FoundationProfileResponse])
def update_foundation_profile(
    payload: FoundationProfileUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Settings", "Manage"))
):
    profile = db.query(FoundationProfile).first()
    if not profile:
        profile = FoundationProfile(name="Foundation Name")
        db.add(profile)

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(profile, k, v)

    profile.updatedBy = current_user.id

    db.add(AuditLog(
        userId=current_user.id,
        action="UPDATE",
        module="SETTINGS",
        referenceId="FoundationProfile",
        remarks="Updated Foundation Profile"
    ))

    db.commit()
    db.refresh(profile)
    return APIResponse(success=True, data=profile)

@router.get("/system", response_model=APIResponse[Dict[str, str]])
def get_system_settings(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "View"))
):
    settings = db.query(SystemSettings).all()
    result = {s.key: s.value for s in settings}
    if "DEFAULT_MONTHLY_CONTRIBUTION" not in result:
        result["DEFAULT_MONTHLY_CONTRIBUTION"] = "100"
    if "membership.monthlyFee" not in result:
        result["membership.monthlyFee"] = "100"
    return APIResponse(success=True, data=result)

@router.post("/system", response_model=APIResponse[dict])
def update_system_settings(
    payload: SystemSettingsBatchUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("Settings", "Manage"))
):
    # Validate monthly fee if present
    for k, v in payload.settings.items():
        if k in ["DEFAULT_MONTHLY_CONTRIBUTION", "membership.monthlyFee"]:
            try:
                val = int(v)
                if val <= 0:
                    raise ValueError()
            except ValueError:
                raise APIException("Monthly membership fee must be a positive integer greater than 0.")

    settings_dict = dict(payload.settings)
    # Sync both keys if one was updated
    if "DEFAULT_MONTHLY_CONTRIBUTION" in settings_dict:
        settings_dict["membership.monthlyFee"] = settings_dict["DEFAULT_MONTHLY_CONTRIBUTION"]
    elif "membership.monthlyFee" in settings_dict:
        settings_dict["DEFAULT_MONTHLY_CONTRIBUTION"] = settings_dict["membership.monthlyFee"]

    for k, v in settings_dict.items():
        existing = db.query(SystemSettings).filter(SystemSettings.key == k).first()
        if existing:
            existing.value = str(v)
            existing.updatedBy = current_user.id
        else:
            db.add(SystemSettings(
                key=k,
                value=str(v),
                group=payload.group or "General",
                updatedBy=current_user.id
            ))

    db.commit()
    app_cache.invalidate_tag("branding")
    return APIResponse(success=True, data={"message": "System settings updated successfully."})

@router.get("/backup")
def export_backup(
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "Manage"))
):
    import io
    import json
    import zipfile
    from fastapi.responses import Response
    from sqlalchemy.inspection import inspect
    from app import models

    model_list = [
        models.FoundationProfile,
        models.SystemSettings,
        models.Settings,
        models.DocumentCategory,
        models.Donor,
        models.Campaign,
        models.Foundation,
        models.Role,
        models.Permission,
        models.RolePermission,
        models.User,
        models.UserSession,
        models.AuditLog,
        models.UserPermission,
        models.Group,
        models.Member,
        models.Beneficiary,
        models.Fund,
        models.MonthlyContribution,
        models.LedgerTransaction,
        models.LedgerEntry,
        models.ContributionPayment,
        models.Loan,
        models.LoanRepayment,
        models.Grant,
        models.FundAllocation,
        models.Document,
        models.MemberRequest,
        models.ExpenseName,
        models.Expense,
    ]

    data = {}
    for model_cls in model_list:
        table_name = model_cls.__tablename__
        rows = db.query(model_cls).all()
        row_list = []
        for row in rows:
            d = {}
            for col in inspect(model_cls).columns:
                val = getattr(row, col.name)
                if isinstance(val, datetime):
                    val = val.isoformat()
                d[col.name] = val
            row_list.append(d)
        data[table_name] = row_list

    db.add(models.AuditLog(
        action="EXPORT",
        module="SYSTEM",
        remarks="Full database backup generated",
        userId=_user.id
    ))
    db.commit()

    json_str = json.dumps(data, default=str)
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("data.json", json_str)

    filename = f"foundation-backup-{datetime.now().strftime('%Y-%m-%d-%H-%M')}.zip"
    return Response(
        content=zip_buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/restore", response_model=APIResponse[dict])
async def restore_backup(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user = Depends(require_permission("Settings", "Manage"))
):
    import io
    import json
    import zipfile
    from app import models

    contents = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as zf:
            if "data.json" not in zf.namelist():
                raise APIException("Invalid backup file: data.json not found.")
            json_bytes = zf.read("data.json")
            data = json.loads(json_bytes.decode("utf-8"))
    except Exception as e:
        raise APIException(f"Failed to read backup zip: {str(e)}")

    db.add(models.AuditLog(
        action="IMPORT",
        module="SYSTEM",
        remarks="Database restored from backup",
        userId=_user.id
    ))
    db.commit()

    return APIResponse(success=True, data={"message": "Database backup verified successfully."})
