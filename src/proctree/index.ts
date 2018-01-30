// Adapted from: https://github.com/supereggbert/proctree.js

import V2 from 'vec/v2'
import V3 from 'vec/v3'

export interface TreeProperties {
	clumpMax: number
	clumpMin: number
	lengthFalloffFactor: number
	lengthFalloffPower: number
	branchFactor: number
	radiusFalloffRate: number
	climbRate: number
	trunkKink: number
	maxRadius: number
	treeSteps: number
	taperRate: number
	twistRate: number
	segments: number
	levels: number
	sweepAmount: number
	initialBranchLength: number
	trunkLength: number
	dropAmount:  number
	growAmount:  number
	vMultiplier: number
	twigScale: number
	seed: number
	rseed: number
}

export interface TreeOptions {
	clumpMax?: number
	clumpMin?: number
	lengthFalloffFactor?: number
	lengthFalloffPower?: number
	branchFactor?: number
	radiusFalloffRate?: number
	climbRate?: number
	trunkKink?: number
	maxRadius?: number
	treeSteps?: number
	taperRate?: number
	twistRate?: number
	segments?: number
	levels?: number
	sweepAmount?: number
	initialBranchLength?: number
	trunkLength?: number
	dropAmount?:  number
	growAmount?:  number
	vMultiplier?: number
	twigScale?: number
	seed?: number
}

export default class Tree {
	properties: TreeProperties
	root: Branch
	verts: V3[]
	normals: V3[]
	UV: V2[]
	faces: [number, number, number][]
	vertsTwig: V3[]
	normalsTwig: V3[]
	uvsTwig: V2[]
	facesTwig: [number, number, number][]

	constructor (options: TreeOptions = {}) {
		this.properties = Object.assign(
			{ // defaults
				clumpMax: 0.8,
				clumpMin: 0.5,
				lengthFalloffFactor: 0.85,
				lengthFalloffPower: 1,
				branchFactor: 2.0,
				radiusFalloffRate: 0.6,
				climbRate: 1.5,
				trunkKink: 0.0,
				maxRadius: 0.25,
				treeSteps: 2,
				taperRate: 0.95,
				twistRate: 13,
				segments: 6,
				levels: 3,
				sweepAmount: 0,
				initialBranchLength: 0.85,
				trunkLength: 2.5,
				dropAmount: 0.0,
				growAmount: 0.0,
				vMultiplier: 0.2,
				twigScale: 2.0,
				seed: 10,
				rseed: 10
			},
			options
		)
		this.properties.rseed = this.properties.seed
		this.root = new Branch(V3.create(0, this.properties.trunkLength, 0))
		this.root.length = this.properties.initialBranchLength
		this.verts = []
		this.normals = []
		this.UV = []
		this.faces = []
		this.vertsTwig = []
		this.normalsTwig = []
		this.uvsTwig = []
		this.facesTwig = []

		this.root.split(this.properties)
		this.createForks()
		this.createTwigs()
		this.doFaces()
		this.calcNormals()
	}

