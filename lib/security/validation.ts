/**
 * Validation des inputs avec Zod
 * 
 * Fournit des schémas de validation réutilisables et un middleware
 * pour valider automatiquement les requêtes API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reportThreatFindings, scanObjectForThreats } from './threat-detection';

// ==================== SCHÉMAS DE VALIDATION ====================

/**
 * Schéma pour email
 */
export const emailSchema = z
  .string()
  .email('Email invalide')
  .min(5, 'Email trop court')
  .max(255, 'Email trop long')
  .toLowerCase()
  .trim();

/**
 * Schéma pour mot de passe
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe est trop long')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial');

/**
 * Schéma pour nom de commerce
 */
export const businessNameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(100, 'Le nom est trop long')
  .trim()
  .regex(/^[a-zA-Z0-9\s\-'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]+$/,
    'Le nom contient des caractères invalides');

/**
 * Schéma pour SIRET
 */
export const siretSchema = z
  .string()
  .regex(/^[0-9]{14}$/, 'SIRET invalide (14 chiffres requis)')
  .trim();

/**
 * Schéma pour IBAN
 */
export const ibanSchema = z
  .string()
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/, 'IBAN invalide')
  .trim()
  .toUpperCase();

/**
 * Schéma pour URL
 */
export const urlSchema = z
  .string()
  .url('URL invalide')
  .max(2048, 'URL trop longue')
  .trim();

/**
 * Schéma pour ID (Firestore document ID)
 */
export const idSchema = z
  .string()
  .min(1, 'ID requis')
  .max(128, 'ID trop long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'ID invalide (caractères autorisés: a-z, A-Z, 0-9, _, -)');

/**
 * Schéma pour prix
 */
export const priceSchema = z
  .number()
  .positive('Le prix doit être positif')
  .max(999999.99, 'Prix trop élevé')
  .multipleOf(0.01, 'Le prix doit avoir au plus 2 décimales');

/**
 * Schéma pour quantité
 */
export const quantitySchema = z
  .number()
  .int('La quantité doit être un entier')
  .positive('La quantité doit être positive')
  .max(9999, 'Quantité trop élevée');

/**
 * Schéma pour description
 */
export const descriptionSchema = z
  .string()
  .max(5000, 'Description trop longue')
  .trim()
  .optional();

/**
 * Schéma pour téléphone
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+33|0)[1-9]([0-9]{8})$/, 'Numéro de téléphone invalide')
  .trim();

// ==================== SCHÉMAS COMPOSÉS ====================

/**
 * Schéma pour l'inscription d'un merchant
 */
export const merchantRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  businessName: businessNameSchema,
  siret: siretSchema.optional(),
  phone: phoneSchema.optional(),
  description: descriptionSchema,
  address: z.object({
    street: z.string().min(5).max(200).trim(),
    city: z.string().min(2).max(100).trim(),
    postalCode: z.string().regex(/^[0-9]{5}$/, 'Code postal invalide'),
    country: z.string().default('France'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).optional(),
});

/**
 * Schéma pour la mise à jour d'un merchant
 */
export const merchantUpdateSchema = z.object({
  businessName: businessNameSchema.optional(),
  description: descriptionSchema,
  phone: phoneSchema.optional(),
  website: urlSchema.optional(),
  address: z.object({
    street: z.string().min(5).max(200).trim(),
    city: z.string().min(2).max(100).trim(),
    postalCode: z.string().regex(/^[0-9]{5}$/, 'Code postal invalide'),
    country: z.string().default('France'),
  }).optional(),
  iban: ibanSchema.optional(),
}).partial();

/**
 * Schéma pour la création d'un produit
 */
export const productCreateSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100).trim(),
  description: descriptionSchema,
  price: priceSchema,
  stock: quantitySchema,
  category: z.string().min(1).max(50).trim(),
  images: z.array(urlSchema).max(10, 'Maximum 10 images'),
  ecoScore: z.number().min(0).max(100).optional(),
});

/**
 * Schéma pour la mise à jour d'un produit
 */
export const productUpdateSchema = productCreateSchema.partial();

/**
 * Schéma pour la mise à jour du statut d'une commande
 */
export const orderStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
  notes: z.string().max(500).trim().optional(),
});

// ==================== MIDDLEWARE DE VALIDATION ====================

/**
 * Options pour le middleware de validation
 */
interface ValidationOptions {
  schema: z.ZodSchema;
  source?: 'body' | 'query' | 'params'; // Où chercher les données
}

/**
 * Middleware pour valider les requêtes avec Zod
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   return withValidation(request, {
 *     schema: merchantRegisterSchema,
 *     source: 'body',
 *   }, async (validatedData) => {
 *     // validatedData est typé et validé
 *     return NextResponse.json({ success: true });
 *   });
 * }
 * ```
 */
export async function withValidation<T extends z.ZodTypeAny>(
  request: NextRequest,
  options: ValidationOptions & { schema: T },
  handler: (data: z.infer<T>) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  try {
    let rawData: unknown;

    // Récupérer les données selon la source
    switch (options.source || 'body') {
      case 'body':
        try {
          rawData = await request.json();
        } catch {
          return NextResponse.json(
            { success: false, error: 'Invalid JSON body' },
            { status: 400 }
          );
        }
        break;

      case 'query':
        rawData = Object.fromEntries(
          [...request.nextUrl.searchParams.entries()].map(([key, val]) => {
            const n = Number(val);
            return [key, isNaN(n) ? val : n];
          })
        );
        break;

      case 'params':
        // Pour les params, on doit les passer manuellement
        // car ils ne sont pas dans request
        return NextResponse.json(
          { success: false, error: 'Params validation must be done manually' },
          { status: 500 }
        );
    }

    // Protection payload trop volumineux (200KB max)
    const payloadSize = JSON.stringify(rawData).length;
    if (payloadSize > 200_000) {
      return NextResponse.json(
        { success: false, error: 'Payload too large' },
        { status: 413 }
      );
    }

    // Scan menaces AVANT Zod (données brutes)
    const threatsRaw = scanObjectForThreats(rawData);
    if (threatsRaw.length > 0) {
      await reportThreatFindings(request, threatsRaw);
      return NextResponse.json(
        {
          success: false,
          error: 'Malicious input detected',
          details: threatsRaw.map(t => ({ path: t.path, type: t.type })),
        },
        { status: 400 },
      );
    }

    // Valider avec Zod
    const validatedData = options.schema.parse(rawData);

    // Scan menaces APRÈS Zod (données transformées)
    const threatsSanitized = scanObjectForThreats(validatedData);
    if (threatsSanitized.length > 0) {
      await reportThreatFindings(request, threatsSanitized);
      return NextResponse.json(
        {
          success: false,
          error: 'Malicious input detected',
          details: threatsSanitized.map(t => ({ path: t.path, type: t.type })),
        },
        { status: 400 },
      );
    }

    // Exécuter le handler avec les données validées
    return await handler(validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Erreur de validation Zod
      const errors = error.issues.map((err: z.ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Autre erreur
    return NextResponse.json(
      { success: false, error: 'Internal validation error' },
      { status: 500 }
    );
  }
}

/**
 * Valide uniquement les données (sans middleware)
 * Utile pour valider des données avant de les utiliser
 */
export function validateData<T>(schema: z.ZodSchema, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: z.ZodIssue[];
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    throw error;
  }
}

