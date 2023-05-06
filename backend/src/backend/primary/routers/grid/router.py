from fastapi import APIRouter, Depends, Request
from typing import Any

from src.services.utils.authenticated_user import AuthenticatedUser
from src.backend.auth.auth_helper import AuthHelper
from src.backend.primary.user_session_proxy import proxy_to_user_session

router = APIRouter()


@router.get("/")
async def get_vector_names_and_descriptions(
    request: Request,
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
) -> Any:
    return await proxy_to_user_session(request, authenticated_user)
