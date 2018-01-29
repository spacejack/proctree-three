import V2 from 'vec/v2'
import V3 from 'vec/v3'

export function flattenV2toFloat32Array (va: V2[]) {
	const size = va.length * 2
	const a = new Float32Array(size)
	for (let i = 0; i < va.length; ++i) {
		const v = va[i]
		a[i * 2 + 0] = v.x
		a[i * 2 + 1] = v.y
	}
	return a
}

export function flattenV3toFloat32Array (va: V3[]) {
	const size = va.length * 3
	const a = new Float32Array(size)
	for (let i = 0; i < va.length; ++i) {
		const v = va[i]
		a[i * 3 + 0] = v.x
		a[i * 3 + 1] = v.y
		a[i * 3 + 2] = v.z
	}
	return a
}

export function flattenI3toUint32Array (ia: number[][]) {
	const size = ia.length * 3
	const a = new Uint32Array(size)
	for (let i = 0; i < ia.length; ++i) {
		const ii = ia[i]
		a[i * 3 + 0] = ii[0]
		a[i * 3 + 1] = ii[1]
		a[i * 3 + 2] = ii[2]
	}
	return a
}
