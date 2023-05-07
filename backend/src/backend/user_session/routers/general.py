import datetime

import psutil
from fastapi import APIRouter, Depends

from src.backend.auth.auth_helper import AuthHelper, AuthenticatedUser

router = APIRouter()

START_TIME_CONTAINER = datetime.datetime.now()


def human_readable(psutil_object):
    return {
        key.capitalize(): f"{getattr(psutil_object, key):.1f} %"
        if key == "percent"
        else f"{getattr(psutil_object, key) / (1024**3):.2f} GiB"
        for key in psutil_object._fields
    }


@router.get("/user_session_container")
async def user_session_container(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
) -> dict:
    """Get information about user session container, like when it was started
    together with memory and disk usage. NB! Note that a session container is started
    if one is not already running when accessing this endpoint."""

    return {
        "username": authenticated_user.get_username(),
        "memory_statistics": human_readable(psutil.virtual_memory()),
        "root_disk_usage": human_readable(psutil.disk_usage("/")),
    }
