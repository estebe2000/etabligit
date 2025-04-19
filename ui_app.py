from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory
import httpx
import os
import logging
import random
import glob

app = Flask(__name__)

# Configuration pour servir les fichiers statiques des répertoires "medias" et "tuto"
@app.route('/medias/<path:filename>')
def serve_media(filename):
    return send_from_directory('medias', filename)

@app.route('/tuto/<path:filename>')
def serve_tuto(filename):
    return send_from_directory('tuto', filename)
app.secret_key = "dev"  # À remplacer par une clé sécurisée en production

# Configuration
FORGE_API_URL = os.getenv("FORGE_API_URL", "https://forge.apps.education.fr/api/v4")

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Authentification
        session["forge_token"] = request.form.get("token")
        return redirect(url_for("repos"))
    
    # Récupérer la liste des images du répertoire "medias"
    images = glob.glob("medias/*.jpg")
    
    # Sélectionner une image au hasard
    random_image = None
    if images:
        random_image = random.choice(images)
        # Convertir le chemin pour l'URL (enlever "medias/" du début)
        random_image = random_image.replace("\\", "/")  # Pour Windows
        # S'assurer que le chemin est correctement formaté pour l'URL
        if random_image.startswith("medias/"):
            random_image = random_image[7:]  # Enlever "medias/" du début
    
    return render_template("auth.html", random_image=random_image)

@app.route("/repos")
def repos():
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    try:
        # Récupérer la liste des projets
        projects_response = httpx.get(
            f"{FORGE_API_URL}/projects?membership=true&simple=true",
            headers={"Authorization": f"Bearer {session['forge_token']}"}
        )
        projects_response.raise_for_status()
        repos = projects_response.json()

        # Ajouter l'URL des pages pour chaque projet
        for repo in repos:
            # Récupérer l'URL des pages
            try:
                pages_response = httpx.get(
                    f"{FORGE_API_URL}/projects/{repo['id']}/pages",
                    headers={"Authorization": f"Bearer {session['forge_token']}"}
                )
                if pages_response.status_code == 200:
                    pages_info = pages_response.json()
                    repo['pages_url'] = pages_info.get('url', '')
            except Exception:
                repo['pages_url'] = ''
    except Exception as e:
        flash(f"Erreur lors de la récupération des dépôts: {str(e)}", "error")
        repos = []
    
    return render_template("repos.html", repos=repos)

@app.route("/create-repo", methods=["GET", "POST"])
def create_repo():
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    if request.method == "POST":
        try:
            # Vérifier si le dépôt existe déjà
            repos_response = httpx.get(
                f"{FORGE_API_URL}/projects?membership=true&search={request.form.get('name')}",
                headers={"Authorization": f"Bearer {session['forge_token']}"}
            )
            repos_response.raise_for_status()
            
            if len(repos_response.json()) > 0:
                flash("Un dépôt avec ce nom existe déjà", "error")
                return redirect(url_for("create_repo"))
                
            # Créer le dépôt
            response = httpx.post(
                f"{FORGE_API_URL}/projects",
                headers={"Authorization": f"Bearer {session['forge_token']}"},
                json={
                    "name": request.form.get("name"),
                    "description": request.form.get("description"),
                    "visibility": request.form.get("visibility", "private")
                }
            )
            response.raise_for_status()
            flash("Dépôt créé avec succès!", "success")
            return redirect(url_for("repos"))
        except Exception as e:
            flash(f"Erreur lors de la création du dépôt: {str(e)}", "error")
    
    return render_template("create_repo.html")

@app.route("/get-file/<int:project_id>")
def get_file(project_id):
    if "forge_token" not in session:
        return {"error": "Unauthorized"}, 401
    
    file_path = request.args.get('path')
    try:
        response = httpx.get(
            f"{FORGE_API_URL}/projects/{project_id}/repository/files/{file_path.replace('/', '%2F')}",
            headers={"Authorization": f"Bearer {session['forge_token']}"},
            params={"ref": "master"}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}, 400

