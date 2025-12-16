export type QuestObjective =
  | { type: "kill"; targetId: string; count: number }
  | { type: "escort"; targetSpawnId: string };

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: { xp?: number; gold?: number; items?: string[] };
}

// Minimal quest set inspired by TrinityCore-style quest_template rows.
export const QUESTS: Record<string, QuestDefinition> = {
  BANDIT_MENACE: {
    id: "BANDIT_MENACE",
    title: "Bandit Menace",
    description: "The villagers whisper about pirate bandits roaming the plains. Thin their ranks.",
    objectives: [{ type: "kill", targetId: "pirate_bandit", count: 5 }],
    rewards: { xp: 120, gold: 35, items: ["minor_health_potion"] },
  },
  BONES_BE_GONE: {
    id: "BONES_BE_GONE",
    title: "Bones Be Gone",
    description: "The fallen raiders refuse to rest. Smash their bones so they stay down.",
    objectives: [{ type: "kill", targetId: "skeleton_raider", count: 3 }],
    rewards: { xp: 150, gold: 45 },
  },
  ROTTING_THREAT: {
    id: "ROTTING_THREAT",
    title: "Rotting Threat",
    description: "Culling zombies keeps the outpost safe. Do your part.",
    objectives: [{ type: "kill", targetId: "zombie", count: 3 }],
    rewards: { xp: 180, gold: 55, items: ["minor_health_potion"] },
  },
  ESCORT_TRADER: {
    id: "ESCORT_TRADER",
    title: "Safe Passage",
    description: "Escort the caravan trader to the eastern ridge.",
    objectives: [{ type: "escort", targetSpawnId: "escort-trader-1" }],
    rewards: { xp: 220, gold: 90, items: ["hunter_trinket"] },
  },
};

export interface QuestProgressState {
  questId: string;
  progress: number[]; // mirrors objectives index
  status: "active" | "completed" | "rewarded" | "failed";
}
