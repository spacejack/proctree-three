/// <reference path="../typings/proctree.d.ts"/>
import V3 from 'vec/v3'
import {
	flattenA2toFloat32Array, flattenA3toFloat32Array, flattenA3toUint32Array
} from './array'

export interface Branch {
	head: V3
	root?: number[]
	ring0?: number[]
	ring1?: number[]
	ring2?: number[]
	parent?: Branch
	child0?: Branch
	child1?: Branch
	type: 'trunk' | 'branch' | 'twig'
	tangent?: V3
	length: number
	radius: number
	end: number
}

export type TreeProperties = ProcTreeProperties

export type TreeOptions = ProcTreeOptions

export interface Tree {
	properties: TreeProperties
	root: Branch
	position: Float32Array
	normal: Float32Array
	uv: Float32Array
	id: Uint32Array
	twigPosition: Float32Array
	twigNormal: Float32Array
	twigUv: Float32Array
	twigId: Uint32Array
}

export function createTree (opts: TreeOptions = {}): Tree {
	const pt = new ProcTree(opts)
	const tree: Tree = {
		properties: pt.properties,
		root: createBranch(pt.root),
		position: flattenA3toFloat32Array(pt.verts),
		normal: flattenA3toFloat32Array(pt.normals),
		uv: flattenA2toFloat32Array(pt.UV),
		id: flattenA3toUint32Array(pt.faces),
		twigPosition: flattenA3toFloat32Array(pt.vertsTwig),
		twigNormal: flattenA3toFloat32Array(pt.normalsTwig),
		twigUv: flattenA2toFloat32Array(pt.uvsTwig),
		twigId: flattenA3toUint32Array(pt.facesTwig)
	}
	return tree
}

function createBranch (b: ProcTreeBranch, parent?: Branch): Branch {
	const branch: Branch = {
		head: V3.create(b.head[0], b.head[1], b.head[2]),
		root: b.root,
		ring0: b.ring0,
		ring1: b.ring1,
		ring2: b.ring2,
		parent: parent,
		child0: undefined,
		child1: undefined,
		type: b.type === 'trunk' ? 'trunk' : 'branch',
		tangent: b.tangent ? V3.fromArray(V3.create(), b.tangent) : undefined,
		length: b.length,
		radius: b.radius,
		end: b.end
	}
	if (!b.child0 && !b.child1) {
		branch.type = 'twig'
	}
	if (b.child0) {
		branch.child0 = createBranch(b.child0, branch)
	}
	if (b.child1) {
		branch.child1 = createBranch(b.child1, branch)
	}
	return branch
}
