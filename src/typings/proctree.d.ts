declare interface ProcTreeBranch {
	head: number[];
	root: number[];
	ring0?: number[];
	ring1?: number[];
	ring2?: number[];
	parent?: ProcTreeBranch;
	child0?: ProcTreeBranch;
	child1?: ProcTreeBranch;
	type?: 'trunk';
	tangent?: number[];
	length: number;
	radius: number;
	end: number;
}

declare interface ProcTreeProperties {
	clumpMax: number;
	clumpMin: number;
	lengthFalloffFactor: number;
	lengthFalloffPower: number;
	branchFactor: number;
	radiusFalloffRate: number;
	climbRate: number;
	trunkKink: number;
	maxRadius: number;
	treeSteps: number;
	taperRate: number;
	twistRate: number;
	segments: number;
	levels: number;
	sweepAmount: number;
	initialBranchLength: number;
	trunkLength: number;
	dropAmount:  number;
	growAmount:  number;
	vMultiplier: number;
	twigScale: number;
	seed: number;
}

type ProcTreeOptions = Partial<ProcTreeProperties>;

declare class ProcTree {
	constructor (options: ProcTreeOptions);
	properties: ProcTreeProperties;
	root: ProcTreeBranch;
	verts: number[][];
	normals: number[][];
	UV: number[][];
	faces: number[][];
	vertsTwig: number[][];
	normalsTwig: number[][];
	uvsTwig: number[][];
	facesTwig: number[][];
	static flattenArray (nestedArray: number[][]): number[];
}
