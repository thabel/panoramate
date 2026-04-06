* Afficher ou pas le menu du viewer
* Permettre de rajouter un hostpost 
    * le mettre dans n'importe quel zone dans le viewer
* Partage de lien et partage de l'iframe



### Nice to have
* Commentaires sur les virtuel


## Optique View

Sur le hoststop info on peut mettre 
    du texte 
    une image
    une video 
    ou lien externe (iframe qui t'ouvre une page) .p

* Menu de navigation
    ( possibilité de l'afficher ou pas au niveau du parametre)
    parametrrage
    * Rajouter une possibilité de recherche sur les titres 
    des images 360.

* Objectif: Rendre le hoover to 
hotspot disponible.

* 2eme objectif : Rendre le tour public comme sur marzipano tester:

## Fonctionalités
    * Rajouter une option afficher ou pas le title sur le hoststpot
    Quand on hover le hoststop , il faut montrer le titre 
    * Rajouter une musique dans le background et un btn on off [Vue publique]
    *  Rajouter des assest multimédia dans le viewer.
    * Rajouter à la vue publique les directioin et fleches.

## A discuter
    [Fonctionnalité]: Plan 2D interractive
    Quand , on va 
    *

### Viewer comparatif 
comparitif à patir d'un plan

Uploader un plan
[Pas par defaut que pour les traveaux.]

On a un plan 360  d'une chambre on , voit la date 
capturer et comparer cette mm vue à une autre 
date , cette fonctionnalité

Avant et Apres

Comparer un espace , avec une autre espace , 
j'ai une chambre que je veux refaire la peinture 
meuble , comparer , avant apres.
comparaison le jour et la nuit.


### RICO360...



### Offlinked Academy

* voir les formations & et voir les speakers
* une formations en ligne & presentiel & hybirde
* La formation en ligne .
*

---

## 📋 Rapport d'Investigation - Hotspot Panel Issue (02/04/2026)

### Contexte du Problème
Lors de l'ajout d'un hotspot temporaire dans l'éditeur de tour, un problème visuel a été identifié : **quand le panel de configuration s'ouvre à droite, le hotspot se déplace visuellement** même si ses coordonnées n'ont pas changé.

### Analyse Effectuée
- 🔍 Investigation complète du code du viewer Marzipano (la technologie 360°)
- 📍 Identification de la cause : quand le panel s'ouvre, il réduit la largeur du viewer, mais Marzipano n'était pas notifié de ce changement
- 🔧 Tentative de correction via ResizeObserver (composant React qui détecte les changements de taille)

### Résultat
- ❌ La première approche s'est avérée invalide (méthodes API qui n'existent pas dans Marzipano)
- ✅ Code revenu à l'état stable sans casser la fonctionnalité existante
- 📚 Documentation Marzipano insuffisante pour une solution rapide

### Recommandations
1. **Court terme** : Tester manuellement si ce décalage est vraiment perceptible par les utilisateurs
2. **Moyen terme** : Consulter la documentation officielle Marzipano ou la communauté Google pour la bonne approche
3. **Alternative** : Mettre le panel à un endroit qui ne réduit pas le viewer (ex: overlay floatant)

### Impact Utilisateur
- ✅ L'application fonctionne correctement
- ⚠️ Problème cosmétique possible à améliorer

---