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
	camera.position.z = 8.5
	scene.add(camera)

	const tex = new THREE.TextureLoader().load('tex/bark.jpg', () => {
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping
		mesh = new THREE.Mesh(
			makeTreeGeo(),
			new THREE.MeshLambertMaterial({color: 0xFFFFFF, map: tex})
		)
		mesh.position.y = -3.25
		scene.add(mesh)
		document.body.appendChild(renderer.domElement)
		animate()
	})
}

function makeTreeGeo() {
	const tree = new Tree({
		seed: Math.round(Math.random() * 10000),
		segments: 10,
		levels: 5,
		vMultiplier: 0.66,
		twigScale: 0.47,
		initalBranchLength: 0.5,
		lengthFalloffFactor: 0.85,
		lengthFalloffPower: 0.75,
		clumpMax: 0.449,
		clumpMin: 0.404,
		branchFactor: 3,
		dropAmount: 0.05,
		growAmount: -0.005,
		sweepAmount: 0.01,
		maxRadius: 0.27,
		climbRate: 0.625,
		trunkKink: 0.108,
		treeSteps: 4,
		taperRate: 0.925,
		radiusFalloffRate: 0.66,
		twistRate: 2.7,
		trunkLength: 1.75
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

	console.log('tree:', tree)

	const vertices = new Float32Array(Tree.flattenArray(tree.verts))
	const normals = new Float32Array(Tree.flattenArray(tree.normals))
	const uvs = new Float32Array(Tree.flattenArray(tree.UV))
	const ids = new Uint32Array(Tree.flattenArray(tree.faces))

	const geo = new THREE.BufferGeometry()
	geo.addAttribute('position', new THREE.BufferAttribute(vertices, 3))
	geo.addAttribute('normal', new THREE.BufferAttribute(normals, 3, true))
	geo.addAttribute('uv', new THREE.BufferAttribute(uvs, 2))
	geo.setIndex(new THREE.BufferAttribute(ids, 1))
	return geo
}

function animate() {
	mesh.rotation.y = (Date.now() * 0.5 / 1000.0) % (Math.PI * 2.0)
	renderer.render(scene, camera)
	requestAnimationFrame(animate)
}

///////////////////////////////////////////////////////////
// Startup

init()
