from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_admin_id, get_current_user_id

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
# Any signed-in user whose email is listed in ADMIN_EMAILS — see
# app/core/security.py. Use for writes to the shared program catalog.
CurrentAdminId = Annotated[str, Depends(get_current_admin_id)]
