# Mode d'emploi complet de Spynorama

## Introduction

Spynorama est une application web permettant de créer et visualiser des scènes panoramiques 360° avec des points d'intérêt interactifs (hotspots). Cette application est idéale pour créer des visites virtuelles, des présentations immersives ou des supports pédagogiques interactifs.

## Table des matières

1. [Démarrage](#démarrage)
2. [Interface utilisateur](#interface-utilisateur)
3. [Gestion des scènes](#gestion-des-scènes)
4. [Navigation dans les vues 360°](#navigation-dans-les-vues-360)
5. [Création et gestion des hotspots](#création-et-gestion-des-hotspots)
6. [Sauvegarde et chargement de projets](#sauvegarde-et-chargement-de-projets)
7. [Exportation de projets](#exportation-de-projets)
8. [Fonctionnalités multimédia](#fonctionnalités-multimédia)
9. [Visualisation directe via URL](#visualisation-directe-via-url)
10. [Internationalisation](#internationalisation)
11. [Conseils et astuces](#conseils-et-astuces)
12. [Résolution de problèmes](#résolution-de-problèmes)

## Démarrage

### Lancement de l'application

1. Ouvrez le fichier `index.html` dans votre navigateur web (Chrome, Firefox, Safari ou Edge recommandés)
2. L'application s'ouvre avec un écran d'accueil vous invitant à ajouter votre première scène

### Création d'un nouveau projet

Pour commencer un nouveau projet, vous avez deux options :

1. **Ajouter une scène depuis votre ordinateur** :
   - Cliquez sur le bouton "Ajouter une scène"
   - Sélectionnez une image panoramique 360° sur votre ordinateur
   - L'image sera chargée et affichée en mode 360°

2. **Ajouter une scène depuis une URL** :
   - Cliquez sur le bouton "Ajouter via URL"
   - Dans la fenêtre qui s'ouvre, entrez l'URL de l'image panoramique
   - Donnez un nom à votre scène
   - Cliquez sur "Ajouter" pour charger l'image

## Interface utilisateur

L'interface de Spynorama est divisée en plusieurs zones :

### Barre latérale (à gauche)

- **Section Scènes** : Liste de toutes vos scènes avec options pour les gérer
- **Section Paramètres de scène** : Options pour modifier la scène sélectionnée
- **Section Hotspots** : Outils pour ajouter et configurer des points d'intérêt
- **Section Projet** : Options pour sauvegarder, charger et exporter votre projet

### Zone principale (au centre)

- **Visualisation 360°** : Affichage interactif de la scène panoramique actuelle
- **Points d'intérêt (hotspots)** : Éléments interactifs placés dans la scène

### Barre d'outils (en bas)

- **Boutons de navigation** : Options pour se déplacer dans la vue 360°
- **Bouton plein écran** : Pour afficher la vue en plein écran
- **Sélecteur de langue** : Pour changer la langue de l'interface

## Gestion des scènes

### Ajouter une nouvelle scène

1. **Depuis votre ordinateur** :
   - Cliquez sur "Ajouter une scène" dans la section Scènes
   - Sélectionnez une image panoramique sur votre ordinateur
   - L'image sera automatiquement ajoutée à votre projet

2. **Depuis une URL** :
   - Cliquez sur "Ajouter via URL" dans la section Scènes
   - Entrez l'URL de l'image panoramique
   - Donnez un nom à votre scène
   - Cliquez sur "Ajouter"

3. **Par glisser-déposer** :
   - Faites simplement glisser une image panoramique depuis votre explorateur de fichiers vers l'application
   - L'image sera automatiquement ajoutée à votre projet

### Gérer les scènes existantes

- **Sélectionner une scène** : Cliquez sur une scène dans la liste pour l'afficher
- **Renommer une scène** : Sélectionnez la scène, puis modifiez son nom dans le champ "Titre de la scène"
- **Supprimer une scène** : Cliquez sur l'icône de corbeille (🗑) à côté de la scène dans la liste
- **Définir la vue initiale** : Positionnez la vue comme vous le souhaitez, puis cliquez sur "Définir vue actuelle"
- **Ouvrir l'URL d'une scène externe** : Pour les scènes ajoutées via URL, cliquez sur l'icône globe (🌐) pour ouvrir l'image dans un nouvel onglet et copier l'URL dans le presse-papier

## Navigation dans les vues 360°

### Contrôles de base

- **Souris** : Cliquez et faites glisser pour regarder autour de vous
- **Clavier** : Utilisez les flèches pour vous déplacer dans la vue
- **Zoom** : Utilisez la molette de la souris pour zoomer/dézoomer
- **Tactile** : Sur les appareils tactiles, faites glisser pour regarder autour de vous et pincez pour zoomer

### Options avancées

- **Mode plein écran** : Cliquez sur l'icône d'expansion (⤢) dans la barre d'outils
- **Réinitialiser la vue** : Double-cliquez n'importe où dans la vue pour revenir à la position initiale

## Création et gestion des hotspots

Les hotspots (points d'intérêt) sont des éléments interactifs que vous pouvez placer dans vos scènes pour ajouter de l'interactivité.

### Types de hotspots disponibles

1. **Hotspot Info** : Affiche une infobulle avec du texte au survol
2. **Hotspot Lien** : Ouvre un lien externe lorsqu'on clique dessus
3. **Hotspot Navigation** : Permet de naviguer vers une autre scène de votre projet
4. **Hotspot Photo** : Affiche une image en plein écran lorsqu'on clique dessus
5. **Hotspot Vidéo** : Lit une vidéo (YouTube, Vimeo, Podeduc ou fichier direct)
6. **Hotspot Audio** : Lit un fichier audio lorsqu'on clique dessus

### Ajouter un hotspot

1. Sélectionnez le type de hotspot que vous souhaitez ajouter dans la section Hotspots
2. Cliquez sur l'endroit de la scène où vous souhaitez placer le hotspot
3. Dans la fenêtre qui s'ouvre, configurez les propriétés du hotspot :
   - **Titre** : Nom du hotspot (visible au survol)
   - **Options spécifiques** selon le type de hotspot :
     - **Info** : Texte à afficher
     - **Lien** : URL à ouvrir
     - **Navigation** : Scène de destination et transition
     - **Photo** : URL ou fichier image
     - **Vidéo** : Source et URL de la vidéo
     - **Audio** : URL ou fichier audio
4. Cliquez sur "Enregistrer" pour créer le hotspot

### Modifier un hotspot existant

1. Cliquez sur le hotspot dans la scène
2. Modifiez ses propriétés dans la fenêtre qui s'ouvre
3. Cliquez sur "Enregistrer" pour appliquer les modifications

### Déplacer un hotspot

1. Maintenez la touche Shift enfoncée
2. Cliquez et faites glisser le hotspot vers sa nouvelle position
3. Relâchez pour confirmer la position

### Supprimer un hotspot

1. Cliquez sur le hotspot dans la scène
2. Cliquez sur "Supprimer" dans la fenêtre qui s'ouvre

## Sauvegarde et chargement de projets

### Sauvegarde automatique

L'application sauvegarde automatiquement votre travail dans le stockage local de votre navigateur. Vous pouvez fermer l'application et y revenir plus tard, votre projet sera toujours là.

### Sauvegarde manuelle (export JSON)

1. Cliquez sur "Enregistrer" dans la section Projet
2. Un fichier JSON contenant votre projet sera téléchargé
3. Conservez ce fichier pour pouvoir restaurer votre projet ultérieurement

### Charger un projet

1. Cliquez sur "Ouvrir" dans la section Projet
2. Sélectionnez le fichier JSON de votre projet
3. Le projet sera chargé, remplaçant le projet actuel

## Exportation de projets

Vous pouvez exporter votre projet sous forme de site web autonome, prêt à être hébergé.

### Exporter en site web

1. Cliquez sur "Exporter site web" dans la section Projet
2. Configurez les options d'exportation :
   - **Afficher la barre de scènes** : Ajoute une barre de navigation entre les scènes
   - **Afficher le titre** : Affiche le titre du projet en haut de la page
   - **Images via URL** : Choisissez comment gérer les images externes
   - **Qualité des images** : Sélectionnez la qualité des images (native, optimisée, réduite)
3. Cliquez sur "Exporter"
4. Un fichier ZIP contenant votre site web sera téléchargé

### Utiliser le site web exporté

1. Décompressez le fichier ZIP sur votre ordinateur
2. Ouvrez le fichier `index.html` dans un navigateur pour tester
3. Pour publier, téléchargez tous les fichiers sur votre serveur web

## Fonctionnalités multimédia

### Intégration de vidéos

Spynorama prend en charge plusieurs sources de vidéos :

1. **YouTube** :
   - Sélectionnez "YouTube" comme type de vidéo
   - Entrez l'URL de la vidéo YouTube ou son ID

2. **Vimeo** :
   - Sélectionnez "Vimeo" comme type de vidéo
   - Entrez l'URL de la vidéo Vimeo ou son ID

3. **Podeduc** :
   - Sélectionnez "Podeduc" comme type de vidéo
   - Vous pouvez soit :
     - Entrer l'URL de la vidéo Podeduc
     - Coller le code iframe complet fourni par Podeduc

4. **Vidéo directe** :
   - Sélectionnez "Directe" comme type de vidéo
   - Entrez l'URL d'un fichier vidéo (MP4, WebM, etc.)

### Intégration d'audio

Pour ajouter du son à votre projet :

1. Créez un hotspot de type Audio
2. Entrez l'URL d'un fichier audio (MP3, WAV, etc.)
3. Configurez les options de lecture (lecture automatique, boucle, etc.)

## Visualisation directe via URL

Spynorama permet de visualiser directement une image panoramique sans créer de projet complet.

### Visualiser une image via URL

1. Ajoutez le paramètre `image` à l'URL de l'application :
   ```
   index.html?image=URL_DE_VOTRE_IMAGE
   ```
   Exemple : `index.html?image=https://exemple.com/image360.jpg`

2. L'image s'ouvrira directement en mode visualisation 360°

### Fonctionnalités en mode visualisation directe

- Navigation 360° complète
- Mode plein écran
- Bouton pour ouvrir l'image dans l'éditeur
- Bouton de partage pour copier l'URL

### Accès rapide depuis la liste des scènes

Pour les scènes ajoutées via URL, un icône globe (🌐) apparaît dans la liste des scènes. En cliquant sur cet icône :
- L'URL de l'image est automatiquement copiée dans le presse-papier
- L'image s'ouvre dans un nouvel onglet en mode visualisation 360°

Cette fonctionnalité est particulièrement utile pour partager rapidement une vue 360° avec d'autres personnes.

## Internationalisation

Spynorama est disponible en plusieurs langues.

### Changer de langue

1. Cliquez sur l'icône de globe (🌐) dans la barre d'outils en bas
2. Sélectionnez la langue souhaitée dans le menu déroulant

### Langues disponibles

- Français
- Anglais
- Italien

La langue est automatiquement détectée en fonction des préférences de votre navigateur, mais vous pouvez la changer à tout moment.

## Conseils et astuces

### Pour des résultats optimaux

- Utilisez des images équirectangulaires 360° (ratio 2:1)
- Résolution recommandée : 4000×2000 pixels ou plus
- Formats supportés : JPG, JPEG et PNG
- Placez les hotspots à des endroits stratégiques et visibles
- Utilisez des titres clairs et descriptifs pour vos scènes et hotspots

### Création d'images panoramiques

Vous pouvez créer des images panoramiques 360° avec :
- Google Street View (application mobile)
- Caméras 360° comme Insta360, Ricoh Theta, etc.
- Photoshop avec la fonction de fusion panoramique
- Applications spécialisées comme PTGui

### Optimisation des performances

- Réduisez la taille des images pour des chargements plus rapides
- Limitez le nombre de hotspots par scène (idéalement moins de 10)
- Préférez les liens YouTube/Vimeo plutôt que des vidéos directes pour économiser de la bande passante

## Résolution de problèmes

### L'image panoramique ne s'affiche pas correctement

- Vérifiez que l'image est bien au format équirectangulaire (ratio 2:1)
- Essayez de réduire la résolution si l'image est très grande
- Assurez-vous que l'URL est accessible si vous utilisez une image externe

### Les hotspots ne fonctionnent pas

- Vérifiez que les URLs sont correctes et accessibles
- Pour les hotspots de navigation, assurez-vous que la scène de destination existe
- Pour les vidéos, vérifiez que la source est correctement configurée

### Problèmes de sauvegarde

- Si la sauvegarde automatique ne fonctionne pas, exportez régulièrement votre projet en JSON
- Les projets très volumineux peuvent dépasser les limites du stockage local du navigateur

### Problèmes d'exportation

- Si l'export échoue, essayez de réduire la qualité des images
- Vérifiez l'espace disponible sur votre disque dur
- Pour les projets volumineux, l'exportation peut prendre du temps

---

Ce mode d'emploi couvre l'ensemble des fonctionnalités de Spynorama. Pour toute question ou problème non résolu, n'hésitez pas à consulter la documentation en ligne ou à contacter l'équipe de développement.
