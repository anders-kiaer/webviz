import datetime

import psutil
from fastapi import APIRouter, Depends

from src.backend.auth.auth_helper import AuthHelper, AuthenticatedUser

router = APIRouter()

START_TIME_CONTAINER = datetime.datetime.now()


@router.get("/user_session_container")
async def user_session_container(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
) -> str:
    """Get information about user session container, like when it was started
    together with memory and disk usage. NB! Note that a session container is started
    if one is not already running when accessing this endpoint."""
    return (
        f"Container for user {authenticated_user.get_username()} started at {START_TIME_CONTAINER}. "
        f"Memory statistics: {psutil.virtual_memory()}. Disks: {psutil.disk_partitions()}. "
        f"Disk usage: {psutil.disk_usage('/')}."
    )
