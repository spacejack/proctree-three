declare interface TreeOptions {
	clumpMax?: number;
	clumpMin?: number;
	lengthFalloffFactor?: number;
	lengthFalloffPower?: number;
	branchFactor?: number;
	radiusFalloffRate?: number;
	climbRate?: number;
	trunkKink?: number;
	maxRadius?: number;
	treeSteps?: number;
	taperRate?: number;
	twistRate?: number;
	segments?: number;
	levels?: number;
	sweepAmount?: number;
	initalBranchLength?: number;
	trunkLength?: number;
	dropAmount?:  number;
	growAmount?:  number;
	vMultiplier?: number;
	twigScale?: number;
	seed?: number;
}

declare class Tree {
	constructor (options: TreeOptions);
	root: any;
	verts: number[][];
	vertsTwig: number[][];
	normals: number[][];
	normalsTwig: number[][];
	UV: number[][];
	uvsTwig: number[][];
	faces: number[][];
	facesTwig: number[][];
	static flattenArray (nestedArray: number[][]): number[];
}
