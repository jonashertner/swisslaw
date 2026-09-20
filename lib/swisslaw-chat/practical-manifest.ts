// Public complete-provision snapshots checked 2026-09-20. Hashes bind content, not legal completeness.
import type { PracticalTopic } from './practical';
export type PracticalReference = { sr: string; article: string; label: string; url: string; sha256: string };
export const PRACTICAL_REFERENCES: Record<PracticalTopic, PracticalReference[]> = {
  "overtime": [
    {
      "sr": "220",
      "article": "321c",
      "label": "OR · Art. 321c",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_321c",
      "sha256": "628fdca5f8fa6a91e6fcf93a688518d2f11f256fc1d0612c3952c7b91a190c3b"
    },
    {
      "sr": "822.11",
      "article": "9",
      "label": "ArG · Art. 9",
      "url": "https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de#art_9",
      "sha256": "366625a0f69ee3efe81aead1ca9daab61d2ad239eecae5b0a0082de4233c0944"
    },
    {
      "sr": "822.11",
      "article": "12",
      "label": "ArG · Art. 12",
      "url": "https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de#art_12",
      "sha256": "ffe1c73cd6572f98d4a66ec9f170811d45f40f7a58858e5a02ebcdffd894ee38"
    },
    {
      "sr": "822.11",
      "article": "13",
      "label": "ArG · Art. 13",
      "url": "https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de#art_13",
      "sha256": "80b170942bea68723288ceb10948939bb785bf98db422c9e8bbeb7bb3b2764be"
    }
  ],
  "marriage": [
    {
      "sr": "210",
      "article": "97",
      "label": "ZGB · Art. 97",
      "url": "https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_97",
      "sha256": "125391bd9208e6fc8245c8d5713e4e486ded7f29df6e73ca931b0b40b7c988e9"
    },
    {
      "sr": "210",
      "article": "98",
      "label": "ZGB · Art. 98",
      "url": "https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_98",
      "sha256": "a0c7cbd6b692a3a82f9b951d2b80ac0b7af5dbb5846e991345a01165a2c5061d"
    },
    {
      "sr": "210",
      "article": "99",
      "label": "ZGB · Art. 99",
      "url": "https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_99",
      "sha256": "6a0650dbd278ef7ae9152bab4a877e848fd2834212ceca10d75f021d5e389070"
    },
    {
      "sr": "210",
      "article": "100",
      "label": "ZGB · Art. 100",
      "url": "https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de#art_100",
      "sha256": "7318049a1150f6f9bf563a58f1cf8c7f92adea9bec5d9f909b48aa8af1424e9f"
    },
    {
      "sr": "211.112.2",
      "article": "62",
      "label": "ZStV · Art. 62",
      "url": "https://www.fedlex.admin.ch/eli/cc/2004/362/de#art_62",
      "sha256": "6601c2fb974c1e2aa601c6927b2abdded282d930998c43e78a70f92b70fdfef9"
    }
  ]
};
