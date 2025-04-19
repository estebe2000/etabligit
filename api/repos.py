from fastapi import APIRouter, Depends, HTTPException, status
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
