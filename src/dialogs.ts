export interface NpcText {
  id: string;
  text: string;
}

export interface GossipOption {
  id: string;
  text: string;
  action?: () => void;
}

export interface GossipMenu {
  id: string;
  npcTextId: string;
  title: string;
  options: GossipOption[];
}

export const npcTexts: Record<string, NpcText> = {
  villager_text: {
    id: "villager_text",
    text: "The harvest is late this year, but hope still shines. Need a bite or a story?",
  },
  wizard_text: {
    id: "wizard_text",
    text: "Knowledge is the greatest weapon. Mind the wild magic on the outskirts.",
  },
};

export const gossipMenus: Record<string, GossipMenu> = {
  villager_gossip: {
    id: "villager_gossip",
    npcTextId: "villager_text",
    title: "Anne the Villager",
    options: [
      { id: "greet", text: "Just looking around, thanks." },
      { id: "bye", text: "Goodbye." },
    ],
  },
  wizard_gossip: {
    id: "wizard_gossip",
    npcTextId: "wizard_text",
    title: "Arcane Scholar",
    options: [
      { id: "warn", text: "Any news from the arcane fronts?" },
      { id: "bye", text: "Goodbye." },
    ],
  },
};
