# Spynorama

Une application web permettant de créer et visualiser des scènes panoramiques 360° avec hotspots interactifs, inspirée de l'outil [Marzipano](https://www.marzipano.net/tool/).

## Fonctionnalités

- **Import d'images panoramiques** via bouton, drag & drop ou URL externe
- **Affichage interactif 360°** avec Marzipano.js
- **Création et gestion de scènes** multiples
- **Ajout de hotspots interactifs** :
  - **Info** : Affiche des informations au survol
  - **Lien** : Ouvre un lien externe
  - **Navigation** : Permet de naviguer entre les scènes
  - **Photo** : Affiche une image en plein écran
  - **Vidéo** : Intègre des vidéos YouTube, Vimeo, Podeduc (via URL ou code iframe) ou directes
- **Sauvegarde du projet** :
  - Export JSON pour partager ou sauvegarder
  - Import JSON pour reprendre un projet
  - Sauvegarde automatique en localStorage
- **Internationalisation** :
  - Support multilingue (français, anglais, italien)
  - Détection automatique de la langue du navigateur
  - Possibilité de changer de langue à la volée via le bouton de globe dans la barre d'outils
  - Interface adaptative qui maintient sa cohérence visuelle quelle que soit la langue
- **Interface utilisateur intuitive** et responsive

## Comment utiliser l'application

1. **Ouvrir l'application** : Ouvrez le fichier `index.html` dans votre navigateur
2. **Ajouter une scène** : 
   - Cliquez sur "Ajouter une scène" et sélectionnez une image panoramique locale
   - Ou cliquez sur "Ajouter via URL" et entrez l'URL d'une image panoramique en ligne
3. **Naviguer dans la scène** : Utilisez la souris pour vous déplacer dans la vue 360°
4. **Ajouter des hotspots** :
   - Cliquez sur un des boutons de type de hotspot (Info, Lien, Navigation)
   - Cliquez sur la scène à l'endroit où vous souhaitez placer le hotspot
   - Configurez les propriétés du hotspot dans la fenêtre qui s'ouvre
5. **Gérer les scènes** :
   - Cliquez sur une scène dans la liste pour la sélectionner
   - Modifiez son titre dans les paramètres
   - Définissez la vue initiale en vous positionnant à l'angle souhaité et en cliquant sur "Définir vue actuelle"
6. **Sauvegarder votre projet** :
   - Cliquez sur "Enregistrer" pour télécharger le fichier de projet JSON
   - Utilisez "Ouvrir" pour charger un projet précédemment exporté
   - L'application sauvegarde automatiquement votre travail dans le navigateur

7. **Exporter votre projet en site web** :
   - Cliquez sur "Exporter site web" pour générer un site web autonome
   - Configurez les options d'export :
     - "Afficher la barre de scènes" : Affiche une barre de navigation entre les scènes
     - "Afficher le titre" : Affiche le titre du site en haut de la page
     - "Images via URL" : Seule l'option "Conserver les URLs externes" est disponible
     - "Qualité des images" : Choisissez entre qualité native, optimisée ou réduite

## Intégration de vidéos Podeduc

L'application permet d'intégrer des vidéos depuis la plateforme Podeduc de deux façons :

1. **Via URL** : En entrant l'URL de la vidéo Podeduc, l'application extrait automatiquement l'ID de la vidéo et crée l'iframe approprié.

2. **Via code iframe** : Pour une intégration plus fiable, vous pouvez directement coller le code iframe fourni par Podeduc :
   - Sélectionnez "Podeduc" comme type de vidéo lors de la création d'un hotspot vidéo
   - Un champ spécifique apparaît pour coller le code iframe complet
   - Ce code est utilisé tel quel pour afficher la vidéo, garantissant une compatibilité parfaite

### Comment obtenir le code iframe depuis Podeduc
1. Accédez à la vidéo sur Podeduc
2. Cliquez sur le bouton "Partager"
3. Sélectionnez l'option "Intégrer"
4. Copiez le code iframe complet (commence par `<iframe src="https://podeduc.apps.education.fr/video/...`)
5. Collez ce code dans le champ dédié lors de la création du hotspot

Une page de démonstration `test-podeduc.html` est disponible pour tester cette fonctionnalité.

## Visualisation directe d'images via URL

L'application permet de visualiser directement une image panoramique 360° sans avoir à créer un projet complet, en utilisant un paramètre URL.