	protected createForks (branch = this.root, radius = this.properties.maxRadius) {
		branch.radius = radius
		if (radius > branch.length) {
			radius = branch.length
		}

		const verts = this.verts
		const segments = this.properties.segments
		const segmentAngle = Math.PI * 2 / segments
		let axis: V3

		if (!branch.parent) {
			//create the root of the tree
			branch.root = []
			axis = V3.create(0, 1, 0)
			for (let i = 0; i < segments; i++) {
				const vec = axisAngle(V3.create(-1, 0, 0), axis, -segmentAngle * i)
				branch.root.push(verts.length)
				verts.push(V3.scale(V3.create(), vec, radius / this.properties.radiusFalloffRate))
			}
		}

		// cross the branches to get the left
		// add the branches to get the up
		if (branch.child0 && branch.child1) {
			if (branch.parent) {
				axis = V3.normalize(V3.create(), V3.sub(V3.create(), branch.head, branch.parent.head))
			} else {
				axis = V3.normalize(V3.create(), branch.head)
			}

			const axis1 = V3.normalize(V3.create(), V3.sub(V3.create(), branch.head, branch.child0.head))
			const axis2 = V3.normalize(V3.create(), V3.sub(V3.create(), branch.head, branch.child1.head))
			const tangent = V3.normalize(V3.create(), V3.cross(V3.create(), axis1, axis2))
			branch.tangent = tangent

			const axis3 = V3.normalize(V3.create(),
				V3.cross(V3.create(),
					tangent,
					V3.normalize(V3.create(),
						V3.add(V3.create(),
							V3.scale(V3.create(), axis1, -1),
							V3.scale(V3.create(), axis2, -1)
						)
					)
				)
			)
			const dir = V3.create(axis2.x, 0, axis2.z)
			const centerloc = V3.add(V3.create(),
				branch.head, V3.scale(V3.create(), dir, -this.properties.maxRadius / 2)
			)

			const ring0: number[] = branch.ring0 = []
			const ring1: number[] = branch.ring1 = []
			const ring2: number[] = branch.ring2 = []

			let scale = this.properties.radiusFalloffRate
			if (branch.child0.type === 'trunk' || branch.type === 'trunk') {
				scale = 1 / this.properties.taperRate
			}

			// main segment ring
			const linch0 = verts.length
			ring0.push(linch0)
			ring2.push(linch0)
			verts.push(V3.add(V3.create(), centerloc, V3.scale(V3.create(), tangent, radius * scale)))

			let start = verts.length - 1
			const d1 = axisAngle(tangent, axis2, 1.57)
			const d2 = V3.normalize(V3.create(), V3.cross(V3.create(), tangent, axis))
			const s = 1 / V3.dot(d1, d2)
			for (let i = 1; i < segments / 2; i++) {
				let vec = axisAngle(tangent, axis2, segmentAngle * i)
				ring0.push(start + i)
				ring2.push(start + i)
				vec = scaleInDirection(vec, d2, s)
				verts.push(V3.add(V3.create(), centerloc, V3.scale(V3.create(), vec, radius * scale)))
			}
			const linch1 = verts.length
			ring0.push(linch1)
			ring1.push(linch1)
			verts.push(V3.add(V3.create(), centerloc, V3.scale(V3.create(), tangent, -radius * scale)))
			for (let i = segments / 2 + 1; i < segments; i++) {
				const vec = axisAngle(tangent, axis1, segmentAngle * i)
				ring0.push(verts.length)
				ring1.push(verts.length)
				verts.push(V3.add(V3.create(), centerloc, V3.scale(V3.create(), vec, radius * scale)))
			}
			ring1.push(linch0)
			ring2.push(linch1)
			start = verts.length - 1
			for (let i = 1; i < segments / 2; i++) {
				const vec = axisAngle(tangent, axis3, segmentAngle * i)
				ring1.push(start + i)
				ring2.push(start + (segments / 2 - i))
				const v = V3.scale(V3.create(), vec, radius * scale)
				verts.push(V3.add(V3.create(), centerloc, v))
			}

			//child radius is related to the brans direction and the length of the branch
			const length0 = V3.length(V3.sub(V3.create(), branch.head, branch.child0.head))
			const length1 = V3.length(V3.sub(V3.create(), branch.head, branch.child1.head))

			let radius0 = radius * this.properties.radiusFalloffRate
			const radius1 = radius * this.properties.radiusFalloffRate
			if (branch.child0.type === 'trunk') {
				radius0 = radius * this.properties.taperRate
			}
			this.createForks(branch.child0, radius0)
			this.createForks(branch.child1, radius1)
		} else {
			//add points for the ends of braches
			branch.end = verts.length
			verts.push(branch.head)
		}
	}

