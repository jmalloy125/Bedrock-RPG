import {
    world, system, BlockComponentPlayerInteractEvent, ItemStack, EntityEquippableComponent,
    ItemComponentTypes, Container, EntityComponentTypes, EquipmentSlot,
    Player, PlayerInteractWithBlockBeforeEvent, ItemDurabilityComponent
} from "@minecraft/server"

import { playerCanInteractWithBlock, isDamaged } from "../utility.js"

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (event.block.typeId === "minecraft:enchanting_table") { return event.cancel = true; }
    if (event.block.typeId === "minecraft:anvil"
        || event.block.typeId === "minecraft:chipped_anvil"
        || event.block.typeId === "minecraft:damaged_anvil"
    ) { event.cancel = true; anvilInteractBeforeEvent(event, 0.35); }
})

world.beforeEvents.worldInitialize.subscribe(initEvent => {
    initEvent.blockTypeRegistry.registerCustomComponent('brpg_items:diamond_anvil', {
        onPlayerInteract: e => {
            anvilInteractBeforeEvent(e, 0.45);
        }
    });
    initEvent.blockTypeRegistry.registerCustomComponent('brpg_items:dragon_anvil', {
        onPlayerInteract: e => {
            anvilInteractBeforeEvent(e, 0.55)
        }
    });
    initEvent.blockTypeRegistry.registerCustomComponent('brpg_items:third_age_anvil', {
        onPlayerInteract: e => {
            anvilInteractBeforeEvent(e, 1.0)
        }
    });
})



let anvilIDMap: Map<string, string> = new Map<string, string>([
    ["minecraft:leather_tier", "minecraft:leather"],
    ["minecraft:stone_tier", "minecraft:stone"],
    ["minecraft:chainmail_tier", "minecraft:iron_nugget"],
    ["minecraft:iron_tier", "minecraft:iron_nugget"],
    ["minecraft:diamond_tier", "brpg_items:diamond_shard"],
    ["minecraft:netherite_tier", "brpg_items:diamond_shard"],
    ["minecraft:golden_tier", "minecraft:gold_nugget"],
    ["minecraft:elytra", "minecraft:phantom_membrane"],
    ["minecraft:bow", "minecraft:string"],
    ["minecraft:fishing_rod", "minecraft:string"],
    ["minecraft:is_trident", "minecraft:prismarine_crystals"]
])

interface anvilRepairItemBuilder {
    mainhand: ItemStack;
    equipment: EntityEquippableComponent;
    player: Player;
    repairItemID: string,
    repairPercentage: number;
};

//
//  repairPercentage: 0.0 .. 1.0
//


function anvilInteractBeforeEvent(event: PlayerInteractWithBlockBeforeEvent | BlockComponentPlayerInteractEvent, repairPercentage: number) {
    return system.run(() => {

        if (!playerCanInteractWithBlock(event.player)) { return; }

        let equipment: EntityEquippableComponent = event.player.getComponent(EntityComponentTypes.Equippable);
        let mainhand: ItemStack = equipment.getEquipment(EquipmentSlot.Mainhand);
        let anvilRepairItem: anvilRepairItemBuilder = {
            mainhand: mainhand,
            equipment: equipment,
            player: event.player,
            repairItemID: undefined,
            repairPercentage: repairPercentage
        }
        checkAnvilCompatibleItem(anvilRepairItem);
    })
}

function anvilInteractAction(item: anvilRepairItemBuilder) {
    let mainhand_durability: ItemDurabilityComponent = item.mainhand.getComponent(ItemComponentTypes.Durability);
    if (isDamaged(mainhand_durability)) {
        let inventory: Container = item.player.getComponent(EntityComponentTypes.Inventory).container;
        for (let inventorySlot = 0; inventorySlot <= inventory.size - 1; inventorySlot++) {
            let slot = inventory.getItem(inventorySlot);
            if (slot?.typeId === item.repairItemID) {
                switch (slot.amount - 1) {
                    case 0: { inventory.setItem(inventorySlot, undefined); break; }
                    default: { slot.amount--; inventory.setItem(inventorySlot, slot); break; }
                }
                mainhand_durability.damage = Math.max(0, (mainhand_durability.damage - (mainhand_durability.maxDurability * item.repairPercentage)));
                item.equipment.setEquipment(EquipmentSlot.Mainhand, item.mainhand);
                item.player.playSound("random.anvil_use", { volume: 0.5 });
                break;      //Avoid continuing inventory search if it repaired, as repairing is a single-click action per repair
            }
        }
    }
}

function checkAnvilCompatibleItem(item: anvilRepairItemBuilder) {
    const tags = item.mainhand?.getTags();
    if (tags) {
        switch (tags.length) {
            case 0: { item.repairItemID = anvilIDMap.get(item.mainhand.typeId) }
            default: {
                tags.map(tag => {
                    if (anvilIDMap.has(tag)) {
                        item.repairItemID = anvilIDMap.get(tag)
                    }
                    else if (anvilIDMap.has(item.mainhand.typeId)) {
                        item.repairItemID = anvilIDMap.get(item.mainhand.typeId)
                    };
                });
            }
        }
    }
    if (item.repairItemID) { anvilInteractAction(item); }
}

