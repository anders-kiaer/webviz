import httpx
from fastapi import APIRouter, Depends, Request

from src.services.utils.authenticated_user import AuthenticatedUser
from src.backend.auth.auth_helper import AuthHelper
from src.backend.primary.radix_job_utilities import proxy_to_radix_job

router = APIRouter()


@router.get("/")
async def get_vector_names_and_descriptions(
    request: Request,
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
):
    return await proxy_to_radix_job(request, authenticated_user)