### Comment ça marche

1. **Ajouter le paramètre `image` à l'URL** : 
   ```
   index.html?image=URL_DE_VOTRE_IMAGE
   ```
   Exemple : `index.html?image=https://exemple.com/image360.jpg` ou `index.html?image=medias/Bat_d.jpg`

2. **Fonctionnalités disponibles en mode visualisation directe** :
   - Navigation 360° complète
   - Mode plein écran
   - Bouton pour ouvrir l'image dans l'éditeur
   - Bouton de partage pour copier l'URL

3. **Accès rapide depuis la liste des scènes** :
   - Les scènes ajoutées via URL affichent un icône globe (🌐) dans la liste des scènes
   - En cliquant sur cet icône :
     - L'URL de l'image est automatiquement copiée dans le presse-papier
     - L'image s'ouvre dans un nouvel onglet en mode visualisation 360°
   - Cette fonctionnalité facilite le partage des scènes 360° qui proviennent d'URLs externes

4. **Page de test** :
   Une page de démonstration `test-url-image.html` est disponible pour tester cette fonctionnalité avec vos propres images ou les exemples fournis.

Cette fonctionnalité est particulièrement utile pour :
- Partager rapidement une vue 360° sans créer de projet
- Intégrer des liens vers des vues 360° dans d'autres sites ou documents
- Tester des images panoramiques avant de les intégrer dans un projet complet

## Conseils pour les images panoramiques

- Utilisez des images équirectangulaires 360° pour de meilleurs résultats
- Les formats supportés sont JPG, JPEG et PNG
- La résolution recommandée est de 4000×2000 pixels ou plus
- Pour créer des images panoramiques, vous pouvez utiliser des applications comme :
  - Google Street View (application mobile)
  - Insta360 et autres caméras 360°
  - Photoshop avec la fonction de fusion panoramique

## Structure du projet

- `index.html` : Structure HTML de l'application
- `style.css` : Styles CSS pour l'interface utilisateur
- `js/` : Dossier contenant les modules JavaScript
  - `core/` : Modules de base (viewer, storage, export)
  - `ui/` : Modules d'interface utilisateur (hotspots, scenes, modals)
  - `utils/` : Modules utilitaires (image, video)
  - `app.js` : Point d'entrée principal de l'application
  - `README.md` : Documentation de l'architecture modulaire
- `sample-project.json` : Exemple de fichier de projet

## Exemple de fichier JSON

Le fichier JSON généré par l'application contient toutes les informations nécessaires pour recréer votre projet :

```json
{
  "version": "1.0",
  "scenes": [
    {
      "id": "scene_1713264000000",
      "name": "Entrée Cantine",
      "imageUrl": "data:image/jpeg;base64,...",
      "isExternalUrl": false,
      "initialViewParameters": {
        "yaw": 0.12,
        "pitch": 0.05,
        "fov": 1.5
      },
      "hotspots": [
        {
          "id": "hotspot_1713264010000",
          "type": "info",
          "position": {
            "yaw": 0.25,
            "pitch": 0.1
          },
          "title": "Informations",
          "content": "Entrée principale de la cantine."
        }
      ]
    }
  ],
  "currentSceneIndex": 0
}
```

## Technologies utilisées

- HTML5, CSS3, JavaScript (Vanilla)
- [Marzipano.js](https://www.marzipano.net/) pour la visualisation 360°
- [Font Awesome](https://fontawesome.com/) pour les icônes
- [JSZip](https://stuk.github.io/jszip/) pour l'export du site web

## Compatibilité

L'application fonctionne sur tous les navigateurs modernes :
- Chrome
- Firefox
- Safari
- Edge

## Créateurs et Contributeurs

### Fondateur
- Steeve Pytel [Ac Normandie]

### Le père du nom de l'application
- Johann Mourlon [Ac-Grenoble]

### Beta testeurs et apporteurs d'idées
- Matthieu Devillers [Ac-Rennes]
- Herve Allesant [Ac-Aix-Marseille]
- Arnaud Champollion [Ac-Aix-Marseille]
- Benjamin Lagarrigue [Ac-Toulouse]
- Johann Mourlon [Ac-Grenoble]
- Julien Bonhomme [Ac-Nancy-Metz]
- Cyril Iaconelli [Ac-Rennes]
- Marius-Antoine Monnier [Ac-Grenoble]
