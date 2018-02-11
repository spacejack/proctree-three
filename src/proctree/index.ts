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

interface Tree {
	properties: TreeProperties
	root: Branch
	verts: V3[]
	normals: V3[]
	UV: V2[]
	faces: number[][]
	vertsTwig: V3[]
	normalsTwig: V3[]
	uvsTwig: V2[]
	facesTwig: number[][]
	new(options: TreeOptions): Tree
	createForks(branch: Branch, radius: number): void
	createTwigs(branch?: Branch): void
	doFaces(branch?: Branch): void
	calcNormals(): void
}

function Tree (this: any, data: TreeOptions) {
	for (let i in data) {
		if (this.properties[i] !== undefined) {
			this.properties[i] = (data as any)[i]
		}
	}
	this.properties.rseed = this.properties.seed
	this.root = new (Branch as any)(V3(0, this.properties.trunkLength, 0))
	this.root.length = this.properties.initialBranchLength
	this.verts = []
	this.faces = []
	this.normals = []
	this.UV = []
	this.vertsTwig = []
	this.normalsTwig = []
	this.facesTwig = []
	this.uvsTwig = []
	this.root.split(undefined, undefined, this.properties, undefined, undefined)
	this.createForks()
	this.createTwigs()
	this.doFaces()
	this.calcNormals()
}

Tree.prototype.properties = {
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
	/* random: function(a?: number) {
		if(!a) {
			a = this.rseed++
		}
		return Math.abs(Math.cos(a+a*a))
	} */
}

Tree.prototype.calcNormals = function (this: Tree) {
	const normals = this.normals
	const faces = this.faces
	const verts = this.verts
	const allNormals: V3[][] = []
	for (let i=0; i < verts.length; i++) {
		allNormals[i] = [];
	}
	for (let i = 0; i < faces.length; i++) {
		const face=faces[i]
		const norm = V3.normalize(
			V3.cross(
				V3.sub(verts[face[1]], verts[face[2]]),
				V3.sub(verts[face[1]], verts[face[0]])
			)
		)
		allNormals[face[0]].push(norm)
		allNormals[face[1]].push(norm)
		allNormals[face[2]].push(norm)
	}
	for (let i = 0; i < allNormals.length; i++) {
		let total = V3(0, 0, 0)
		const l = allNormals[i].length
		for (let j = 0; j < l; j++) {
			total = V3.add(total, V3.scale(allNormals[i][j], 1 / l))
		}
		normals[i] = total
	}
}

