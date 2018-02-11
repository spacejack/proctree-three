/// <reference path="./typings/three-global.d.ts"/>
import {Tree, createTree} from './lib/tree'

let camera: THREE.Camera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let obj: THREE.Object3D

function init() {
	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	scene = new THREE.Scene()

	const light = new THREE.DirectionalLight(0xFFFFFF, 1.0)
	light.position.copy(new THREE.Vector3(0.5, 1.0, 0.5).normalize())
	scene.add(light)

	const ambient = new THREE.AmbientLight(0x222222, 1.0)
	scene.add(ambient)

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1.0, 1000.0)
	camera.position.z = 8.5
	scene.add(camera)

	const tree = createTree({
		seed: Math.round(Math.random() * 10000),
		segments: 10,
		levels: 5,
		vMultiplier: 0.66,
		twigScale: 0.47,
		initialBranchLength: 0.5,
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

	console.log('tree:', tree)

	obj = new THREE.Object3D()

	const barkTex = new THREE.TextureLoader().load('tex/bark.jpg', () => {
		barkTex.wrapS = barkTex.wrapT = THREE.RepeatWrapping
		const treeMesh = new THREE.Mesh(
			makeTreeGeo(tree),
			new THREE.MeshLambertMaterial({color: 0xFFFFFF, map: barkTex})
		)
		obj.add(treeMesh)

		const twigTex = new THREE.TextureLoader().load('tex/twig.png', () => {
			const twigMesh = new THREE.Mesh(
				makeTwigGeo(tree),
				new THREE.MeshLambertMaterial({
					color: 0xFFFFFF, map: twigTex, transparent: true, alphaTest: 0.5
				})
			)
			obj.add(twigMesh)

			obj.position.y = -3.25
			scene.add(obj)

			animate()
		})
	})
}

function makeTreeGeo(tree: Tree) {
	const geo = new THREE.BufferGeometry()
	geo.addAttribute('position', new THREE.BufferAttribute(tree.position, 3))
	geo.addAttribute('normal', new THREE.BufferAttribute(tree.normal, 3, true))
	geo.addAttribute('uv', new THREE.BufferAttribute(tree.uv, 2))
	geo.setIndex(new THREE.BufferAttribute(tree.id, 1))
	return geo
}

function makeTwigGeo(tree: Tree) {
	const geo = new THREE.BufferGeometry()
	geo.addAttribute('position', new THREE.BufferAttribute(tree.twigPosition, 3))
	geo.addAttribute('normal', new THREE.BufferAttribute(tree.twigNormal, 3, true))
	geo.addAttribute('uv', new THREE.BufferAttribute(tree.twigUv, 2))
	geo.setIndex(new THREE.BufferAttribute(tree.twigId, 1))
	return geo
}

/** Animation loop */
function animate() {
	obj.rotation.y = (Date.now() * 0.5 / 1000.0) % (Math.PI * 2.0)
	renderer.render(scene, camera)
	requestAnimationFrame(animate)
}

///////////////////////////////////////////////////////////
// Startup

init()