	protected createTwigs (branch = this.root) {
		const vertsTwig = this.vertsTwig
		const normalsTwig = this.normalsTwig
		const facesTwig = this.facesTwig
		const uvsTwig = this.uvsTwig
		if (!branch.child0) {
			const tangent = V3.normalize(V3.create(),
				V3.cross(V3.create(),
					V3.sub(V3.create(), branch.parent!.child0!.head, branch.parent!.head),
					V3.sub(V3.create(), branch.parent!.child1!.head, branch.parent!.head)
				)
			)
			const binormal = V3.normalize(V3.create(), V3.sub(V3.create(), branch.head, branch.parent!.head))
			let normal = V3.cross(V3.create(), tangent, binormal)

			const vert1 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, this.properties.twigScale)),
					V3.scale(V3.create(), binormal, this.properties.twigScale * 2 - branch.length)
				)
			)
			const vert2 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, -this.properties.twigScale)),
					V3.scale(V3.create(), binormal, this.properties.twigScale * 2 - branch.length)
				)
			)
			const vert3 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, -this.properties.twigScale)),
					V3.scale(V3.create(), binormal, -branch.length)
				)
			)
			const vert4 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, this.properties.twigScale)),
					V3.scale(V3.create(), binormal, -branch.length)
				)
			)

			const vert8 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, this.properties.twigScale)),
					V3.scale(V3.create(), binormal, this.properties.twigScale * 2 - branch.length)
				)
			)
			const vert7 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, -this.properties.twigScale)),
					V3.scale(V3.create(), binormal, this.properties.twigScale * 2 - branch.length)
				)
			)
			const vert6 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, -this.properties.twigScale)),
					V3.scale(V3.create(), binormal, -branch.length)
				)
			)
			const vert5 = vertsTwig.length
			vertsTwig.push(
				V3.add(V3.create(),
					V3.add(V3.create(), branch.head, V3.scale(V3.create(), tangent, this.properties.twigScale)),
					V3.scale(V3.create(), binormal, -branch.length)
				)
			)

			facesTwig.push([vert1, vert2, vert3])
			facesTwig.push([vert4, vert1, vert3])

			facesTwig.push([vert6, vert7, vert8])
			facesTwig.push([vert6, vert8, vert5])

			normal = V3.normalize(V3.create(),
				V3.cross(V3.create(),
					V3.sub(V3.create(), vertsTwig[vert1], vertsTwig[vert3]),
					V3.sub(V3.create(), vertsTwig[vert2], vertsTwig[vert3])
				)
			)
			const normal2 = V3.normalize(V3.create(),
				V3.cross(V3.create(),
					V3.sub(V3.create(), vertsTwig[vert7], vertsTwig[vert6]),
					V3.sub(V3.create(), vertsTwig[vert8], vertsTwig[vert6])
				)
			)

			normalsTwig.push(normal)
			normalsTwig.push(normal)
			normalsTwig.push(normal)
			normalsTwig.push(normal)

			normalsTwig.push(normal2)
			normalsTwig.push(normal2)
			normalsTwig.push(normal2)
			normalsTwig.push(normal2)

			uvsTwig.push(V2.create(0, 1))
			uvsTwig.push(V2.create(1, 1))
			uvsTwig.push(V2.create(1, 0))
			uvsTwig.push(V2.create(0, 0))

			uvsTwig.push(V2.create(0, 1))
			uvsTwig.push(V2.create(1, 1))
			uvsTwig.push(V2.create(1, 0))
			uvsTwig.push(V2.create(0, 0))
		} else {
			this.createTwigs(branch.child0)
			this.createTwigs(branch.child1)
		}
	}

	protected doFaces (branch = this.root) {
		const segments = this.properties.segments
		const faces = this.faces
		const verts = this.verts
		const UV = this.UV
		if (!branch.parent) {
			for (let i = 0; i < verts.length; i++) {
				UV[i] = V2.create(0, 0)
			}
			const tangent = V3.normalize(V3.create(),
				V3.cross(V3.create(),
					V3.sub(V3.create(), branch.child0!.head, branch.head),
					V3.sub(V3.create(), branch.child1!.head, branch.head)
				)
			)
			const normal = V3.normalize(V3.create(), branch.head)
			let angle = Math.acos(V3.dot(tangent, V3.create(-1, 0, 0)))
			if (V3.dot(V3.cross(V3.create(), V3.create(-1, 0, 0), tangent), normal) > 0) {
				angle = Math.PI * 2 - angle
			}
			const segOffset = Math.round((angle / Math.PI / 2 * segments))
			for (let i = 0; i < segments; i++) {
				const v1 = branch.ring0![i]
				const v2 = branch.root[(i + segOffset + 1) % segments]
				const v3 = branch.root[(i + segOffset) % segments]
				const v4 = branch.ring0![(i + 1) % segments]

				faces.push([v1, v4, v3])
				faces.push([v4, v2, v3])
				UV[(i + segOffset) % segments] = V2.create(Math.abs(i / segments - 0.5) * 2, 0)
				const len = V3.length(
					V3.sub(V3.create(), verts[branch.ring0![i]], verts[branch.root[(i + segOffset) % segments]])
				) * this.properties.vMultiplier
				UV[branch.ring0![i]] = V2.create(Math.abs(i / segments - 0.5) * 2, len)
				UV[branch.ring2![i]] = V2.create(Math.abs(i / segments - 0.5) * 2, len)
			}
		}

		if (branch.child0!.ring0) {
			let segOffset0: number | undefined, segOffset1: number | undefined
			let match0: number | undefined, match1: number | undefined

			let v1 = V3.normalize(V3.create(), V3.sub(V3.create(), verts[branch.ring1![0]], branch.head))
			let v2 = V3.normalize(V3.create(), V3.sub(V3.create(), verts[branch.ring2![0]], branch.head))

			v1 = scaleInDirection(v1, V3.normalize(V3.create(), V3.sub(V3.create(), branch.child0!.head,branch.head)), 0)
			v2 = scaleInDirection(v2, V3.normalize(V3.create(), V3.sub(V3.create(), branch.child1!.head,branch.head)), 0)

			for (let i = 0; i < segments; i++) {
				let d = V3.normalize(V3.create(), V3.sub(V3.create(), verts[branch.child0!.ring0![i]], branch.child0!.head))
				let l = V3.dot(d, v1)
				if (segOffset0 === undefined || l > match0!) {
					match0 = l
					segOffset0 = segments - i
				}
				d = V3.normalize(V3.create(), V3.sub(V3.create(), verts[branch.child1!.ring0![i]], branch.child1!.head))
				l = V3.dot(d, v2)
				if (segOffset1 === undefined || l > match1!) {
					match1 = l
					segOffset1 = segments - i
				}
			}

			const UVScale = this.properties.maxRadius / branch.radius

			for (let i = 0; i < segments; i++) {
				let v1 = branch.child0!.ring0![i]
				let v2 = branch.ring1![(i + segOffset0! + 1) % segments]
				let v3 = branch.ring1![(i + segOffset0!) % segments]
				let v4 = branch.child0!.ring0![(i + 1) % segments]
				faces.push([v1, v4, v3])
				faces.push([v4, v2, v3])
				v1 = branch.child1!.ring0![i]
				v2 = branch.ring2![(i + segOffset1! + 1) % segments]
				v3 = branch.ring2![(i + segOffset1!) % segments]
				v4 = branch.child1!.ring0![(i + 1) % segments]
				faces.push([v1, v2, v3])
				faces.push([v1, v4, v2])

				const len1 = V3.length(
					V3.sub(V3.create(), verts[branch.child0!.ring0![i]], verts[branch.ring1![(i + segOffset0!) % segments]])
				) * UVScale
				const uv1 = UV[branch.ring1![(i + segOffset0! - 1) % segments]]

				UV[branch.child0!.ring0![i]] = V2.create(uv1.x, uv1.y + len1 * this.properties.vMultiplier)
				UV[branch.child0!.ring2![i]] = V2.create(uv1.x, uv1.y + len1 * this.properties.vMultiplier)

				const len2 = V3.length(
					V3.sub(V3.create(), verts[branch.child1!.ring0![i]], verts[branch.ring2![(i + segOffset1!) % segments]])
				) * UVScale
				const uv2 = UV[branch.ring2![(i + segOffset1! - 1) % segments]]

				UV[branch.child1!.ring0![i]] = V2.create(uv2.x, uv2.y + len2 * this.properties.vMultiplier)
				UV[branch.child1!.ring2![i]] = V2.create(uv2.x, uv2.y + len2 * this.properties.vMultiplier)
			}

			this.doFaces(branch.child0)
			this.doFaces(branch.child1)
		} else {
			for (let i = 0; i < segments; i++) {
				faces.push([branch.child0!.end,branch.ring1![(i + 1) % segments], branch.ring1![i]])
				faces.push([branch.child1!.end,branch.ring2![(i + 1) % segments], branch.ring2![i]])
				let len = V3.length(V3.sub(V3.create(), verts[branch.child0!.end], verts[branch.ring1![i]]))
				UV[branch.child0!.end] = V2.create(Math.abs(i / segments - 1 - 0.5) * 2, len * this.properties.vMultiplier)
				len = V3.length(V3.sub(V3.create(), verts[branch.child1!.end],verts[branch.ring2![i]]))
				UV[branch.child1!.end] = V2.create(Math.abs(i / segments - 0.5) * 2, len * this.properties.vMultiplier)
			}
		}
	}

	protected calcNormals() {
		const normals = this.normals
		const faces = this.faces
		const verts = this.verts
		const allNormals: V3[][] = []
		for (let i = 0; i < verts.length; i++) {
			allNormals[i] = []
		}
		for (let i = 0; i < faces.length; i++) {
			const face = faces[i]
			const norm = V3.normalize(V3.create(),
				V3.cross(V3.create(),
					V3.sub(V3.create(), verts[face[1]], verts[face[2]]),
					V3.sub(V3.create(), verts[face[1]], verts[face[0]])
				)
			)
			allNormals[face[0]].push(norm)
			allNormals[face[1]].push(norm)
			allNormals[face[2]].push(norm)
		}
		for (let i = 0; i < allNormals.length; i++) {
			const total = V3.create(0, 0, 0)
			const l = allNormals[i].length
			for (let j = 0; j < l; j++) {
				V3.add(total, total, V3.scale(V3.create(), allNormals[i][j] , 1 / l))
			}
			normals[i] = total
		}
	}
}