Tree.prototype.doFaces = function (this: Tree, branch: Branch) {
	if (!branch) {
		branch = this.root
	}
	const segments: number = this.properties.segments
	const faces: number[][] = this.faces
	const verts: V3[] = this.verts
	const UV: V2[] = this.UV
	if (!branch.parent) {
		for (let i = 0; i < verts.length; i++) {
			UV[i] = V2(0, 0)
		}
		const tangent = V3.normalize(
			V3.cross(
				V3.sub(branch.child0.head, branch.head),
				V3.sub(branch.child1.head, branch.head)
			)
		)
		const normal = V3.normalize(branch.head)
		let angle = Math.acos(V3.dot(tangent, V3(-1, 0, 0)))
		if (V3.dot(V3.cross(V3(-1, 0, 0), tangent), normal) > 0) {
			angle = 2 * Math.PI - angle
		}
		const segOffset = Math.round((angle / Math.PI / 2 * segments))
		for (let i = 0; i < segments; i++) {
			const v1 = branch.ring0[i]
			const v2 = branch.root[(i + segOffset + 1) % segments]
			const v3 = branch.root[(i + segOffset) % segments]
			const v4 = branch.ring0[(i + 1) % segments]
			faces.push([v1, v4, v3])
			faces.push([v4, v2, v3])
			UV[(i + segOffset) % segments] = V2(Math.abs(i / segments - 0.5) * 2, 0)
			const len = V3.len(
				V3.sub(verts[branch.ring0[i]], verts[branch.root[(i + segOffset) % segments]])
			) * this.properties.vMultiplier
			UV[branch.ring0[i]] = V2(Math.abs(i / segments - 0.5) * 2, len)
			UV[branch.ring2[i]] = V2(Math.abs(i / segments - 0.5) * 2, len)
		}
	}

	if (branch.child0.ring0) {
		let segOffset0: number, segOffset1: number
		let match0: number, match1: number

		let v1 = V3.normalize(V3.sub(verts[branch.ring1[0]], branch.head))
		let v2 = V3.normalize(V3.sub(verts[branch.ring2[0]], branch.head))

		v1 = V3.scaleInDirection(v1, V3.normalize(V3.sub(branch.child0.head, branch.head)), 0)
		v2 = V3.scaleInDirection(v2, V3.normalize(V3.sub(branch.child1.head, branch.head)), 0)

		for (let i = 0; i < segments; i++) {
			let d = V3.normalize(V3.sub(verts[branch.child0.ring0[i]], branch.child0.head))
			let l = V3.dot(d, v1)
			if (segOffset0! === undefined || l > match0!) {
				match0 = l
				segOffset0 = segments - i
			}
			d = V3.normalize(V3.sub(verts[branch.child1.ring0[i]], branch.child1.head))
			l = V3.dot(d, v2)
			if (segOffset1! == undefined || l > match1!) {
				match1 = l
				segOffset1 = segments - i
			}
		}

		var UVScale = this.properties.maxRadius / branch.radius

		for (let i = 0; i < segments; i++) {
			let r1 = branch.child0.ring0[i]
			let r2 = branch.ring1[(i + segOffset0! + 1) % segments]
			let r3 = branch.ring1[(i + segOffset0!) % segments]
			let r4 = branch.child0.ring0[(i+1)%segments];
			faces.push([r1, r4, r3])
			faces.push([r4, r2, r3])
			r1=branch.child1.ring0[i];
			r2=branch.ring2[(i + segOffset1! + 1) % segments]
			r3=branch.ring2[(i + segOffset1!) % segments]
			r4=branch.child1.ring0[(i + 1) % segments]
			faces.push([r1,r2,r3])
			faces.push([r1,r4,r2])

			const len1 = V3.len(V3.sub(verts[branch.child0.ring0[i]], verts[branch.ring1[(i + segOffset0!) % segments]])) * UVScale
			const uv1 = UV[branch.ring1[(i + segOffset0! - 1) % segments]]

			UV[branch.child0.ring0[i]] = V2(uv1.x, uv1.y + len1 * this.properties.vMultiplier)
			UV[branch.child0.ring2[i]] = V2(uv1.x, uv1.y + len1 * this.properties.vMultiplier)

			const len2 = V3.len(V3.sub(verts[branch.child1.ring0[i]], verts[branch.ring2[(i + segOffset1!) % segments]])) * UVScale
			const uv2 = UV[branch.ring2[(i + segOffset1! - 1) % segments]]

			UV[branch.child1.ring0[i]] = V2(uv2.x, uv2.y + len2 * this.properties.vMultiplier)
			UV[branch.child1.ring2[i]] = V2(uv2.x, uv2.y + len2 * this.properties.vMultiplier)
		}

		this.doFaces(branch.child0)
		this.doFaces(branch.child1)
	} else {
		for (let i = 0; i < segments; i++) {
			faces.push([branch.child0.end,branch.ring1[(i+1)%segments],branch.ring1[i]]);
			faces.push([branch.child1.end,branch.ring2[(i+1)%segments],branch.ring2[i]]);
			let len = V3.len(V3.sub(verts[branch.child0.end], verts[branch.ring1[i]]))
			UV[branch.child0.end] = V2(Math.abs(i / segments - 1 - 0.5) * 2, len * this.properties.vMultiplier)
			len = V3.len(V3.sub(verts[branch.child1.end], verts[branch.ring2[i]]))
			UV[branch.child1.end] = V2(Math.abs(i / segments - 0.5) * 2, len * this.properties.vMultiplier)
		}
	}
}

