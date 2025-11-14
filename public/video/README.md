# Vidéo Hero Section

## 📹 Comment ajouter votre vidéo de fond

**IMPORTANT** : Pour que la vidéo s'affiche, elle doit être placée dans le dossier `public/video/`

### Étapes à suivre :

1. **Vérifiez que la vidéo existe** dans `esset/video/hero-background.mp4`
2. **Copiez la vidéo** dans le dossier `public/video/` :
   - Créez le dossier `public/video/` s'il n'existe pas
   - Copiez le fichier `hero-background.mp4` de `esset/video/` vers `public/video/`

### Structure attendue :
```
public/
  └── video/
      └── hero-background.mp4  ← La vidéo doit être ici
```

### Vérification :

Ouvrez la console du navigateur (F12) et regardez les messages :
- ✅ "Vidéo chargée avec succès: /video/hero-background.mp4" = La vidéo fonctionne
- ❌ "Erreur lors du chargement de la vidéo: /video/hero-background.mp4" = La vidéo n'est pas trouvée

### Si la vidéo n'est pas disponible :

Le fallback (gradient de couleurs) s'affichera automatiquement en attendant que vous ajoutiez la vidéo.

## 📋 Spécifications recommandées

- **Format**: MP4 (H.264)
- **Résolution**: 1920x1080 (Full HD) minimum
- **Durée**: 10-30 secondes (pour une boucle fluide)
- **Taille**: < 10 MB (optimisez avec HandBrake ou FFmpeg)
- **FPS**: 30 fps
- **Bitrate**: 2-5 Mbps

## 🔧 Optimiser votre vidéo avec FFmpeg

```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -vf scale=1920:1080 -b:v 3000k -preset slow -crf 22 hero-background.mp4
```

## 📝 Personnalisation

Pour modifier le chemin de la vidéo, éditez le fichier `components/HeroSection.tsx` :

```tsx
<HeroSection 
  videoSrc="/video/votre-video.mp4"
  title="Chaque repas compte — luttons ensemble contre le gaspillage."
/>
```
