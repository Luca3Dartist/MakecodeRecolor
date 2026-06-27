//% color=#00ff37 icon="\uf0ad" block="Luca's Recolor"
namespace spriteFx {
    const trackedSprites: Sprite[] = []
    const originalImages: Image[] = []
    const recolorCache: Image[][][] = []

    function spriteIndex(sprite: Sprite): number {
        for (let i = 0; i < trackedSprites.length; i++) {
            if (trackedSprites[i] == sprite) return i
        }

        trackedSprites.push(sprite)
        originalImages.push(sprite.image.clone())
        recolorCache.push([])
        return trackedSprites.length - 1
    }

    function clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value))
    }

    //% block="recolor $sprite from $fromColor to $toColor"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% fromColor.min=1 fromColor.max=15 fromColor.defl=2
    //% toColor.min=1 toColor.max=15 toColor.defl=9
    //% group="Effects"
    export function recolor(sprite: Sprite, fromColor: number, toColor: number): void {
        if (!sprite) return
        const idx = spriteIndex(sprite)
        const from = clamp(Math.round(fromColor), 0, 15)
        const to = clamp(Math.round(toColor), 0, 15)

        if (!recolorCache[idx][from]) recolorCache[idx][from] = []

        let cached = recolorCache[idx][from][to]
        if (!cached) {
            cached = originalImages[idx].clone()
            for (let y = 0; y < cached.height; y++) {
                for (let x = 0; x < cached.width; x++) {
                    if (cached.getPixel(x, y) == from) cached.setPixel(x, y, to)
                }
            }
            recolorCache[idx][from][to] = cached
        }

        sprite.setImage(cached)
    }
}
