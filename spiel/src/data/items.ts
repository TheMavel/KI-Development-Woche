export type ItemId = 'ball' | 'superball' | 'kaffee';

export interface ItemDef {
  name: string;
  desc: string;
  price: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  ball: { name: 'Prompt-Ball', desc: 'Fängt wilde KI-Tools. Je weniger Skepsis, desto besser die Chance.', price: 20 },
  superball: { name: 'Super-Prompt-Ball', desc: 'Deutlich bessere Fangchance, auch bei skeptischen Tools.', price: 60 },
  kaffee: { name: 'Kaffee', desc: 'Lädt 3 Akku-Punkte auf. Funktioniert auch mitten im Kampf.', price: 30 },
};

export const ITEM_ORDER: ItemId[] = ['ball', 'superball', 'kaffee'];