Tree.prototype.createTwigs = function (this: Tree, branch?: Branch) {
	if (!branch) {
		branch = this.root
	}
	const vertsTwig: V3[] = this.vertsTwig
	const normalsTwig: V3[] = this.normalsTwig
	const facesTwig: number[][] = this.facesTwig
	const uvsTwig: V2[] = this.uvsTwig
	if (!branch.child0) {
		const tangent = V3.normalize(
			V3.cross(
				V3.sub(branch.parent.child0.head, branch.parent.head),
				V3.sub(branch.parent.child1.head, branch.parent.head)
			)
		)
		const binormal = V3.normalize(V3.sub(branch.head,branch.parent.head));
		let normal = V3.cross(tangent, binormal)

		const vert1 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent,this.properties.twigScale)), V3.scale(binormal, this.properties.twigScale * 2 - branch.length)))
		const vert2 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent, -this.properties.twigScale)), V3.scale(binormal, this.properties.twigScale * 2 - branch.length)))
		const vert3 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent, -this.properties.twigScale)), V3.scale(binormal, -branch.length)))
		const vert4 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent, this.properties.twigScale)), V3.scale(binormal, -branch.length)))

		const vert8 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent, this.properties.twigScale)), V3.scale(binormal, this.properties.twigScale * 2 - branch.length)))
		const vert7 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent, -this.properties.twigScale)), V3.scale(binormal, this.properties.twigScale * 2 - branch.length)))
		const vert6 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent, -this.properties.twigScale)), V3.scale(binormal, -branch.length)))
		const vert5 = vertsTwig.length
		vertsTwig.push(V3.add(V3.add(branch.head, V3.scale(tangent, this.properties.twigScale)), V3.scale(binormal, -branch.length)))

		facesTwig.push([vert1, vert2, vert3])
		facesTwig.push([vert4, vert1, vert3])

		facesTwig.push([vert6, vert7, vert8])
		facesTwig.push([vert6, vert8, vert5])

		normal = V3.normalize(V3.cross(V3.sub(vertsTwig[vert1], vertsTwig[vert3]), V3.sub(vertsTwig[vert2], vertsTwig[vert3])))
		const normal2 = V3.normalize(V3.cross(V3.sub(vertsTwig[vert7], vertsTwig[vert6]), V3.sub(vertsTwig[vert8], vertsTwig[vert6])))

		normalsTwig.push(normal)
		normalsTwig.push(normal)
		normalsTwig.push(normal)
		normalsTwig.push(normal)

		normalsTwig.push(normal2)
		normalsTwig.push(normal2)
		normalsTwig.push(normal2)
		normalsTwig.push(normal2)

		uvsTwig.push(V2(0, 1))
		uvsTwig.push(V2(1, 1))
		uvsTwig.push(V2(1, 0))
		uvsTwig.push(V2(0, 0))

		uvsTwig.push(V2(0, 1))
		uvsTwig.push(V2(1, 1))
		uvsTwig.push(V2(1, 0))
		uvsTwig.push(V2(0, 0))
	} else {
		this.createTwigs(branch.child0)
		this.createTwigs(branch.child1)
	}
}

