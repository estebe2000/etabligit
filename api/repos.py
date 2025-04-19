from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import List, Optional
from .forge_client import ForgeClient

class PipelineTrigger(BaseModel):
    project_id: int
    
class VisibilityUpdate(BaseModel):
    project_id: int
    visibility: str
    
class AvatarUpload(BaseModel):
    project_id: int
    avatar: str  # Base64 encoded image data

router = APIRouter()
security = HTTPBasic()

# Modèles Pydantic
class RepoCreate(BaseModel):
    name: str
    description: Optional[str] = None
    visibility: str = "private"

class FileCommit(BaseModel):
    file_path: str
    content: str
    commit_message: str

class ForkRequest(BaseModel):
    source_project_id: int
    target_namespace: Optional[str] = None
    new_name: Optional[str] = None

class SpynoramaPublish(BaseModel):
    name: str
    token: str

# Routes API
@router.get("/repos", response_model=List[dict])
async def list_repos(credentials: HTTPBasicCredentials = Depends(security)):
    try:
        client = ForgeClient(credentials.username, credentials.password)
        return client.list_repos()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/repos", status_code=status.HTTP_201_CREATED)
async def create_repo(repo: RepoCreate, credentials: HTTPBasicCredentials = Depends(security)):
    try:
        client = ForgeClient(credentials.username, credentials.password)
        return client.create_repo(repo.name, repo.description, repo.visibility)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/repos/{project_id}/commit")
async def commit_file(
    project_id: int,
    commit: FileCommit,
    credentials: HTTPBasicCredentials = Depends(security)
):
    try:
        client = ForgeClient(credentials.username, credentials.password)
        return client.commit_file(project_id, commit.file_path, commit.content, commit.commit_message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/repos/fork-template")
async def fork_template(fork: ForkRequest, credentials: HTTPBasicCredentials = Depends(security)):
    try:
        client = ForgeClient(credentials.username, credentials.password)
        return client.fork_repo(
            fork.source_project_id,
            fork.target_namespace,
            fork.new_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/repos/trigger-pipeline")
async def trigger_pipeline(trigger: PipelineTrigger, credentials: HTTPBasicCredentials = Depends(security)):
    try:
        client = ForgeClient(credentials.username, credentials.password)
        return client.trigger_pipeline(trigger.project_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
@router.put("/repos/{project_id}/visibility")
async def update_repo_visibility(
    project_id: int,
    update: VisibilityUpdate,
    credentials: HTTPBasicCredentials = Depends(security)
):
    try:
        client = ForgeClient(credentials.username, credentials.password)
        return client.update_repo_visibility(project_id, update.visibility)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
@router.put("/repos/{project_id}/avatar")
async def upload_repo_avatar(
    project_id: int,
    avatar: AvatarUpload,
    credentials: HTTPBasicCredentials = Depends(security)
):
    try:
        client = ForgeClient(credentials.username, credentials.password)
        # Décoder les données base64 en binaire
        import base64
        avatar_data = base64.b64decode(avatar.avatar)
        return client.upload_repo_avatar(project_id, avatar_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/publish-spynorama", status_code=status.HTTP_201_CREATED)
async def publish_spynorama(
    file: UploadFile = File(...),
    name: str = Form(...),
    token: str = Form(...)
):
    try:
        # Lire le contenu du fichier ZIP
        content = await file.read()
        
        # Créer un client Forge avec le token fourni
        client = ForgeClient(token, "")
        
        # Créer un nouveau dépôt pour le spynorama
        repo = await client.create_repo(name, f"Spynorama: {name}", "public")
        
        # Extraire le ZIP et publier les fichiers
        import zipfile
        import io
        import os
        
        # Créer un répertoire temporaire pour extraire les fichiers
        with zipfile.ZipFile(io.BytesIO(content)) as zip_ref:
            # Parcourir tous les fichiers du ZIP
            for file_info in zip_ref.infolist():
                if file_info.is_dir():
                    continue
                    
                # Lire le contenu du fichier
                file_content = zip_ref.read(file_info.filename)
                
                # Déterminer si c'est un fichier texte ou binaire
                try:
                    # Essayer de décoder en UTF-8 pour les fichiers texte
                    text_content = file_content.decode('utf-8')
                    encoding = 'text'
                except UnicodeDecodeError:
                    # Si échec, c'est un fichier binaire
                    import base64
                    text_content = base64.b64encode(file_content).decode('utf-8')
                    encoding = 'base64'
                
                # Commit le fichier dans le dépôt
                await client.commit_file_with_encoding(
                    repo['id'],
                    file_info.filename,
                    text_content,
                    f"Ajout de {file_info.filename}",
                    encoding
                )
        
        # Activer GitLab Pages en ajoutant un fichier .gitlab-ci.yml
        await client.enable_pages(repo['id'])
        
        # Déclencher un pipeline pour déployer les pages
        pipeline = await client.trigger_pipeline(repo['id'])
        
        # Attendre que le pipeline soit terminé et récupérer l'URL des pages
        import asyncio
        
        # Attendre un peu pour que le pipeline démarre
        await asyncio.sleep(5)
        
        # Vérifier le statut du pipeline toutes les 5 secondes pendant 1 minute max
        max_attempts = 12
        for _ in range(max_attempts):
            pipeline_status = await client.get_pipeline_status(repo['id'], pipeline['id'])
            if pipeline_status['status'] in ['success', 'failed', 'canceled']:
                break
            await asyncio.sleep(5)
        
        # Récupérer l'URL des pages
        pages_url = ""
        try:
            pages_info = await client.get_pages_info(repo['id'])
            pages_url = pages_info.get('url', '')
        except Exception:
            # Si les pages ne sont pas encore disponibles, construire l'URL manuellement
            pages_url = f"https://{repo['namespace']['path']}.forge.apps.education.fr/{repo['path']}/"
        
        return {
            "success": True,
            "repo_id": repo['id'],
            "repo_name": repo['name'],
            "pages_url": pages_url
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
