import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().trim().email("Neplatný formát emailu").max(255, "Email je príliš dlhý"),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov").max(128, "Heslo je príliš dlhé"),
  fullName: z.string().trim().min(1, "Meno je povinné").max(100, "Meno je príliš dlhé"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Neplatný formát emailu").max(255),
  password: z.string().min(1, "Heslo je povinné").max(128),
});

export const recipeSchema = z.object({
  name: z.string().trim().min(1, "Názov je povinný").max(200, "Názov je príliš dlhý"),
  description: z.string().max(2000, "Popis je príliš dlhý").optional().default(""),
  instructions: z.string().max(10000, "Inštrukcie sú príliš dlhé").optional().default(""),
  calories: z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 99999),
    "Kalórie musia byť číslo medzi 0 a 99999"
  ),
  notes: z.string().max(2000, "Poznámky sú príliš dlhé").optional().default(""),
  category: z.string().min(1),
  is_public: z.boolean(),
});

export const ingredientSchema = z.object({
  name: z.string().max(200, "Názov ingrediencie je príliš dlhý"),
  quantity: z.number().min(0).max(99999),
  unit: z.string().max(50, "Jednotka je príliš dlhá"),
});

export const mealPlanSchema = z.object({
  name: z.string().trim().min(1, "Názov je povinný").max(200, "Názov je príliš dlhý"),
  plan_type: z.string().min(1),
  start_date: z.string().min(1, "Dátum je povinný"),
});

export const shoppingItemSchema = z.object({
  item_name: z.string().trim().min(1, "Názov položky je povinný").max(300, "Názov je príliš dlhý"),
});
