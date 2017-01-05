// old demo source: http://jsfiddle.net/KY7eq/

declare const Tree: any

let camera: THREE.Camera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let mesh: THREE.Mesh

function init() {
	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)

	scene = new THREE.Scene()

	const light = new THREE.DirectionalLight(0xFFFFFF, 1.0)
	light.position.copy(new THREE.Vector3(0.5, 1.0, 0.5).normalize())
	scene.add(light)

	const ambient = new THREE.AmbientLight(0x222222, 1.0)
	scene.add(ambient)

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1.0, 1000.0)
	camera.position.z = 8.0
	scene.add(camera)

	const geo = makeTreeGeo()

	mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({color: 0xBB7744}))
	mesh.position.y = -2.5
	scene.add(mesh)

	document.body.appendChild(renderer.domElement)
}

function makeTreeGeo() {
	const tree = new Tree({
		seed: 123,
		segments: 10,
		levels: 5,
		vMultiplier: 0.66,
		twigScale: 0.47,
		initalBranchLength: 0.5,
		lengthFalloffFactor: 0.85,
		lengthFalloffPower: 0.99,
		clumpMax: 0.449,
		clumpMin: 0.404,
		branchFactor: 2.75,
		dropAmount: 0.07,
		growAmount: -0.005,
		sweepAmount: 0.01,
		maxRadius: 0.269,
		climbRate: 0.626,
		trunkKink: 0.108,
		treeSteps: 4,
		taperRate: 0.876,
		radiusFalloffRate: 0.66,
		twistRate: 2.7,
		trunkLength: 1.55
		//trunkMaterial: 'trunkMat',
		//twigMaterial: 'twigMat'
	})

	/*const tree = new Tree({
		seed: 262,
		segments: 6,
		levels: 5,
		vMultiplier: 2.36,
		twigScale: 0.39,
		initalBranchLength: 0.49,
		lengthFalloffFactor: 0.85,
		lengthFalloffPower: 0.99,
		clumpMax: 0.454,
		clumpMin: 0.404,
		branchFactor: 2.45,
		dropAmount: -0.1,
		growAmount: 0.235,
		sweepAmount: 0.01,
		maxRadius: 0.139,
		climbRate: 0.371,
		trunkKink: 0.093,
		treeSteps: 5,
		taperRate: 0.947,
		radiusFalloffRate: 0.73,
		twistRate: 3.02,
		trunkLength: 2.4
	})*/

	const vertices = new Float32Array(Tree.flattenArray(tree.verts))
	const normals = new Float32Array(Tree.flattenArray(tree.normals))
	const uvs = new Float32Array(Tree.flattenArray(tree.UV))
	const ids = new Uint32Array(tree.faces.length * 3)

	for (let i = 0; i < tree.faces.length; i++) {
		let face = tree.faces[i]
		ids[i * 3 + 0] = face[0]
		ids[i * 3 + 1] = face[1]
		ids[i * 3 + 2] = face[2]
	}

	const geo = new THREE.BufferGeometry()
	geo.addAttribute('position', new THREE.BufferAttribute(vertices, 3))
	geo.addAttribute('normal', new THREE.BufferAttribute(normals, 3, true))
	geo.addAttribute('uv', new THREE.BufferAttribute(uvs, 2))
	geo.setIndex(new THREE.BufferAttribute(ids, 1))
	return geo
}

function animate() {
	requestAnimationFrame(animate)
	render()
}

function render() {
	mesh.rotation.y += 0.01
	renderer.render(scene, camera)
}

///////////////////////////////////////////////////////////
// Start

init()
animate()
