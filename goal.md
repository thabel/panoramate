# Roadmap Viewer

## Priorités immédiates [semaine du 23 mars 2026. ]
- Afficher ou masquer le menu du viewer.
- Permettre d’ajouter un hotspot dans n’importe quelle zone du viewer.
- Partager un lien public et partager l’iframe.

## Hotspots
- Le contenu d’un hotspot info peut inclure du texte, une image, une vidéo ou un lien externe.
- Ajouter une option pour afficher ou masquer le titre du hotspot.
- Quand on survole un hotspot, afficher son titre.
- Rendre le hover sur hotspot plus fluide et plus visible.

## Vue publique
- Permettre d’activer ou de désactiver le menu de navigation via un paramètre.
- Ajouter une recherche sur les titres des images 360.
- Ajouter une musique de fond avec un bouton on/off.
- Ajouter des assets multimédia dans le viewer.
- Ajouter les directions et les flèches dans la vue publique.
- Rendre le tour public plus proche du comportement de Marzipano.

## Nice to have
- Commentaires sur les virtuels.

## À discuter
- Plan 2D interactif.
- Viewer comparatif à partir d’un plan.
- Uploader un plan, pas seulement pour les travaux.
- Comparer une vue 360 à une autre date pour faire du avant/après.
- Cas d’usage type comparaison d’un espace avant/après rénovation.
- Version Freeweer / version payante légère une fois les fonctionnalités clés en place.

## Offlinked Academy
- Voir les formations et les speakers.
- Proposer des formations en ligne, en présentiel et en hybride.
- Structurer la partie formation en ligne.

## Personnalisation
- Permettre d’utiliser son propre icône.

## Follow-up
- Valider le périmètre exact du menu du viewer: masquable, persistant, contextuel.
- Prioriser les hotspots: création, positionnement libre, titre au survol, types de contenu.
- Décider du modèle de partage: lien simple, iframe, options d’intégration.
- Choisir la prochaine grosse brique produit: 2D interactive, comparatif avant/après, ou Academy.
- Revoir la meilleure approche UX pour le panel de configuration sans déplacer visuellement le viewer.

## Rapport d’investigation - Hotspot Panel Issue (02/04/2026)

### Contexte du problème
Lors de l’ajout d’un hotspot temporaire dans l’éditeur de tour, un problème visuel a été identifié: quand le panel de configuration s’ouvre à droite, le hotspot se déplace visuellement même si ses coordonnées n’ont pas changé.

### Analyse effectuée
- Investigation complète du code du viewer Marzipano.
- Identification de la cause: l’ouverture du panel réduit la largeur du viewer, mais Marzipano n’était pas notifié de ce changement.
- Tentative de correction via ResizeObserver.

### Résultat
- La première approche s’est avérée invalide, car certaines méthodes API n’existent pas dans Marzipano.
- Le code est revenu à un état stable sans casser la fonctionnalité existante.
- La documentation Marzipano ne permet pas encore une correction rapide.

### Recommandations
1. Court terme: tester manuellement si ce décalage est réellement perceptible pour les utilisateurs.
2. Moyen terme: consulter la documentation officielle Marzipano ou la communauté pour la bonne approche.
3. Alternative: placer le panel ailleurs, par exemple en overlay flottant, pour ne pas réduire le viewer.

### Impact utilisateur
- L’application fonctionne correctement.
- Le problème reste cosmétique mais mérite une amélioration.

### [TODO] 
* La tache concerne le comparaison , de deux viewer.
* Modifier la configuration d'un hotspot.
* Reproposer une autre interface pour mettre en avnat la partie 2D interactive

Question
L'histoire du partage de vue 360 comment l'integrer ou l'integer.

ma proposition 
