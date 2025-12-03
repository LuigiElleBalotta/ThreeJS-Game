import { Item } from "../types";

export const ITEM_REGISTRY: Record<string, Item> = {
    rusty_sword: {
        id: "rusty_sword",
        name: "Rusty Sword",
        description: "A dull blade, but better than fists.",
        slot: "weapon",
        stats: { strength: 2 },
        classTags: ["warrior", "rogue"],
    },
    cloth_gloves: {
        id: "cloth_gloves",
        name: "Cloth Gloves",
        description: "Simple cloth gloves.",
        slot: "hands",
        stats: { intellect: 1, stamina: 1 },
        classTags: ["mage"],
    },
    training_shield: {
        id: "training_shield",
        name: "Training Shield",
        description: "A wooden shield for recruits.",
        slot: "offhand",
        stats: { stamina: 3 },
        classTags: ["warrior"],
    },
    rogue_daggers: {
        id: "rogue_daggers",
        name: "Pair of Daggers",
        description: "Quick blades for rogues.",
        slot: "weapon",
        stats: { agility: 3 },
        classTags: ["rogue"],
    },
    apprentice_staff: {
        id: "apprentice_staff",
        name: "Apprentice's Staff",
        description: "Basic focus for a mage.",
        slot: "weapon",
        stats: { intellect: 3 },
        classTags: ["mage"],
    },
  minor_health_potion: {
    id: "minor_health_potion",
    name: "Minor Health Potion",
    description: "Restores a bit of health.",
    use: ({ player }) => {
      player.hp = Math.min(player.maxHp, player.hp + 30);
    },
  },
};

export function getRandomLoot(): Item {
    const items = Object.values(ITEM_REGISTRY);
    return items[Math.floor(Math.random() * items.length)];
}

export function getItemById(id: string) {
    return ITEM_REGISTRY[id];
}
