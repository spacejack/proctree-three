export function flattenA2toFloat32Array (va: number[][]) {
	const size = va.length * 2
	const a = new Float32Array(size)
	for (let i = 0; i < va.length; ++i) {
		const v = va[i]
		a[i * 2 + 0] = v[0]
		a[i * 2 + 1] = v[1]
	}
	return a
}

export function flattenA3toFloat32Array (va: number[][]) {
	const size = va.length * 3
	const a = new Float32Array(size)
	for (let i = 0; i < va.length; ++i) {
		const v = va[i]
		a[i * 3 + 0] = v[0]
		a[i * 3 + 1] = v[1]
		a[i * 3 + 2] = v[2]
	}
	return a
}

export function flattenA3toUint32Array (ia: number[][]) {
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
