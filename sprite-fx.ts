//% color=#00ff37 icon="\uf1d8" block="Luca's Recolor"
namespace spriteFx {
    const trackedSprites: Sprite[] = []
    const originalImages: Image[] = []
    const lastFrom: number[] = []
    const lastTo: number[] = []
    const lastImages: Image[] = []

    function clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value))
    }

    function untrack(sprite: Sprite): void {
        const i = trackedSprites.indexOf(sprite)
        if (i >= 0) {
            trackedSprites.splice(i, 1)
            originalImages.splice(i, 1)
            lastFrom.splice(i, 1)
            lastTo.splice(i, 1)
            lastImages.splice(i, 1)
        }
    }

    function spriteIndex(sprite: Sprite): number {
        const found = trackedSprites.indexOf(sprite)
        if (found >= 0) return found
        trackedSprites.push(sprite)
        originalImages.push(sprite.image.clone())
        lastFrom.push(-1)
        lastTo.push(-1)
        lastImages.push(null)
        sprites.onDestroyed(sprite, function () {
            untrack(sprite)
        })
        return trackedSprites.length - 1
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

        if (lastFrom[idx] == from && lastTo[idx] == to && lastImages[idx]) {
            sprite.setImage(lastImages[idx])
            return
        }

        const result = originalImages[idx].clone()
        for (let y = 0; y < result.height; y++) {
            for (let x = 0; x < result.width; x++) {
                if (result.getPixel(x, y) == from) result.setPixel(x, y, to)
            }
        }

        lastFrom[idx] = from
        lastTo[idx] = to
        lastImages[idx] = result
        sprite.setImage(result)
    }

    //% block="reset recolor cache for $sprite to current image"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Effects"
    export function resetCache(sprite: Sprite): void {
        const i = trackedSprites.indexOf(sprite)
        if (i < 0) return
        originalImages[i] = sprite.image.clone()
        lastFrom[i] = -1
        lastTo[i] = -1
        lastImages[i] = null
    }
}
