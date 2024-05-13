import { Player, Entity, ItemDurabilityComponent, ItemStack } from "@minecraft/server"

export function playerCanInteractWithBlock(player: Player): boolean {
    if (player['blockInteractCooldown'] > Date.now()) { return false; }
    player['blockInteractCooldown'] = Date.now() + 500;
    return true;
}

export function isDamaged(durability: ItemDurabilityComponent): Boolean {
    return (durability?.damage > 0)
}

export function playerIsBlocking(player: Player | Entity, offhand: ItemStack): boolean {
    if (offhand?.hasTag('brpg:shield') && player?.isSneaking && player?.isOnGround) { return true; }
    return false
}