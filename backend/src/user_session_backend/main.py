from fastapi import FastAPI, Depends
from starsessions import SessionMiddleware
from starsessions.stores.redis import RedisStore

from src.services.utils.authenticated_user import AuthenticatedUser
from src.primary_backend import config
from src.primary_backend.auth.auth_helper import AuthHelper
from src.primary_backend.auth.enforce_logged_in_middleware import (
    EnforceLoggedInMiddleware,
)
from .inactivity_shutdown import InactivityShutdown


app = FastAPI()

# Add out custom middleware to enforce that user is logged in
# Also redirects to /login endpoint for some select paths
unprotected_paths = ["/logged_in_user", "/alive", "/openapi.json"]
app.add_middleware(
    EnforceLoggedInMiddleware,
    unprotected_paths=unprotected_paths,
)

session_store = RedisStore(config.REDIS_URL)
app.add_middleware(SessionMiddleware, store=session_store)


# We shut down the user session container after some
# minutes without receiving any new requests:
InactivityShutdown(app, inactivity_limit_minutes=30)


@app.get("/grid")
async def root(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
):
    return {"message": f"Hello user with userId {authenticated_user._user_id}"}
