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
  ],
  "rent-increase": [
    {
      "sr": "220",
      "article": "269d",
      "label": "OR · Art. 269d",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_269d",
      "sha256": "5603a4a7c84e182e29288ab07fe1956f4348ac15c0ba01991d1c7096285d338a"
    },
    {
      "sr": "220",
      "article": "270b",
      "label": "OR · Art. 270b",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_270b",
      "sha256": "fc976d99f0e35d2bdd41a3f1e9fe0d54957cf85e42b93a8a9a700e43f21cb442"
    }
  ],
  "housing-defect": [
    {
      "sr": "220",
      "article": "259a",
      "label": "OR · Art. 259a",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_259a",
      "sha256": "c59037fc4611fec2d6e03f1c0cb3f39f0f482b63d5b50e1c3d9ceb005d7726b5"
    },
    {
      "sr": "220",
      "article": "259b",
      "label": "OR · Art. 259b",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_259b",
      "sha256": "1fcd213fc088f4f17a14d7e04bf0a49b908ccd6d9d01549fea908c4ab6acaee3"
    },
    {
      "sr": "220",
      "article": "259d",
      "label": "OR · Art. 259d",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_259d",
      "sha256": "7ae241377264377486d547aa910df07b18285214f92accc1d6129be40f3e802e"
    },
    {
      "sr": "220",
      "article": "259g",
      "label": "OR · Art. 259g",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_259g",
      "sha256": "6b65a24a0d9233c13e5bd114558bb84c421a702fe94e39872bc4319cb70602f8"
    },
    {
      "sr": "220",
      "article": "259h",
      "label": "OR · Art. 259h",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_259h",
      "sha256": "ae06e0932ee2423be1a206b956be269afc54bdde6e7cbe6981707de05950889f"
    }
  ],
  "tenancy-end": [
    {
      "sr": "220",
      "article": "264",
      "label": "OR · Art. 264",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_264",
      "sha256": "798156a66fd8f7f4b11e91927f563656ee06817f6143dafaa331625d2ea85573"
    },
    {
      "sr": "220",
      "article": "266a",
      "label": "OR · Art. 266a",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_266a",
      "sha256": "edb1d395f848be84449039f6acb40e60c35c5041037afa6c8333dc1370471b1e"
    },
    {
      "sr": "220",
      "article": "266c",
      "label": "OR · Art. 266c",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_266c",
      "sha256": "e2b74e9121e37f6e7caf1a7e655ae27e56437a996160c4313d362d9414f7f6a8"
    },
    {
      "sr": "220",
      "article": "266l",
      "label": "OR · Art. 266l",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_266l",
      "sha256": "8e4ae0d6e2cc15d9e828e13f6040b2b923a8e406cb781f657b120bb0ff567261"
    },
    {
      "sr": "220",
      "article": "266m",
      "label": "OR · Art. 266m",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_266m",
      "sha256": "e953f833d123d12ae211098bfec73f1e9850a34ef72f65c5387ce11bd2d1d639"
    },
    {
      "sr": "220",
      "article": "266n",
      "label": "OR · Art. 266n",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_266n",
      "sha256": "bd63b8092e714eca81808aa87838a081c67cce1c23236c52107ed9902d09274e"
    },
    {
      "sr": "220",
      "article": "266o",
      "label": "OR · Art. 266o",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_266o",
      "sha256": "3ce42f591267bda9913a6d331a5ffe48f2abe2dea78f3747acef15aaa7c37d77"
    },
    {
      "sr": "220",
      "article": "273",
      "label": "OR · Art. 273",
      "url": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_273",
      "sha256": "df7e8a1e60f7f39c9475231a620b6c76b578db8fd5b0863ca828371adb7af738"
    }
  ]
};
