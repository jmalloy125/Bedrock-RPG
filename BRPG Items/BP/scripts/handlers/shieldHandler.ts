import { world, EntityEquippableComponent, EntityComponentTypes, EquipmentSlot, Entity, EntityHealthComponent, ItemStack, Vector3 } from "@minecraft/server";
import { playerIsBlocking } from "../utility.js"

const shieldDamageReduction: Map<string, number> = new Map<string, number>([
    ["brpg_items:new_shield", 0.25],
    ["brpg_items:dragon_sq_shield", 0.35]
]);

world.afterEvents.entityHurt.subscribe((entity) => {
    if (entity.hurtEntity.typeId !== "minecraft:player") { return; }
    let player: Entity = entity.hurtEntity;
    const playerEquipment: EntityEquippableComponent = player.getComponent(EntityComponentTypes.Equippable);
    let offhand: ItemStack = playerEquipment.getEquipment(EquipmentSlot.Offhand);
    if (entity.damageSource.damagingEntity?.isValid() && playerIsBlocking(player, offhand)) {
        world.playSound('item.shield.block', player.location);
        let health: EntityHealthComponent = player.getComponent(EntityComponentTypes.Health);

        let damageReduction: number = 0;
        if (shieldDamageReduction.has(offhand.typeId)) { damageReduction = shieldDamageReduction.get(offhand.typeId) }
        health.setCurrentValue(health.currentValue + (entity.damage * damageReduction));

        const viewDirection: Vector3 = player.getViewDirection();
        entity.damageSource.damagingEntity?.applyKnockback(viewDirection.x, viewDirection.z, 1.75, 0.2);
    }
})

