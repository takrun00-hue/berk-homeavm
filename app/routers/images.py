"""مسیرهای تولید پرتره هنری."""

import json
import uuid
from pathlib import Path
from threading import Lock

from fastapi import APIRouter, Cookie, File, Form, HTTPException, Response, UploadFile

from app.core import usage
from app.core.config import settings
from app.models.schemas import PortraitResponse, RedeemRequest, RedeemResponse, StyleOption
from app.services.portrait import LANDMARK_VARIANTS, generate_portrait

router = APIRouter(prefix="/api/images", tags=["images"])

# فایل کدهای فعال‌سازی
_CODES_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "activation_codes.json"
_codes_lock = Lock()


def _load_codes() -> dict:
    if not _CODES_FILE.exists():
        return {}
    try:
        return json.loads(_CODES_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_codes(data: dict) -> None:
    _CODES_FILE.parent.mkdir(parents=True, exist_ok=True)
    _CODES_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_all_valid_codes() -> set:
    """ترکیب کدهای .env با کدهای فایل JSON."""
    codes = set(settings.ACTIVATION_CODES)
    codes.update(_load_codes().keys())
    return codes


STYLES: list[dict] = [
    {"id": "kandahari_khamak", "nameFa": "کندهاری", "nameEn": "Kandahari", "provinceHint": "kandahar"},
    {"id": "herati_silk", "nameFa": "هراتی", "nameEn": "Herati", "provinceHint": "herat"},
    {"id": "uzbek_chapan", "nameFa": "ازبیکی", "nameEn": "Uzbek", "provinceHint": "balkh"},
    {"id": "nuristani", "nameFa": "نورستانی", "nameEn": "Nuristani", "provinceHint": "nuristan"},
    {"id": "pakol_panjshiri", "nameFa": "پنجشیری", "nameEn": "Panjshiri", "provinceHint": "panjshir"},
    {"id": "hazaragi", "nameFa": "هزارگی", "nameEn": "Hazaragi", "provinceHint": "daykundi"},
    {"id": "baluchi", "nameFa": "بلوچی", "nameEn": "Baluchi", "provinceHint": "nimroz"},
    {"id": "kabuli_qaraqul", "nameFa": "کابلی", "nameEn": "Kabuli", "provinceHint": "kabul"},
    {"id": "badakhshan_lapis", "nameFa": "بدخشانی", "nameEn": "Badakhshani", "provinceHint": "badakhshan"},
    {"id": "ghazni_minaret", "nameFa": "غزنوی", "nameEn": "Ghaznavi", "provinceHint": "ghazni"},
    {"id": "nangarhar_spin_ghar", "nameFa": "ننگرهاری", "nameEn": "Nangarhari", "provinceHint": "nangarhar"},
    {"id": "ghor_jam", "nameFa": "غوری", "nameEn": "Ghori", "provinceHint": "ghor"},
    {"id": "qataghan_buzkashi", "nameFa": "قطغنی", "nameEn": "Qataghan", "provinceHint": "kunduz"},
    {"id": "mazar_sharif", "nameFa": "بلخی", "nameEn": "Balkhi", "provinceHint": "balkh"},
    {"id": "shomali_north", "nameFa": "شمالی", "nameEn": "Shomali", "provinceHint": "jowzjan"},
    {"id": "qaraqul_boland", "nameFa": "قره‌قلی", "nameEn": "Qaraquli", "provinceHint": "daykundi"},
    {"id": "paycheh_qar", "nameFa": "پایچه‌قر", "nameEn": "Paycheh Qar", "provinceHint": "herat"},
    {"id": "paycheh_qar", "nameFa": "پایچه‌قار (استایل خیابانی)", "nameEn": "Paycheh Qar Street Style", "provinceHint": "kabul"},
]


@router.get("/styles", response_model=list[StyleOption])
async def list_styles():
    return STYLES


@router.get("/landmarks")
async def list_landmarks():
    return LANDMARK_VARIANTS


@router.get("/status")
async def usage_status(response: Response, device_id: str | None = Cookie(default=None)):
    """وضعیت رایگان/پرداختی — فرانت‌اند قبل از ساخت این را چک می‌کند."""
    if not device_id:
        device_id = str(uuid.uuid4())
        response.set_cookie(key="device_id", value=device_id, max_age=60 * 60 * 24 * 365, httponly=False, samesite="lax")

    st = usage.get_status(device_id)
    is_paid = st.get("paid", False)
    free_used = st.get("free_used", False)
    can_generate = is_paid or not free_used

    return {"can_generate": can_generate, "is_paid": is_paid, "free_used": free_used}


@router.post("/portrait", response_model=PortraitResponse)
async def create_portrait(
    response: Response,
    photo: UploadFile = File(...),
    style_id: str = Form(...),
    province_id: str | None = Form(None),
    gender: str = Form("female"),
    landmark: str | None = Form(None),
    user_name: str = Form(""),
    device_id: str | None = Cookie(default=None),
):
    if photo.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="فرمت تصویر پشتیبانی نمی‌شود")

    if not any(s["id"] == style_id for s in STYLES):
        raise HTTPException(status_code=400, detail="سبک انتخاب‌شده معتبر نیست")

    if not device_id:
        device_id = str(uuid.uuid4())
    response.set_cookie(key="device_id", value=device_id, max_age=60 * 60 * 24 * 365, httponly=False, samesite="lax")

    st = usage.get_status(device_id)
    is_paid = st.get("paid", False)
    free_used = st.get("free_used", False)

    # ===== بلاک اصلی — بار دوم بدون پرداخت مسدود می‌شود =====
    if free_used and not is_paid:
        raise HTTPException(
            status_code=402,
            detail="بار اول رایگانت را استفاده کردی. برای ادامه پرداخت کن یا کد فعال‌سازی وارد کن.",
        )

    data = await photo.read()
    if len(data) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="حجم تصویر بیش از حد مجاز است")

    try:
        image_base64 = await generate_portrait(
            image_bytes=data,
            style_id=style_id,
            province_id=province_id,
            mime_type=photo.content_type,
            gender=gender,
            watermark_mode="single",
            landmark=landmark,
            user_name=user_name,
        )
    finally:
        del data

    # اولین استفاده را ثبت کن
    if not free_used and not is_paid:
        usage.mark_free_used(device_id)

    return PortraitResponse(
        request_id=str(uuid.uuid4()),
        image_base64=image_base64,
        style_id=style_id,
        province_id=province_id,
        stored=settings.STORE_PHOTOS,
        expires_in_seconds=900,
        watermark_mode="single",
        is_free=not is_paid,
    )


@router.post("/redeem", response_model=RedeemResponse)
async def redeem_activation_code(
    payload: RedeemRequest,
    response: Response,
    device_id: str | None = Cookie(default=None),
):
    if not device_id:
        device_id = str(uuid.uuid4())
        response.set_cookie(key="device_id", value=device_id, max_age=60 * 60 * 24 * 365, httponly=False, samesite="lax")

    code = payload.code.strip()
    all_codes = get_all_valid_codes()

    success = usage.redeem_code(device_id, code, all_codes)
    if not success:
        raise HTTPException(status_code=400, detail="کد فعال‌سازی نامعتبر یا قبلاً استفاده‌شده است")

    # کد را در فایل JSON «استفاده‌شده» علامت بزن
    with _codes_lock:
        codes_data = _load_codes()
        if code in codes_data:
            codes_data[code]["used"] = True
            _save_codes(codes_data)

    return RedeemResponse(success=True)