@app.route("/edit/<int:project_id>", methods=["GET", "POST"])
def edit_file(project_id):
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    # Récupérer la liste de tous les fichiers
    files = []
    try:
        tree_response = httpx.get(
            f"{FORGE_API_URL}/projects/{project_id}/repository/tree",
            headers={"Authorization": f"Bearer {session['forge_token']}"},
            params={"ref": "master", "recursive": "true"}
        )
        if tree_response.status_code == 200:
            files = [item for item in tree_response.json() if item['type'] == 'blob']
            # Exclure les fichiers système comme .gitkeep
            files = [f for f in files if not f['path'].endswith('.gitkeep')]
    except Exception as e:
        flash(f"Erreur lors de la récupération des fichiers: {str(e)}", "error")
    
    if request.method == "POST":
        action = request.form.get('action')
        try:
            if action == 'edit':
                file_path = request.form.get('file_path')
                content = request.form.get('content')
                commit_message = request.form.get('commit_message')
                
                # Vérifier si le fichier existe
                try:
                    httpx.get(
                        f"{FORGE_API_URL}/projects/{project_id}/repository/files/{file_path.replace('/', '%2F')}",
                        headers={"Authorization": f"Bearer {session['forge_token']}"},
                        params={"ref": "master"}
                    )
                    file_action = "update"
                except httpx.HTTPStatusError:
                    file_action = "create"

                response = httpx.post(
                    f"{FORGE_API_URL}/projects/{project_id}/repository/commits",
                    headers={"Authorization": f"Bearer {session['forge_token']}"},
                    json={
                        "branch": "master",
                        "commit_message": commit_message,
                        "actions": [{
                            "action": file_action,
                            "file_path": file_path,
                            "content": content
                        }]
                    }
                )
                response.raise_for_status()
                flash("Fichier enregistré avec succès!", "success")
            
            elif action == 'delete':
                file_path = request.form.get('file_path')
                response = httpx.post(
                    f"{FORGE_API_URL}/projects/{project_id}/repository/commits",
                    headers={"Authorization": f"Bearer {session['forge_token']}"},
                    json={
                        "branch": "master",
                        "commit_message": f"Suppression de {file_path}",
                        "actions": [{
                            "action": "delete",
                            "file_path": file_path
                        }]
                    }
                )
                response.raise_for_status()
                flash("Fichier supprimé avec succès!", "success")
            
            elif action == 'create_dir':
                dir_path = request.form.get('dir_path')
                # Créer un fichier vide pour créer le répertoire
                response = httpx.post(
                    f"{FORGE_API_URL}/projects/{project_id}/repository/commits",
                    headers={"Authorization": f"Bearer {session['forge_token']}"},
                    json={
                        "branch": "master",
                        "commit_message": f"Création du répertoire {dir_path}",
                        "actions": [{
                            "action": "create",
                            "file_path": f"{dir_path}/.gitkeep",
                            "content": ""
                        }]
                    }
                )
                response.raise_for_status()
                flash("Répertoire créé avec succès!", "success")
            
            elif action == 'upload':
                file = request.files['file']
                file_path = request.form.get('file_path')
                file_content = file.read()
                
                # Détecter si c'est un fichier texte ou binaire
                try:
                    content = file_content.decode('utf-8')
                    encoding = 'text'
                except UnicodeDecodeError:
                    import base64
                    content = base64.b64encode(file_content).decode('utf-8')
                    encoding = 'base64'
                
                response = httpx.post(
                    f"{FORGE_API_URL}/projects/{project_id}/repository/commits",
                    headers={"Authorization": f"Bearer {session['forge_token']}"},
                    json={
                        "branch": "master",
                        "commit_message": f"Ajout de {file_path}",
                        "actions": [{
                            "action": "create",
                            "file_path": file_path,
                            "content": content,
                            "encoding": encoding
                        }]
                    }
                )
                response.raise_for_status()
                flash("Fichier uploadé avec succès!", "success")
            
            return redirect(url_for("edit_file", project_id=project_id))
        except Exception as e:
            flash(f"Erreur lors de l'opération: {str(e)}", "error")
    
    return render_template("editor.html", 
                         project_id=project_id,
                         files=files)

@app.route("/trigger-pipeline/<int:project_id>", methods=["POST"])
def trigger_pipeline(project_id):
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    try:
        # Vérifier quelle branche existe (master ou main)
        default_branch = "master"
        branch_response = httpx.get(
            f"{FORGE_API_URL}/projects/{project_id}/repository/branches/master",
            headers={"Authorization": f"Bearer {session['forge_token']}"}
        )
        if branch_response.status_code != 200:
            branch_response = httpx.get(
                f"{FORGE_API_URL}/projects/{project_id}/repository/branches/main",
                headers={"Authorization": f"Bearer {session['forge_token']}"}
            )
            if branch_response.status_code == 200:
                default_branch = "main"
            else:
                raise Exception("Aucune branche principale (master/main) trouvée")

        # Lancer le pipeline avec une requête plus simple
        response = httpx.post(
            f"{FORGE_API_URL}/projects/{project_id}/pipeline",
            headers={
                "Authorization": f"Bearer {session['forge_token']}",
                "Content-Type": "application/json"
            },
            json={
                "ref": default_branch
            }
        )
        
        logging.info(f"Réponse API pipeline - Status: {response.status_code}")
        logging.info(f"Headers: {response.headers}")
        logging.info(f"Body: {response.text}")
        response.raise_for_status()
        flash("Pipeline lancé avec succès!", "success")
    except Exception as e:
        flash(f"Erreur lors du lancement du pipeline: {str(e)}", "error")
    
    return redirect(url_for("repos"))

