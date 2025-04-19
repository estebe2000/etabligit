from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api import repos
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="L'Établi API",
    description="API pédagogique pour gestion de dépôts GitLab"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Les fichiers statiques de Spynorama ne sont plus montés ici
# car les projets sont maintenant séparés

# Routes API
app.include_router(repos.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
