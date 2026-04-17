/**
 * Utility functions for sprite manipulation in MakeCode Arcade.
 */
//% color=#00A19B icon="\uf0ad" block="Sprite FX"
namespace spriteFx {
    const trackedSprites: Sprite[] = []
    const originalImages: Image[] = []
    const rotationAngles: number[] = []
    const opacityPercents: number[] = []
    const outlineColors: number[] = []

    function normalizeAngle(angle: number): number {
        let normalized = angle % 360
        if (normalized < 0) normalized += 360
        return normalized
    }

    function spriteIndex(sprite: Sprite): number {
        for (let i = 0; i < trackedSprites.length; i++) {
            if (trackedSprites[i] == sprite) return i
        }

        trackedSprites.push(sprite)
        originalImages.push(sprite.image.clone())
        rotationAngles.push(0)
        opacityPercents.push(100)
        outlineColors.push(0)
        return trackedSprites.length - 1
    }

    function clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value))
    }

    function rotateImage(source: Image, angle: number): Image {
        const normalized = normalizeAngle(angle)
        const radians = normalized * Math.PI / 180
        const sin = Math.sin(radians)
        const cos = Math.cos(radians)

        const w = source.width
        const h = source.height
        const centerX = (w - 1) / 2
        const centerY = (h - 1) / 2

        const rotated = image.create(w, h)

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = x - centerX
                const dy = y - centerY

                const sourceX = Math.round(cos * dx + sin * dy + centerX)
                const sourceY = Math.round(-sin * dx + cos * dy + centerY)

                if (sourceX >= 0 && sourceX < w && sourceY >= 0 && sourceY < h) {
                    rotated.setPixel(x, y, source.getPixel(sourceX, sourceY))
                }
            }
        }

        return rotated
    }

    function applyOpacityDither(source: Image, opacityPercent: number): Image {
        const opacity = clamp(opacityPercent, 0, 100)
        if (opacity >= 100) return source.clone()
        if (opacity <= 0) return image.create(source.width, source.height)

        const matrix = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ]

        const level = opacity * 16 / 100
        const output = image.create(source.width, source.height)
        for (let y = 0; y < source.height; y++) {
            for (let x = 0; x < source.width; x++) {
                const color = source.getPixel(x, y)
                if (color == 0) continue
                if (matrix[y % 4][x % 4] < level) output.setPixel(x, y, color)
            }
        }

        return output
    }

    function refreshSpriteImage(sprite: Sprite): void {
        const idx = spriteIndex(sprite)
        const rotated = rotateImage(originalImages[idx], rotationAngles[idx])
        const dithered = applyOpacityDither(rotated, opacityPercents[idx])
        sprite.setImage(applyOutline(dithered, outlineColors[idx]))
    }

    function setSpriteData(sprite: Sprite, original: Image, angle: number, opacity: number): void {
        const idx = spriteIndex(sprite)
        originalImages[idx] = original
        rotationAngles[idx] = normalizeAngle(angle)
        opacityPercents[idx] = clamp(opacity, 0, 100)
        refreshSpriteImage(sprite)
    }

    function cropImage(source: Image): Image {
        let minX = source.width
        let minY = source.height
        let maxX = -1
        let maxY = -1

        for (let y = 0; y < source.height; y++) {
            for (let x = 0; x < source.width; x++) {
                if (source.getPixel(x, y) != 0) {
                    if (x < minX) minX = x
                    if (y < minY) minY = y
                    if (x > maxX) maxX = x
                    if (y > maxY) maxY = y
                }
            }
        }

        if (maxX < minX || maxY < minY) return image.create(1, 1)

        const width = maxX - minX + 1
        const height = maxY - minY + 1
        const cropped = image.create(width, height)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                cropped.setPixel(x, y, source.getPixel(minX + x, minY + y))
            }
        }

        return cropped
    }

    function applyOutline(source: Image, color: number): Image {
        if (color === 0) return source.clone()
        const outlined = source.clone()
        for (let y = 0; y < source.height; y++) {
            for (let x = 0; x < source.width; x++) {
                if (source.getPixel(x, y) != 0) continue
                let neighborSolid = false
                for (let dy = -1; dy <= 1 && !neighborSolid; dy++) {
                    for (let dx = -1; dx <= 1 && !neighborSolid; dx++) {
                        if (dx == 0 && dy == 0) continue
                        const nx = x + dx
                        const ny = y + dy
                        if (nx < 0 || ny < 0 || nx >= source.width || ny >= source.height) continue
                        if (source.getPixel(nx, ny) != 0) neighborSolid = true
                    }
                }
                if (neighborSolid) outlined.setPixel(x, y, color)
            }
        }
        return outlined
    }

    //% block="rotate $sprite by $angle degrees"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% angle.defl=0
    //% group="Rotation"
    export function rotate(sprite: Sprite, angle: number): void {
        setRotation(sprite, rotation(sprite) + angle)
    }

    //% block="set rotation of $sprite to $angle degrees"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% angle.defl=0
    //% group="Rotation"
    export function setRotation(sprite: Sprite, angle: number): void {
        if (!sprite) return

        const idx = spriteIndex(sprite)
        rotationAngles[idx] = normalizeAngle(angle)
        refreshSpriteImage(sprite)
    }

    //% block="rotation of $sprite"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Rotation"
    export function rotation(sprite: Sprite): number {
        if (!sprite) return 0
        const idx = spriteIndex(sprite)
        return rotationAngles[idx]
    }

    //% block="reset rotation of $sprite"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Rotation"
    export function resetRotation(sprite: Sprite): void {
        if (!sprite) return

        const idx = spriteIndex(sprite)
        rotationAngles[idx] = 0
        refreshSpriteImage(sprite)
    }

    //% block="make $sprite face direction $angle"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% angle.defl=0
    //% group="Rotation"
    export function faceDirection(sprite: Sprite, angle: number): void {
        setRotation(sprite, angle)
    }

    //% block="make $sprite face toward $target"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% target.shadow=variables_get
    //% target.defl=mySprite2
    //% group="Rotation"
    export function faceToward(sprite: Sprite, target: Sprite): void {
        if (!sprite || !target) return

        setRotation(sprite, angleBetween(sprite, target))
    }

    //% block="smooth rotate $sprite to $targetAngle degrees over $duration ms"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% targetAngle.defl=0
    //% duration.defl=1000
    //% group="Rotation"
    export function smoothRotate(sprite: Sprite, targetAngle: number, duration: number): void {
        if (!sprite) return

        if (duration <= 0) {
            setRotation(sprite, targetAngle)
            return
        }

        control.runInParallel(function () {
            const startAngle = rotation(sprite)
            const target = normalizeAngle(targetAngle)
            let delta = target - startAngle

            if (delta > 180) delta -= 360
            if (delta < -180) delta += 360

            const interval = 20
            const steps = Math.max(1, Math.idiv(duration, interval))

            for (let i = 1; i <= steps; i++) {
                const progress = i / steps
                setRotation(sprite, startAngle + delta * progress)
                pause(interval)
            }

            setRotation(sprite, target)
        })
    }

    //% block="pivot $sprite by $angle degrees around ($pivotX, $pivotY)"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% angle.defl=45
    //% pivotX.defl=0 pivotY.defl=0
    //% group="Rotation"
    export function pivotRotate(sprite: Sprite, angle: number, pivotX: number, pivotY: number): void {
        if (!sprite) return

        const w = sprite.image.width
        const h = sprite.image.height
        const pdx = pivotX - w / 2
        const pdy = pivotY - h / 2
        const radians = angle * Math.PI / 180
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)

        sprite.x += pdx * (1 - cos) + pdy * sin
        sprite.y += -pdx * sin + pdy * (1 - cos)
        rotate(sprite, angle)
    }

    //% block="smoothly pivot $sprite by $angle degrees around ($pivotX, $pivotY) over $duration ms"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% angle.defl=360
    //% pivotX.defl=0 pivotY.defl=0
    //% duration.defl=1000
    //% group="Rotation"
    export function smoothlyPivotRotate(sprite: Sprite, angle: number, pivotX: number, pivotY: number, duration: number): void {
        if (!sprite) return

        if (duration <= 0) {
            pivotRotate(sprite, angle, pivotX, pivotY)
            return
        }

        control.runInParallel(function () {
            const w = sprite.image.width
            const h = sprite.image.height
            const pdx0 = pivotX - w / 2
            const pdy0 = pivotY - h / 2
            const wpx = sprite.x + pdx0
            const wpy = sprite.y + pdy0
            const startAngle = rotation(sprite)

            const interval = 20
            const steps = Math.max(1, Math.idiv(duration, interval))

            for (let i = 1; i <= steps; i++) {
                const alpha = i / steps
                const stepRadians = alpha * angle * Math.PI / 180
                const outDx = Math.cos(stepRadians) * pdx0 - Math.sin(stepRadians) * pdy0
                const outDy = Math.sin(stepRadians) * pdx0 + Math.cos(stepRadians) * pdy0
                sprite.x = wpx - outDx
                sprite.y = wpy - outDy
                setRotation(sprite, startAngle + alpha * angle)
                pause(interval)
            }
        })
    }

    //% block="flip $sprite horizontally"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Transform"
    export function flipHorizontal(sprite: Sprite): void {
        if (!sprite) return

        const idx = spriteIndex(sprite)
        const flipped = originalImages[idx].clone()
        flipped.flipX()
        originalImages[idx] = flipped
        refreshSpriteImage(sprite)
    }

    //% block="flip $sprite vertically"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Transform"
    export function flipVertical(sprite: Sprite): void {
        if (!sprite) return

        const idx = spriteIndex(sprite)
        const flipped = originalImages[idx].clone()
        flipped.flipY()
        originalImages[idx] = flipped
        refreshSpriteImage(sprite)
    }

    //% block="set opacity of $sprite to $opacity %"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% opacity.min=0 opacity.max=100 opacity.defl=100
    //% group="Effects"
    export function setOpacity(sprite: Sprite, opacity: number): void {
        if (!sprite) return
        const idx = spriteIndex(sprite)
        opacityPercents[idx] = clamp(opacity, 0, 100)
        refreshSpriteImage(sprite)
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
        const recolored = originalImages[idx].clone()

        for (let y = 0; y < recolored.height; y++) {
            for (let x = 0; x < recolored.width; x++) {
                if (recolored.getPixel(x, y) == from) recolored.setPixel(x, y, to)
            }
        }

        originalImages[idx] = recolored
        refreshSpriteImage(sprite)
    }

    //% block="outline $sprite with color $color"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% color.min=1 color.max=15 color.defl=1
    //% group="Effects"
    export function outline(sprite: Sprite, color: number): void {
        if (!sprite) return
        const idx = spriteIndex(sprite)
        outlineColors[idx] = clamp(Math.round(color), 1, 15)
        refreshSpriteImage(sprite)
    }

    //% block="remove outline from $sprite"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Effects"
    export function removeOutline(sprite: Sprite): void {
        if (!sprite) return
        const idx = spriteIndex(sprite)
        outlineColors[idx] = 0
        refreshSpriteImage(sprite)
    }

    //% block="distance between $sprite and $target"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% target.shadow=variables_get
    //% target.defl=mySprite2
    //% group="Movement"
    export function distanceBetween(sprite: Sprite, target: Sprite): number {
        if (!sprite || !target) return 0
        const dx = target.x - sprite.x
        const dy = target.y - sprite.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    //% block="angle from $sprite to $target"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% target.shadow=variables_get
    //% target.defl=mySprite2
    //% group="Movement"
    export function angleBetween(sprite: Sprite, target: Sprite): number {
        if (!sprite || !target) return 0
        return normalizeAngle(Math.atan2(target.y - sprite.y, target.x - sprite.x) * 180 / Math.PI)
    }

    //% block="move $sprite forward by $distance pixels"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% distance.defl=10
    //% group="Movement"
    export function moveForward(sprite: Sprite, distance: number): void {
        if (!sprite) return
        const radians = rotation(sprite) * Math.PI / 180
        sprite.x += Math.cos(radians) * distance
        sprite.y += Math.sin(radians) * distance
    }

    //% block="orbit $sprite around ($centerX, $centerY) radius $radius speed $speed deg/s for $duration ms"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% centerX.defl=80 centerY.defl=60 radius.defl=30 speed.defl=60 duration.defl=1000
    //% group="Movement"
    export function orbitAroundPoint(sprite: Sprite, centerX: number, centerY: number, radius: number, speed: number, duration: number): void {
        if (!sprite) return
        if (duration <= 0) return

        control.runInParallel(function () {
            const stepMs = 20
            const steps = Math.max(1, Math.idiv(duration, stepMs))
            let startAngle = Math.atan2(sprite.y - centerY, sprite.x - centerX) * 180 / Math.PI
            if (radius <= 0) {
                const dx = sprite.x - centerX
                const dy = sprite.y - centerY
                radius = Math.sqrt(dx * dx + dy * dy)
            }

            for (let i = 1; i <= steps; i++) {
                const elapsedSec = (i * stepMs) / 1000
                const angle = startAngle + speed * elapsedSec
                const radians = angle * Math.PI / 180
                sprite.x = centerX + Math.cos(radians) * radius
                sprite.y = centerY + Math.sin(radians) * radius
                pause(stepMs)
            }
        })
    }

    //% block="clone current image from $source to $target"
    //% source.shadow=variables_get
    //% source.defl=mySprite
    //% target.shadow=variables_get
    //% target.defl=mySprite2
    //% group="Image"
    export function cloneSpriteImage(source: Sprite, target: Sprite): void {
        if (!source || !target) return
        const clone = source.image.clone()
        target.setImage(clone)
        setSpriteData(target, clone.clone(), 0, 100)
    }

    //% block="stamp $sprite to background"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Image"
    export function stampToBackground(sprite: Sprite): void {
        if (!sprite) return
        const left = Math.round(sprite.x - sprite.image.width / 2)
        const top = Math.round(sprite.y - sprite.image.height / 2)
        scene.backgroundImage().drawTransparentImage(sprite.image, left, top)
    }

    //% block="crop transparent border of $sprite"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% group="Image"
    export function cropTransparentBorder(sprite: Sprite): void {
        if (!sprite) return
        const idx = spriteIndex(sprite)
        originalImages[idx] = cropImage(originalImages[idx])
        refreshSpriteImage(sprite)
    }
}
