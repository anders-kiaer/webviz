# Webviz

## Development

### How to get started

The easiest way to set up a development environment (frontend + backend) is to run:
```bash
docker-compose up
```
You can then access
* frontend application at `http://localhost:8080`
* backend at `http://localhost:8080/api/`
* backend API documentation at `http://localhost:8080/api/docs`

Before you start however you need to create a file `.env` at the root of the project
with the following variable:
```
WEBVIZ_CLIENT_SECRET=...
```

### Hot reload

Both frontend and backend are hot reloaded through `docker compose` when files
in the following folders are changed:
```
./frontend/public
./frontend/src
./frontend/theme
./backend/src
```

If other files are changed through the host operativey system,
e.g. typically when a new dependency is added, the relevant component needs to be rebuilt. I.e.
`docker-compose up --build frontend` or `docker-compose up --build backend`.

### Auto-generate `/frontend/src/api`

All the content in `/frontend/src/api` is auto-generated using the defined endpoints
in the Python backend. In order to update the auto-generated code you can either

1) Run `npm run generate-api --prefix ./frontend`.
2) Use the VSCode tasks shortcut:
    a) `Ctrl + P` to open the command palette.
    b) Type `> Tasks` and enter to filter to commands only.
    c) Run task "Generate frontend code from OpenAPI".

In both cases the backend needs to already be running (e.g. using `docker-compose`
as stated above).


# Update `poetry.lock` through Docker

If you do not want to install the correct Python version and/or `poetry` on your host
machine, you can update `pyproject.toml` and `poetry.lock` through `docker`.
As an example, if you wanted to add the Python package `httpx`:

```bash
# Start container. This assumes you have previously ran docker-compose
CONTAINER_ID=$(docker run --detach --env WEBVIZ_CLIENT_SECRET=0 webviz_backend)
# Copy pyproject.toml and poetry.lock from host to container in case they have changed since it was built:
docker cp ./backend/pyproject.toml $CONTAINER_ID:/home/appuser/backend/
docker cp ./backend/poetry.lock $CONTAINER_ID:/home/appuser/backend/
# Run your poetry commands:
docker exec -it $CONTAINER_ID sh -c "poetry add httpx"
# Copy updated pyproject.toml and poetry.lock from container back to host:
docker cp $CONTAINER_ID:/home/appuser/backend/pyproject.toml ./backend/
docker cp $CONTAINER_ID:/home/appuser/backend/poetry.lock ./backend/
# Stop container
docker stop $CONTAINER_ID
```


# Cache data in memory

Sometimes large memory sets needs to be loaded from e.g. a database in order to do
some calculation. If the user interacts with this data through a series of requests to
the backend, it is inefficient to load this data every time. Instead the recommended
pattern is to load large data sets using a separate container instance bound to the
user.

Technically this is done like this:
1) The frontend makes a requests to the (primary) backend as usual.
2) The data demanding endpoints in the primary backend proxies the request to a separate
   job container runnings its own server (also using FastAPI as framework), and returns
   the result to the frontend when the job container responds.
3) If the user does not already have a job container bound to his user ID, the
   cloud infrastructure will spin it up (takes some seconds).

On route level this is implemented like the following:

**In primary backend:**
```python
from fastapi import Depends, Request

from src.services.utils.authenticated_user import AuthenticatedUser
from src.primary_backend.auth.auth_helper import AuthHelper
from src.primary_backend.radix_job_utilities import proxy_to_radix_job

router = APIRouter()

@router.get("/some_endpoint")
async def my_function(
    request: Request,
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
):
    return await proxy_to_radix_job(request, authenticated_user)
```

**In user session job backend:**
```python
from functools import lru_cache
from fastapi import Depends

from src.services.utils.authenticated_user import AuthenticatedUser
from src.primary_backend.auth.auth_helper import AuthHelper

@app.get("/some_endpoint")
async def root(
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
):
    return {"data": load_some_large_data_set(authenticated_user)}

@lru_cache
def load_some_large_data_set(authenticated_user):
    ...
```

The endpoint should have the same path as shown here
in both primary backend and the job backend.