Tree.prototype.createForks = function (this: Tree, branch: Branch, radius?: number) {
	if (!branch) {
		branch = this.root
	}
	if (!radius) {
		radius = this.properties.maxRadius
	}
	branch.radius = radius
	if (radius > branch.length) {
		radius = branch.length
	}

	const verts: V3[] = this.verts
	const segments: number = this.properties.segments
	const segmentAngle = Math.PI * 2 / segments
	let axis = V3()

	if (!branch.parent) {
		//create the root of the tree
		branch.root = []
		axis = V3(0, 1, 0)
		for (let i = 0; i < segments; i++) {
			const vec = V3.axisAngle(V3(-1, 0, 0), axis, -segmentAngle * i)
			branch.root.push(verts.length)
			verts.push(V3.scale(vec, radius / this.properties.radiusFalloffRate))
		}
	}

	//cross the branches to get the left
	//add the branches to get the up
	if (branch.child0) {
		if (branch.parent) {
			axis = V3.normalize(V3.sub(branch.head, branch.parent.head))
		} else {
			axis = V3.normalize(branch.head)
		}

		const axis1 = V3.normalize(V3.sub(branch.head, branch.child0.head))
		const axis2 = V3.normalize(V3.sub(branch.head,branch.child1.head))
		const tangent = V3.normalize(V3.cross(axis1, axis2))
		branch.tangent = tangent

		const axis3 = V3.normalize(V3.cross(tangent, V3.normalize(V3.add(V3.scale(axis1, -1), V3.scale(axis2, -1)))))
		const dir = V3(axis2.x, 0, axis2.z)
		const centerloc = V3.add(branch.head, V3.scale(dir, -this.properties.maxRadius / 2))

		const ring0 = branch.ring0 = [] as number[]
		const ring1 = branch.ring1 = [] as number[]
		const ring2 = branch.ring2 = [] as number[]

		let scale: number = this.properties.radiusFalloffRate
		if (branch.child0.type === 'trunk' || branch.type === 'trunk') {
			scale = 1 / this.properties.taperRate
		}

		//main segment ring
		const linch0 = verts.length
		ring0.push(linch0)
		ring2.push(linch0)
		verts.push(V3.add(centerloc, V3.scale(tangent, radius * scale)))

		let start = verts.length - 1
		const d1 = V3.axisAngle(tangent, axis2, 1.57)
		const d2 = V3.normalize(V3.cross(tangent, axis))
		const s = 1 / V3.dot(d1, d2)
		for (let i = 1; i < segments / 2; i++) {
			let vec = V3.axisAngle(tangent, axis2, segmentAngle * i)
			ring0.push(start + i)
			ring2.push(start + i)
			vec = V3.scaleInDirection(vec, d2, s)
			verts.push(V3.add(centerloc, V3.scale(vec, radius * scale)))
		}
		const linch1 = verts.length
		ring0.push(linch1)
		ring1.push(linch1)
		verts.push(V3.add(centerloc, V3.scale(tangent, -radius*scale)))
		for (let i = segments / 2 + 1; i < segments; i++) {
			const v = V3.axisAngle(tangent, axis1, segmentAngle * i)
			ring0.push(verts.length)
			ring1.push(verts.length)
			verts.push(V3.add(centerloc, V3.scale(v, radius * scale)))
		}
		ring1.push(linch0);
		ring2.push(linch1);
		start = verts.length - 1
		for (let i = 1; i < segments / 2; i++) {
			const vec = V3.axisAngle(tangent, axis3, segmentAngle * i)
			ring1.push(start + i)
			ring2.push(start + (segments / 2 - i))
			const v = V3.scale(vec, radius * scale)
			verts.push(V3.add(centerloc, v))
		}

		//child radius is related to the brans direction and the length of the branch
		const length0 = V3.len(V3.sub(branch.head, branch.child0.head))
		const length1 = V3.len(V3.sub(branch.head, branch.child1.head))

		let radius0 = 1 * radius * this.properties.radiusFalloffRate
		const radius1 = 1 * radius * this.properties.radiusFalloffRate
		if (branch.child0.type === 'trunk') {
			radius0 = radius * this.properties.taperRate
		}
		this.createForks(branch.child0, radius0)
		this.createForks(branch.child1, radius1)
	} else {
		//add points for the ends of braches
		branch.end = verts.length
		//branch.head=addVec(branch.head,scaleVec([this.properties.xBias,this.properties.yBias,this.properties.zBias],branch.length*3));
		verts.push(branch.head)
	}
}

export default Tree

interface Branch {
	head: V3
	parent: any
	child0: Branch
	child1: Branch
	type: 'trunk' | undefined
	end: number
	radius: number
	tangent: V3
	root: number[]
	ring0: number[]
	ring1: number[]
	ring2: number[]
	new(head: V3, parent?: Branch): Branch
	split(level: number | undefined, steps: number | undefined, properties: TreeProperties, l1: number | undefined, l2: number | undefined): void
}

function Branch (this: Branch, head: V3, parent?: Branch) {
	this.head = head
	this.parent = parent
}

Branch.prototype.child0 = null
Branch.prototype.child1 = null
Branch.prototype.parent = null
Branch.prototype.head = null
Branch.prototype.length = 1

Branch.prototype.mirrorBranch = function (vec: V3, norm: V3, properties: TreeProperties) {
	const v = V3.cross(norm, V3.cross(vec, norm))
	const s = properties.branchFactor * V3.dot(v, vec)
	return V3(vec.x - v.x * s, vec.y - v.y * s, vec.z - v.z * s)
}

