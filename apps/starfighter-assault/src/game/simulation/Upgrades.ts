export type UpgradeId =
  | "laser-damage-1"
  | "laser-fire-rate-1"
  | "torpedo-capacity-1"
  | "shield-max-1"
  | "radar-clarity-1"
  | "extra-life";

export interface Upgrade {
  id: UpgradeId;
  cost: number;
}

export interface UpgradeState {
  bounties: number;
  purchased: UpgradeId[];
  laserDamageMultiplier: number;
  laserFireRateMultiplier: number;
  torpedoCapacityBonus: number;
  shieldMaxBonus: number;
  radarClarity: number;
  extraLives: number;
}

export interface PurchaseUpgradeResult {
  state: UpgradeState;
  purchased: boolean;
}

const UPGRADE_CATALOG: readonly Upgrade[] = [
  { id: "laser-damage-1", cost: 200 },
  { id: "laser-fire-rate-1", cost: 180 },
  { id: "torpedo-capacity-1", cost: 250 },
  { id: "shield-max-1", cost: 220 },
  { id: "radar-clarity-1", cost: 150 },
  { id: "extra-life", cost: 600 },
];

export function createUpgradeState(bounties: number): UpgradeState {
  return {
    bounties,
    purchased: [],
    laserDamageMultiplier: 1,
    laserFireRateMultiplier: 1,
    torpedoCapacityBonus: 0,
    shieldMaxBonus: 0,
    radarClarity: 1,
    extraLives: 0,
  };
}

export function getAvailableUpgrades(): Upgrade[] {
  return UPGRADE_CATALOG.map((upgrade) => ({ ...upgrade }));
}

export function purchaseUpgrade(
  state: UpgradeState,
  id: UpgradeId,
): PurchaseUpgradeResult {
  const upgrade = UPGRADE_CATALOG.find(
    (catalogUpgrade) => catalogUpgrade.id === id,
  );
  if (
    upgrade === undefined ||
    state.bounties < upgrade.cost ||
    state.purchased.includes(id)
  ) {
    return { state, purchased: false };
  }

  const nextState: UpgradeState = {
    ...state,
    bounties: state.bounties - upgrade.cost,
    purchased: [...state.purchased, id],
  };

  switch (id) {
    case "laser-damage-1":
      nextState.laserDamageMultiplier = 1.25;
      break;
    case "laser-fire-rate-1":
      nextState.laserFireRateMultiplier = 1.15;
      break;
    case "torpedo-capacity-1":
      nextState.torpedoCapacityBonus = 1;
      break;
    case "shield-max-1":
      nextState.shieldMaxBonus = 25;
      break;
    case "radar-clarity-1":
      nextState.radarClarity = 1.25;
      break;
    case "extra-life":
      nextState.extraLives = 1;
      break;
  }

  return {
    state: nextState,
    purchased: true,
  };
}
