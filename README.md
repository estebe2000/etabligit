# Lanceur Unifié pour L'Établi

Ce lanceur permet de démarrer les services API (FastAPI) et UI (Flask) de L'Établi à partir d'un seul point d'entrée.

## Installation

Assurez-vous d'avoir installé toutes les dépendances requises :

```bash
pip install -r requirements.txt
```

## Utilisation

### Lancer les deux services (API et UI)

```bash
python launcher.py
```

Cette commande démarre l'API sur le port 8000 et l'UI sur le port 5000.

### Lancer uniquement l'API

```bash
python launcher.py --api-only
```

### Lancer uniquement l'UI

```bash
python launcher.py --ui-only
```

### Options de configuration

```bash
python launcher.py --help
```

Affiche toutes les options disponibles :
- `--api-only` : Démarre uniquement le service API
- `--ui-only` : Démarre uniquement le service UI
- `--api-host` : Spécifie l'hôte pour l'API
- `--api-port` : Spécifie le port pour l'API
- `--ui-host` : Spécifie l'hôte pour l'UI
- `--ui-port` : Spécifie le port pour l'UI
- `--no-debug` : Désactive le mode debug de Flask

## Version Production

Pour lancer en mode production sur les ports 8099 (API) et 5099 (UI) :

```bash
python launcher_prod.py
```

## Docker

### Développement

```bash
docker-compose -f docker-compose.unified.yml up unified
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up etabli
