import { world } from "@minecraft/server";


world.afterEvents.projectileHitBlock.subscribe((event) => {
    switch (event.projectile.typeId) {
        case "brpg_mob:dust_devil_smoke": {
            event.projectile?.remove();
            break;
        }
    }
})

world.afterEvents.projectileHitEntity.subscribe((event) => {
    switch (event.projectile?.typeId) {
        case "brpg_mob:dust_devil_smoke": {
            let hit_entity = event.getEntityHit().entity;
            hit_entity.addEffect("blindness", 40, {
                showParticles: false
            });
            hit_entity.addEffect("slowness", 40, {
                showParticles: false
            });
            break;
        }
    }
})