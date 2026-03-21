# Module Commandes — Contexte et spécifications

## Vue générale
<!-- Décris en 2-3 phrases l'objectif du module →
L’objectif est de centraliser toutes les commandes passées sur nos 2 canaux principaux qui sont le site web et les commandes prises manuellement en boutique. Cette interface est également dédiée à la création et l’enregistrement de nouvelles commandes en boutique.

## Canaux de commandes
<!-- Décris chaque canal -->
- **Boutique** : commandes saisies manuellement en magasin
- **Web (Webflow)** : commandes venant du site internet ecommerce
- **Brunch** : réservations venant du site internet + réservations saisies manuellement en boutique. 

## Fonctionnalités décidées
<!-- Liste tout ce qui a été validé dans l'autre conversation -->
- Récupérer et intégrer en temps réel dans le calendrier les commandes passées sur le site web kubo-patisserie.com
- Récupérer et intégrer en temps réel dans le calendrier les réservations de brunch passées sur le site web kubo-patisserie.com
- Saisir manuellement une nouvelle commande
- Saisir manuellement une nouvelle réservation de brunch 

## Règles métier
<!-- Ex: brunch uniquement le samedi, dates passées en lecture seule... -->
- Brunch : disponible uniquement le samedi
- Dates passées : consultation uniquement, pas de création

## Schéma de données
<!-- Champs validés pour une commande -->
- id, channel, status, customer (name, phone, email)
- items (label, size, qty, unitPrice)
- totalPrice, pickupDate, pickupTime
- paid (boolean)
- <!-- ajoute les champs spécifiques décidés -->

## Statuts d'une commande
- Payé / Non payé 
- Commandes web : statut "Payé" par défaut 
- Brunch web : statut "Payé" par défaut 
- Commandes boutique : statut défini à la création 
- Brunch boutique : statut défini à la création

## Spécificités Brunch 
- Brunch web : commandes Webflow dont le produit contient "brunch" → canal 'brunch', label "Brunch web" 
- Brunch boutique : saisi manuellement → canal 'brunch', label "Brunch boutique" 
- Couleur identique pour les deux : #FFD866 
- Disponible uniquement le samedi dans le calendrier

## Schéma de données — champs supplémentaires 
- brunchSource: 'web' | 'boutique' (pour les brunchs uniquement) 
- createdAt: ISO string 
- updatedAt: ISO string 
- webflowOrderId: string | null (null pour boutique)

## Intégration Webflow
- Proxy via Vercel Serverless Function (déjà utilisé)
- Fichier : api/webflow-orders.js
- Variables Vercel Dashboard :
  WEBFLOW_SITE_ID, WEBFLOW_API_TOKEN
- L'app appelle /api/webflow-orders
  qui proxifie vers api.webflow.com
- Pas de token côté client (sécurisé)

## Déploiement — variables d'environnement requises
Variables à définir dans le Dashboard Vercel (Settings → Environment Variables) :
- WEBFLOW_SITE_ID       : ID du site Webflow (onglet Settings Webflow)
- WEBFLOW_API_TOKEN     : Bearer token API Webflow v2 (scope ecommerce:read)
- ALLOWED_ORIGIN        : domaine de production ex. https://kubo-planning.vercel.app
  → Obligatoire pour restreindre le CORS de l'API Webflow
  → Sans cette variable, un warning est loggué en production

## Intégration Webflow — détails 
- Polling toutes les 2 minutes pour les nouvelles commandes 
- Champ Webflow à mapper vers channel 'brunch' : [Brunch du Samedi] 
- Les commandes déjà importées ne sont pas dupliquées (déduplication par webflowOrderId) 

## Design & UI
<!-- Décisions visuelles validées -->
- Bleu pastel #7AC5FF → commandes web
- Vert pastel #66DA9B → commandes boutique
- Orange pastel #FFD866 → brunch
- Vue principale : calendrier mensuel
- <!-- autres décisions -->

## Formulaires
<!-- Ce qui a été validé -->
### Nouvelle commande boutique
- Champs : nom*, téléphone, produits (nom/taille/qté), 
  prix total, jour retrait, heure retrait, payé
  
### Nouveau brunch
- Champs : nom*, téléphone, nb personnes, 
  heure (10h30 / 12h00 / 13h30), payé

## Fonctionnalités à venir
<!-- Ce qui a été évoqué mais pas encore fait -->
- Parmi les commandes venant du site web, il faut dissocier les commandes dont le nom exact est “Brunch du Samedi” et leur assigner les mêmes spécificités visuelles que les brunch réservés en boutique. On affichera “brunch web” en label ou “brunch boutique” en fonction du canal d’origine.


