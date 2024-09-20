import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import pondVertexShader from './shaders/pond/vertex.glsl'
import pondFragmentShader from './shaders/pond/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/* Textures */
const bakedTexture = textureLoader.load('new-baked.jpg')
bakedTexture

/* Materials*/
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

// Window light material
const windowLightMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' })

// Pond material
debugObject.pondColorStart = '#1af0ff'
debugObject.pondColorEnd = '#16dbe9'
const pondMaterial = new THREE.ShaderMaterial({
    uniforms: 
    {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.pondColorStart) },
        uColorEnd: { value: new THREE.Color(debugObject.pondColorEnd) }
    },
    vertexShader: pondVertexShader,
    fragmentShader: pondFragmentShader
})

gui
    .addColor(debugObject, 'pondColorStart')
    .onChange(() =>
    {
        pondMaterial.uniforms.uColorStart.value.set(debugObject.pondColorStart)
    })
gui
    .addColor(debugObject, 'pondColorEnd')
    .onChange(() =>
    {
        pondMaterial.uniforms.uColorEnd.value.set(debugObject.pondColorEnd)
    })

/* Model */
gltfLoader.load(
    'school.glb',
    (gltf) =>
    {
        const schoolMesh = gltf.scene.children.find(child => child.name === 'school-scene')
        const windowsDownMesh = gltf.scene.children.find(child => child.name === 'school-windows')
        const windowsUpMesh = gltf.scene.children.find(child => child.name === 'school-windows-up')
        const pondMesh = gltf.scene.children.find(child => child.name === 'pond')
        
        schoolMesh.material = bakedMaterial
        windowsDownMesh.material = windowLightMaterial
        windowsUpMesh.material = windowLightMaterial
        pondMesh.material = pondMaterial

        scene.add(gltf.scene)
    }
)

/* Fireflies */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)

const scaleArray = new Float32Array(firefliesCount)

for(let i = 0; i < firefliesCount; i++)
{
    scaleArray[i] = Math.random()
    
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = (Math.random() * 0.5) * 4
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial({ 
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: 
    {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 30 },
        uTime: { value: 0 }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('firefliesSize')

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)

    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Background color
debugObject.backgroundColor = '#9ae4d5'
renderer.setClearColor(debugObject.backgroundColor)
gui
    .addColor(debugObject, 'backgroundColor')
    .onChange(() =>
    {
        renderer.setClearColor(debugObject.backgroundColor)
    })

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update materials
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    pondMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()