Branch.prototype.split = function (level: number | undefined, steps: number | undefined, properties: TreeProperties, l1: number | undefined, l2: number | undefined) {
	if (l1 == null) l1 = 1
	if (l2 == null) l2 = 1
	if (level == null) level = properties.levels
	if (steps == null) steps = properties.treeSteps
	const rLevel = properties.levels - level
	let po: V3
	if (this.parent) {
		po = this.parent.head
	} else {
		po = V3()
		this.type = 'trunk'
	}
	const so: V3 = this.head
	const dir = V3.normalize(V3.sub(so, po))

	const normal = V3.cross(dir, V3(dir.z, dir.x, dir.y))
	const tangent = V3.cross(dir, normal)
	const r = random(rLevel * 10 + l1 * 5 + l2 + properties.seed)
	const r2 = random(rLevel * 10 + l1 * 5 + l2 + 1 + properties.seed)
	const clumpmax = properties.clumpMax
	const clumpmin = properties.clumpMin

	let adj = V3.add(V3.scale(normal, r), V3.scale(tangent, 1 - r))
	if (r > 0.5) {
		adj = V3.scale(adj, -1)
	}

	const clump = (clumpmax - clumpmin) * r + clumpmin
	let newdir = V3.normalize(V3.add(V3.scale(adj, 1-clump), V3.scale(dir, clump)))

	let newdir2 = this.mirrorBranch(newdir, dir, properties)
	if (r > 0.5) {
		const tmp = newdir
		newdir = newdir2
		newdir2 = tmp
	}
	if (steps > 0) {
		const angle = steps / properties.treeSteps * 2 * Math.PI * properties.twistRate
		newdir2 = V3.normalize(V3(Math.sin(angle), r, Math.cos(angle)))
	}

	const growAmount = level * level / (properties.levels * properties.levels) * properties.growAmount
	const dropAmount = rLevel * properties.dropAmount
	const sweepAmount = rLevel * properties.sweepAmount
	newdir = V3.normalize(V3.add(newdir, V3(sweepAmount, dropAmount + growAmount, 0)))
	newdir2 = V3.normalize(V3.add(newdir2, V3(sweepAmount, dropAmount + growAmount, 0)))

	const head0 = V3.add(so, V3.scale(newdir, this.length))
	const head1 = V3.add(so, V3.scale(newdir2, this.length))
	this.child0 = new (Branch as any)(head0, this)
	this.child1 = new (Branch as any)(head1, this)
	this.child0.length = Math.pow(this.length, properties.lengthFalloffPower) * properties.lengthFalloffFactor
	this.child1.length = Math.pow(this.length, properties.lengthFalloffPower) * properties.lengthFalloffFactor
	if (level > 0) {
		if (steps > 0) {
			this.child0.head = V3.add(this.head, V3((r - 0.5) * 2 * properties.trunkKink, properties.climbRate, (r - 0.5) * 2 * properties.trunkKink))
			this.child0.type = 'trunk'
			this.child0.length = this.length*properties.taperRate
			this.child0.split(level, steps - 1, properties, l1 + 1, l2)
		} else {
			this.child0.split(level - 1, 0, properties, l1 + 1, l2)
		}
		this.child1.split(level - 1, 0, properties, l1, l2 + 1)
	}
}

// Math utils //////////////////////////////////////////////////////////

function random (a: number) {
	//if(!a) a=this.rseed++;
	return Math.abs(Math.cos(a + a * a))
}


interface V2 {
	x: number
	y: number
}

function V2 (x = 0, y = 0) {
	return {x, y}
}

interface V3 {
	x: number
	y: number
	z: number
}

function V3 (x = 0, y = 0, z = 0) {
	return {x, y, z}
}

namespace V3 {
	export function dot (v1: V3, v2: V3){
		return v1.x * v2.x + v1.y * v2.y + v1.x * v2.z
	}

	export function cross (v1: V3, v2: V3) {
		return {
			x: v1.y * v2.z - v1.z * v2.y,
			y: v1.z * v2.x - v1.x * v2.z,
			z: v1.x * v2.y - v1.y * v2.x
		}
	}

	export function len (v: V3) {
		return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
	}

	export function normalize (v: V3) {
		const l = len(v)
		return scale(v, 1 / l)
	}

	export function scale (v: V3, s: number) {
		return {x: v.x * s, y: v.y * s, z: v.z * s}
	}

	export function sub (v1: V3, v2: V3) {
		return {x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z}
	}

	export function add (v1: V3, v2: V3) {
		return {x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z}
	}

	export function axisAngle (v: V3, axis: V3, angle: number) {
		const c = Math.cos(angle)
		const s = Math.sin(angle)
		return add(add(scale(v, c), scale(cross(axis, v), s)), scale(axis, dot(axis, v) * (1 - c)))
	}

	export function scaleInDirection (vector: V3, direction: V3, s: number) {
		const currentMag = dot(vector, direction)
		const change = scale(direction, currentMag * s - currentMag)
		return add(vector, change)
	}
}
