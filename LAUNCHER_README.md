# Lanceur Unifié pour L'Établi

Ce document explique comment utiliser le lanceur unifié (`launcher.py`) pour démarrer les services API et UI de L'Établi.

## Présentation

Le lanceur unifié permet de démarrer à la fois le service API (FastAPI) et le service UI (Flask) à partir d'un seul point d'entrée. Cela simplifie le processus de développement et de déploiement en évitant d'avoir à lancer manuellement chaque service séparément.

## Prérequis

- Python 3.9 ou supérieur
- Les dépendances listées dans `requirements.txt`

## Utilisation

### Lancer les deux services (API et UI)

```bash
python launcher.py
```

Cette commande démarre à la fois l'API FastAPI sur le port 8000 et l'interface utilisateur Flask sur le port 5000.

### Lancer uniquement l'API

```bash
python launcher.py --api-only
```

### Lancer uniquement l'UI

```bash
python launcher.py --ui-only
```

### Options de configuration

Le lanceur prend en charge plusieurs options de ligne de commande pour personnaliser son comportement :

- `--api-only` : Démarre uniquement le service API
- `--ui-only` : Démarre uniquement le service UI
- `--api-host HOST` : Spécifie l'hôte pour l'API (par défaut : 0.0.0.0)
- `--api-port PORT` : Spécifie le port pour l'API (par défaut : 8000)
- `--ui-host HOST` : Spécifie l'hôte pour l'UI (par défaut : 0.0.0.0)
- `--ui-port PORT` : Spécifie le port pour l'UI (par défaut : 5000)
- `--no-debug` : Désactive le mode debug de Flask

Exemple :
```bash
python launcher.py --api-port 8080 --ui-port 5050 --no-debug
```

## Utilisation avec Docker

Un fichier `docker-compose.unified.yml` est fourni pour exécuter l'application avec Docker en utilisant le lanceur unifié.

### Démarrer avec Docker Compose

```bash
docker-compose -f docker-compose.unified.yml up unified
```

Cette commande construit et démarre le conteneur unifié qui exécute à la fois l'API et l'UI.

### Arrêter les services

Pour arrêter les services, appuyez sur `Ctrl+C` dans le terminal où le lanceur est en cours d'exécution, ou utilisez la commande suivante avec Docker Compose :

```bash
docker-compose -f docker-compose.unified.yml down
```

## Fonctionnalités

- Démarrage et arrêt coordonnés des services API et UI
- Gestion des signaux pour un arrêt propre (Ctrl+C)
- Affichage des logs des deux services dans un seul terminal
- Surveillance de l'état des processus et redémarrage automatique en cas d'échec
- Configuration via des variables d'environnement ou des arguments de ligne de commande
