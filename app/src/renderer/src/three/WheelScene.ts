import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const RIM_COLOR = 0xf4a259
const TYRE_COLOR = 0x26282b
const SWAP_FADE_MS = 180

function contactShadowTexture(): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.22)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function gridTexture(): THREE.Texture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cell = 32
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  for (let i = 0; i <= size; i += cell) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }
  // radial fade mask via destination-in
  const mask = document.createElement('canvas')
  mask.width = size
  mask.height = size
  const mctx = mask.getContext('2d')!
  const gradient = mctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  mctx.fillStyle = gradient
  mctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(mask, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export type ViewportMode = 'assembled' | 'exploded'

export class WheelScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private loader = new STLLoader()

  private innerGroup = new THREE.Group() // holds rim+tyre in native STL space
  private outerGroup = new THREE.Group() // rotates+centers innerGroup for the hero framing
  private rimMeshes: THREE.Mesh[] = [] // one (single-piece) or two (split_rim halves)
  private tyreMesh: THREE.Mesh | null = null
  private rimMaterial: THREE.MeshStandardMaterial
  private tyreMaterial: THREE.MeshStandardMaterial

  private clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private mode: ViewportMode = 'assembled'
  private sectionOn = false
  private wireframeOn = false
  private explodeOffset = 0

  private raf = 0
  private disposed = false

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.localClippingEnabled = true
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(36, 1, 1, 5000)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 20
    this.controls.maxDistance = 2000

    this.rimMaterial = new THREE.MeshStandardMaterial({
      color: RIM_COLOR,
      roughness: 0.55,
      metalness: 0,
      clippingPlanes: [this.clipPlane]
    })
    this.tyreMaterial = new THREE.MeshStandardMaterial({
      color: TYRE_COLOR,
      roughness: 0.8,
      metalness: 0,
      clippingPlanes: [this.clipPlane]
    })

    this.outerGroup.add(this.innerGroup)
    this.scene.add(this.outerGroup)
    this.setupLighting()
    this.setupGround()

    this.resize()
    window.addEventListener('resize', this.resize)
    this.tick()
  }

  private setupLighting(): void {
    const key = new THREE.DirectionalLight(0xffffff, 1.5)
    key.position.set(-6, 9, 7)
    this.scene.add(key)

    const fill = new THREE.AmbientLight(0x8f99a6, 0.55)
    this.scene.add(fill)

    const rimLight = new THREE.DirectionalLight(0xaab4c0, 0.7)
    rimLight.position.set(3, 4, -8)
    this.scene.add(rimLight)
  }

  private groundY = 0

  private setupGround(): void {
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({
        map: gridTexture(),
        transparent: true,
        depthWrite: false
      })
    )
    grid.rotation.x = -Math.PI / 2
    grid.renderOrder = -2
    this.scene.add(grid)

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture(),
        transparent: true,
        depthWrite: false
      })
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.05
    shadow.renderOrder = -1
    this.scene.add(shadow)

    this.groundMesh = grid
    this.shadowMesh = shadow
  }

  private groundMesh: THREE.Mesh | null = null
  private shadowMesh: THREE.Mesh | null = null

  resize = (): void => {
    const { clientWidth, clientHeight } = this.container
    if (clientWidth === 0 || clientHeight === 0) return
    this.renderer.setSize(clientWidth, clientHeight)
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
  }

  private tick = (): void => {
    if (this.disposed) return
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.tick)
  }

  async loadMeshes(rimBytesList: ArrayBuffer[], tyreBytes: ArrayBuffer): Promise<void> {
    const rimGeoms = rimBytesList.map((bytes) => {
      const geom = this.loader.parse(bytes)
      geom.computeVertexNormals()
      return geom
    })
    const tyreGeom = this.loader.parse(tyreBytes)
    tyreGeom.computeVertexNormals()

    const wasFirstLoad = this.rimMeshes.length === 0

    for (const mesh of this.rimMeshes) {
      this.innerGroup.remove(mesh)
      mesh.geometry.dispose()
    }
    if (this.tyreMesh) this.innerGroup.remove(this.tyreMesh)
    this.tyreMesh?.geometry.dispose()

    this.rimMeshes = rimGeoms.map((geom) => {
      const mesh = new THREE.Mesh(geom, this.rimMaterial)
      mesh.castShadow = true
      return mesh
    })
    this.tyreMesh = new THREE.Mesh(tyreGeom, this.tyreMaterial)
    this.tyreMesh.castShadow = true
    this.innerGroup.add(...this.rimMeshes, this.tyreMesh)

    // width of the part (STL local Z span) drives the explode distance
    const box = new THREE.Box3().setFromObject(this.innerGroup)
    const zSpan = box.max.z - box.min.z
    this.explodeOffset = zSpan * 0.9
    this.applyMode()

    this.frameAndCenter(wasFirstLoad)
    this.fadeIn(this.rimMaterial)
    this.fadeIn(this.tyreMaterial)
  }

  private fadeIn(material: THREE.MeshStandardMaterial): void {
    material.transparent = true
    material.opacity = 0
    const start = performance.now()
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / SWAP_FADE_MS)
      material.opacity = t
      if (t < 1) requestAnimationFrame(step)
      else material.transparent = false
    }
    requestAnimationFrame(step)
  }

  private frameAndCenter(recomputeCamera: boolean): void {
    // Rotate STL's Z (axle) axis to world X so the wheel is viewed face-on
    // with the axle running horizontally, then center + fit the camera.
    this.innerGroup.rotation.set(0, 0, 0)
    this.innerGroup.position.set(0, 0, 0)
    this.outerGroup.rotation.set(0, -Math.PI / 2, 0)

    const box = new THREE.Box3().setFromObject(this.outerGroup)
    const center = box.getCenter(new THREE.Vector3())
    this.outerGroup.position.sub(center)

    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z) / 2

    this.groundY = -size.y / 2 - 0.5
    if (this.groundMesh) this.groundMesh.position.y = this.groundY
    if (this.shadowMesh) this.shadowMesh.position.y = this.groundY + 0.05

    if (recomputeCamera) {
      const fitDistance = (radius * 1.55) / Math.sin((this.camera.fov * Math.PI) / 360)
      this.camera.position.set(fitDistance * 0.32, fitDistance * 0.28, fitDistance * 0.92)
      this.controls.target.set(0, 0, 0)
      this.controls.update()
    }
  }

  setMode(mode: ViewportMode): void {
    this.mode = mode
    this.applyMode()
  }

  private applyMode(): void {
    if (this.rimMeshes.length === 0 || !this.tyreMesh) return
    const half = this.mode === 'exploded' ? this.explodeOffset / 2 : 0
    if (this.rimMeshes.length === 2) {
      // pull the split halves apart from their shared parting line; the
      // tyre (which wraps both) stays put as a visual anchor
      this.rimMeshes[0].position.z = -half
      this.rimMeshes[1].position.z = half
      this.tyreMesh.position.z = 0
    } else {
      this.rimMeshes[0].position.z = -half
      this.tyreMesh.position.z = half
    }
  }

  setSection(on: boolean): void {
    this.sectionOn = on
    this.clipPlane.constant = on ? 0 : Number.POSITIVE_INFINITY
  }

  setWireframe(on: boolean): void {
    this.wireframeOn = on
    this.rimMaterial.wireframe = on
    this.tyreMaterial.wireframe = on
  }

  getState(): { section: boolean; wireframe: boolean; mode: ViewportMode } {
    return { section: this.sectionOn, wireframe: this.wireframeOn, mode: this.mode }
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    this.controls.dispose()
    for (const mesh of this.rimMeshes) mesh.geometry.dispose()
    this.tyreMesh?.geometry.dispose()
    this.rimMaterial.dispose()
    this.tyreMaterial.dispose()
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}