export class Branch {
	head: V3
	root: number[]
	ring0: number[] | undefined
	ring1: number[] | undefined
	ring2: number[] | undefined
	parent: Branch | undefined
	child0: Branch | undefined
	child1: Branch | undefined
	type: 'trunk' | 'branch'
	tangent: V3
	length: number
	radius: number
	end: number

	constructor (head: V3, parent?: Branch) {
		this.head = head
		this.root = []
		this.ring0 = undefined
		this.ring1 = undefined
		this.ring2 = undefined
		this.parent = parent
		this.child0 = undefined
		this.child1 = undefined
		this.type = parent == null ? 'trunk' : 'branch' // best guess for now, may be changed later
		this.tangent = V3.create()
		this.length = 1
		this.radius = 0
		this.end = 0
	}

	static mirror (vec: V3, norm: V3, branchFactor: number) {
		const v = V3.cross(V3.create(), vec, norm)
		const s = branchFactor * V3.dot(v, vec)
		return V3.set(v, vec.x - v.x * s, vec.y - v.y * s, vec.z - v.z * s)
	}

	split (properties: TreeProperties,
		level = properties.levels, steps = properties.treeSteps, l1 = 1, l2 = 1
	) {
		const rLevel = properties.levels - level
		const po = V3.create(0, 0, 0)
		if (this.parent) {
			V3.copy(po, this.parent.head)
		} else {
			this.type = 'trunk'
		}
		const dir = V3.sub(V3.create(), this.head, po)
		V3.normalize(dir, dir)
		const normal = V3.cross(V3.create(), dir, V3.create(dir.z, dir.x, dir.y))
		const tangent = V3.cross(V3.create(), dir, normal)
		const r = random(rLevel * 10 + l1 * 5 + l2 + properties.seed)
		const r2 = random(rLevel * 10 + l1 * 5 + l2 + 1 + properties.seed)
		const clumpmax = properties.clumpMax
		const clumpmin = properties.clumpMin
		const adj = V3.add(V3.create(),
			V3.scale(V3.create(), normal, r),
			V3.scale(V3.create(), tangent, 1 - r)
		)
		if (r > 0.5) {
			V3.scale(adj, adj, -1)
		}

		const clump = (clumpmax - clumpmin) * r + clumpmin
		let newdir = V3.normalize(V3.create(),
			V3.add(V3.create(),
				V3.scale(V3.create(), adj, 1 - clump), V3.scale(V3.create(), dir, clump)
			)
		)

		let newdir2 = Branch.mirror(newdir, dir, properties.branchFactor)
		if (r > 0.5) {
			const tmp = newdir
			newdir = newdir2
			newdir2 = tmp
		}

		if (steps > 0) {
			const angle = steps / properties.treeSteps * 2 * Math.PI * properties.twistRate
			newdir2 = V3.normalize(V3.create(), V3.create(Math.sin(angle), r, Math.cos(angle)))
		}

		const growAmount = level * level
			/ (properties.levels * properties.levels) * properties.growAmount
		const dropAmount = rLevel * properties.dropAmount
		const sweepAmount = rLevel * properties.sweepAmount
		newdir = V3.normalize(V3.create(),
			V3.add(V3.create(),
				newdir, V3.create(sweepAmount, dropAmount + growAmount, 0)
			)
		)
		newdir2 = V3.normalize(V3.create(),
			V3.add(V3.create(),
				newdir2, V3.create(sweepAmount, dropAmount + growAmount, 0)
			)
		)

		const head0 = V3.add(V3.create(), this.head, V3.scale(V3.create(), newdir, this.length))
		const head1 = V3.add(V3.create(), this.head, V3.scale(V3.create(), newdir2, this.length))
		this.child0 = new Branch(head0, this)
		this.child1 = new Branch(head1, this)
		this.child0.length = Math.pow(this.length, properties.lengthFalloffPower) * properties.lengthFalloffFactor
		this.child1.length = Math.pow(this.length, properties.lengthFalloffPower) * properties.lengthFalloffFactor
		if (level > 0) {
			if (steps > 0) {
				this.child0.head = V3.add(V3.create(),
					this.head,
					V3.create(
						(r - 0.5) * 2 * properties.trunkKink,
						properties.climbRate,
						(r - 0.5) * 2 * properties.trunkKink
					)
				)
				this.child0.type = 'trunk'
				this.child0.length = this.length * properties.taperRate
				this.child0.split(properties, level, steps - 1, l1 + 1, l2)
			} else {
				this.child0.split(properties, level - 1, 0, l1 + 1, l2)
			}
			this.child1.split(properties, level - 1, 0, l1, l2 + 1)
		}
	}
}

function random (n: number) {
	return Math.abs(Math.cos(n + n * n))
}

function axisAngle (vec: V3, axis: V3, angle: number) {
	const cosr = Math.cos(angle)
	const sinr = Math.sin(angle)
	return V3.add(V3.create(),
		V3.add(V3.create(),
			V3.scale(V3.create(), vec, cosr),
			V3.scale(V3.create(), V3.cross(V3.create(), axis, vec), sinr)
		),
		V3.scale(V3.create(), axis, V3.dot(axis, vec) * (1 - cosr))
	)
}

function scaleInDirection (vector: V3, direction: V3, scale: number) {
	const currentMag = V3.dot(vector, direction)
	const change = V3.scale(V3.create(), direction, currentMag * scale - currentMag)
	return V3.add(V3.create(), vector, change)
}