@app.route("/upload-avatar/<int:project_id>", methods=["POST"])
def upload_avatar(project_id):
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    try:
        if 'avatar' not in request.files:
            flash("Aucun fichier sélectionné", "error")
            return redirect(url_for("repos"))
            
        avatar_file = request.files['avatar']
        if avatar_file.filename == '':
            flash("Aucun fichier sélectionné", "error")
            return redirect(url_for("repos"))
            
        # Vérifier le type de fichier
        if not avatar_file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            flash("Format de fichier non supporté. Utilisez PNG, JPG, JPEG ou GIF.", "error")
            return redirect(url_for("repos"))
            
        # Lire le contenu du fichier
        avatar_data = avatar_file.read()
        
        # Convertir en base64
        import base64
        avatar_base64 = base64.b64encode(avatar_data).decode('utf-8')
        
        # Mettre à jour l'avatar du projet
        response = httpx.put(
            f"{FORGE_API_URL}/projects/{project_id}",
            headers={"Authorization": f"Bearer {session['forge_token']}"},
            json={"avatar": avatar_base64}
        )
        response.raise_for_status()
        flash("Avatar du dépôt mis à jour avec succès!", "success")
    except Exception as e:
        flash(f"Erreur lors de la mise à jour de l'avatar: {str(e)}", "error")
    
    return redirect(url_for("repos"))

@app.route("/edit-repo/<int:project_id>", methods=["GET"])
def edit_repo(project_id):
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    try:
        # Récupérer les détails du dépôt
        response = httpx.get(
            f"{FORGE_API_URL}/projects/{project_id}",
            headers={"Authorization": f"Bearer {session['forge_token']}"}
        )
        response.raise_for_status()
        repo = response.json()
        
        return render_template("edit_repo.html", repo=repo)
    except Exception as e:
        flash(f"Erreur lors de la récupération des détails du dépôt: {str(e)}", "error")
        return redirect(url_for("repos"))

@app.route("/update-repo/<int:project_id>", methods=["POST"])
def update_repo(project_id):
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    try:
        action = request.form.get("action")
        
        if action == "update_description":
            description = request.form.get("description")
            
            # Mettre à jour la description du dépôt
            response = httpx.put(
                f"{FORGE_API_URL}/projects/{project_id}",
                headers={"Authorization": f"Bearer {session['forge_token']}"},
                json={"description": description}
            )
            response.raise_for_status()
            flash("Description du dépôt mise à jour avec succès!", "success")
        
    except Exception as e:
        flash(f"Erreur lors de la mise à jour du dépôt: {str(e)}", "error")
    
    return redirect(url_for("repos"))

@app.route("/delete-repo/<int:project_id>", methods=["POST"])
def delete_repo(project_id):
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    # Vérifier le token de confirmation
    confirmation_token = request.form.get("confirmation_token")
    if not confirmation_token or confirmation_token != session["forge_token"]:
        flash("Token de déploiement Forge incorrect. La suppression a été annulée pour des raisons de sécurité.", "error")
        return redirect(url_for("edit_repo", project_id=project_id))
    
    try:
        # Supprimer le dépôt
        response = httpx.delete(
            f"{FORGE_API_URL}/projects/{project_id}",
            headers={"Authorization": f"Bearer {session['forge_token']}"}
        )
        response.raise_for_status()
        flash("Dépôt supprimé avec succès!", "success")
    except Exception as e:
        flash(f"Erreur lors de la suppression du dépôt: {str(e)}", "error")
    
    return redirect(url_for("repos"))

@app.route("/toggle-visibility/<int:project_id>", methods=["POST"])
def toggle_visibility(project_id):
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    try:
        current_visibility = request.form.get("current_visibility")
        # Inverser la visibilité
        new_visibility = "private" if current_visibility == "public" else "public"
        
        response = httpx.put(
            f"{FORGE_API_URL}/projects/{project_id}",
            headers={"Authorization": f"Bearer {session['forge_token']}"},
            json={"visibility": new_visibility}
        )
        response.raise_for_status()
        flash(f"Visibilité du dépôt modifiée avec succès en '{new_visibility}'!", "success")
    except Exception as e:
        flash(f"Erreur lors de la modification de la visibilité: {str(e)}", "error")
    
    return redirect(url_for("repos"))

@app.route("/help")
def help_page():
    return render_template("help.html")

@app.route("/fork-template", methods=["POST"])
def fork_template():
    if "forge_token" not in session:
        return redirect(url_for("index"))
    
    try:
        # Vérifier si le dépôt existe déjà
        repos_response = httpx.get(
            f"{FORGE_API_URL}/projects?membership=true&search={request.form.get('new_name')}",
            headers={"Authorization": f"Bearer {session['forge_token']}"}
        )
        repos_response.raise_for_status()
        
        if len(repos_response.json()) > 0:
            flash("Un dépôt avec ce nom existe déjà", "error")
            return redirect(url_for("repos"))
            
        # Forker le template
        response = httpx.post(
            f"{FORGE_API_URL}/projects/spy%2Ftemplatehtml/fork",  # URL du template: https://forge.apps.education.fr/spy/templatehtml.git
            headers={"Authorization": f"Bearer {session['forge_token']}"},
            json={
                "name": request.form.get("new_name"),
                "path": request.form.get("new_name"),  # Ajout du path pour éviter les conflits
                "namespace": request.form.get("namespace")
            }
        )
        response.raise_for_status()
        flash("Template forké avec succès!", "success")
    except Exception as e:
        flash(f"Erreur lors du fork: {str(e)}", "error")
    
    return redirect(url_for("repos"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
