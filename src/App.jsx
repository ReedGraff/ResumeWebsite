import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import * as CANNON from 'cannon-es'
import './index.css'
import { randInt } from 'three/src/math/MathUtils.js'

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768) // Adjust this breakpoint as needed
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#140b29]">
        <STLViewer 
          url="src/assets/3DBenchy.stl" 
          className="absolute inset-0 w-full h-full"
          isMobile={isMobile} // Pass isMobile as a prop
        />
        <main className="relative z-10 flex flex-col justify-between h-full p-8 text-white bg-transparent">
            <div>
                <h1 className="text-5xl font-bold max-md:text-4xl">Reed Graff</h1>
                <p className="mt-5 text-base">
                    I'm the CTO of Compliancy. We help roofers pull permits faster. and we're hiring!
                </p>
            </div>
            <SocialLinks />
        </main>
    </div>
  )
}

function STLViewer({ url, className, isMobile }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Three.js setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mountRef.current.appendChild(renderer.domElement)

    // Add this to the initial setup after creating the renderer
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const aspectRatio = windowWidth / windowHeight
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()

    let xPosition = (windowWidth * -0.7) / windowWidth * 10 // Scale xPosition to fit the scene
    if (isMobile) {
        xPosition = (windowWidth * 0) / windowWidth * 10 // Adjust xPosition for mobile
    }
    camera.lookAt(0, 0, 0)
    camera.position.set(xPosition, 0, 20)

    // Cannon.js setup
    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)

    // Floor
    const floorShape = new CANNON.Plane()
    const floorMaterial = new CANNON.Material({ restitution: 1.2 })
    const floorBody = new CANNON.Body({ mass: 0, material: floorMaterial })
    floorBody.addShape(floorShape)
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    floorBody.position.set(0, -5, 0)
    world.addBody(floorBody)

    let objects = []
    let objectCount = 0
    const maxObjects = randInt(1, 4)

    function createObject() {
      if (objectCount >= maxObjects) return

      const loader = new STLLoader()
      loader.load(url, (geometry) => {
        const material = new THREE.MeshNormalMaterial()
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // Center and scale the model to a fixed size
        geometry.center()
        geometry.computeBoundingBox()
        const size = new THREE.Vector3()
        geometry.boundingBox.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 10 / maxDim // Set the object to always be 2 units in its largest dimension
        mesh.scale.set(scale, scale, scale)

        // Create physics body
        const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1)) // Simplified to a 2x2x2 box
        const body = new CANNON.Body({ 
            mass: 1,
            material: new CANNON.Material({ restitution: 0.8 }) // Make it bouncy
        })
        body.addShape(shape)
        world.addBody(body)

        // Initial positioning and rotation
        const randomQuaternion = new CANNON.Quaternion()
        randomQuaternion.setFromEuler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )
        body.quaternion.copy(randomQuaternion)
        body.position.set(0, 10, 0)
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)

        objects.push({ mesh, body })
        objectCount++
      })
    }

    const intervalId = setInterval(() => {
      createObject()
      if (objectCount >= maxObjects) {
        clearInterval(intervalId)
      }
    }, 500)

    const fixedTimeStep = 1 / 60 // 60 fps
    let lastTime
    
    const animate = (time) => {
      requestAnimationFrame(animate)
    
      if (lastTime !== undefined) {
        const deltaTime = (time - lastTime) / 1000
        world.step(fixedTimeStep, deltaTime, 3)
      }
    
      objects.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position)
        mesh.quaternion.copy(body.quaternion)
      })
    
      renderer.render(scene, camera)
      lastTime = time
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      mountRef.current.removeChild(renderer.domElement)
      clearInterval(intervalId)
    }
  }, [url, isMobile])

  return <div ref={mountRef} className={className} />
}

export default App

const socialLinks = [
  { url: 'mailto:Rangergraff@gmail.com', label: 'Rangergraff@gmail.com' },
  { url: 'https://withcompliancy.com/', label: 'Company Website' },
  { url: 'https://www.linkedin.com/in/reedgraff/', label: 'LinkedIn Profile' },
  { url: 'https://github.com/ReedGraff', label: 'GitHub Profile' }
];

function SocialLinks() {
  return (
    <nav className="flex flex-col text-sm">
      {socialLinks.map((link, index) => (
        <a 
          key={index} 
          href={link.url} 
          className={`${index > 0 ? 'mt-3' : ''}`}
          target="_blank" 
          rel="noopener noreferrer"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}