import httpx
import os
from typing import List, Dict, Optional, Union
import logging

class ForgeClient:
    def __init__(self, username: str, password: str):
        self.base_url = os.getenv("FORGE_API_URL", "https://forge.apps.education.fr/api/v4")
        # Si le username est un token, utiliser l'authentification par token
        if password == "":
            self.auth = None
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {username}"
            }
        else:
            self.auth = httpx.BasicAuth(username, password)
            self.headers = {"Content-Type": "application/json"}
        self.logger = logging.getLogger(__name__)

    async def _make_request(self, method: str, endpoint: str, **kwargs):
        url = f"{self.base_url}{endpoint}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method,
                    url,
                    auth=self.auth,
                    headers=self.headers,
                    **kwargs
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            self.logger.error(f"Forge API error: {e.response.text}")
            raise Exception(f"Forge API error: {e.response.json().get('message', str(e))}")
        except Exception as e:
            self.logger.error(f"Request failed: {str(e)}")
            raise Exception(f"Request failed: {str(e)}")

    async def list_repos(self) -> List[Dict]:
        """Liste tous les dépôts de l'utilisateur"""
        return await self._make_request("GET", "/projects?membership=true&simple=true")

    async def create_repo(self, name: str, description: Optional[str], visibility: str) -> Dict:
        """Crée un nouveau dépôt sur la forge"""
        data = {
            "name": name,
            "description": description,
            "visibility": visibility
        }
        return await self._make_request("POST", "/projects", json=data)

    async def commit_file(self, project_id: int, file_path: str, content: str, commit_message: str) -> Dict:
        """Commit un fichier dans un dépôt"""
        return await self.commit_file_with_encoding(project_id, file_path, content, commit_message, "text")
        
    async def commit_file_with_encoding(self, project_id: int, file_path: str, content: str, commit_message: str, encoding: str = "text") -> Dict:
        """Commit un fichier dans un dépôt avec encodage spécifié"""
        data = {
            "branch": "main",
            "commit_message": commit_message,
            "actions": [{
                "action": "create",
                "file_path": file_path,
                "content": content,
                "encoding": encoding
            }]
        }
        return await self._make_request(
            "POST",
            f"/projects/{project_id}/repository/commits",
            json=data
        )

    async def fork_repo(self, source_project_id: int, target_namespace: Optional[str], new_name: Optional[str]) -> Dict:
        """Fork un dépôt sur la forge"""
        data = {}
        if target_namespace:
            data["namespace"] = target_namespace
        if new_name:
            data["name"] = new_name
        
        return await self._make_request(
            "POST",
            f"/projects/{source_project_id}/fork",
            json=data
        )

    async def trigger_pipeline(self, project_id: int) -> Dict:
        """Déclenche un nouveau pipeline pour le projet"""
        return await self._make_request(
            "POST",
            f"/projects/{project_id}/pipeline",
            json={"ref": "main"}
        )
        
    async def update_repo_visibility(self, project_id: int, visibility: str) -> Dict:
        """Met à jour la visibilité d'un dépôt (public/private)"""
        data = {
            "visibility": visibility
        }
        return await self._make_request(
            "PUT",
            f"/projects/{project_id}",
            json=data
        )
        
    async def upload_repo_avatar(self, project_id: int, avatar_data: bytes) -> Dict:
        """Télécharge un avatar pour un dépôt"""
        import base64
        # Convertir les données binaires en base64
        avatar_base64 = base64.b64encode(avatar_data).decode('utf-8')
        
        data = {
            "avatar": avatar_base64
        }
        
        return await self._make_request(
            "PUT",
            f"/projects/{project_id}",
            json=data
        )

    async def enable_pages(self, project_id: int) -> Dict:
        """Active Forge Pages en créant un .gitlab-ci.yml"""
        ci_content = """pages:
  stage: deploy
  script:
    - mkdir .public
    - cp -r * .public
    - mv .public public
  artifacts:
    paths:
      - public
  only:
    - main
"""
        return await self.commit_file(
            project_id,
            ".gitlab-ci.yml",
            ci_content,
            "Enable Forge Pages"
        )
        
    async def get_pipeline_status(self, project_id: int, pipeline_id: int) -> Dict:
        """Récupère le statut d'un pipeline"""
        return await self._make_request(
            "GET",
            f"/projects/{project_id}/pipelines/{pipeline_id}"
        )
        
    async def get_pages_info(self, project_id: int) -> Dict:
        """Récupère les informations des pages d'un projet"""
        return await self._make_request(
            "GET",
            f"/projects/{project_id}/pages"
        )
