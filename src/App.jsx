import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import * as CANNON from 'cannon-es'
import './index.css'

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
    //   setIsMobile(window.innerWidth <= 768) // Adjust this breakpoint as needed
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#140b29]">
      {!isMobile && (
        <STLViewer 
          url="src/assets/3DBenchy.stl" 
          className="absolute inset-0 w-full h-full"
        />
      )}
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

function STLViewer({ url, className }) {
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

    // Cannon.js setup
    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)

    // Calculate the right side position (70% of screen width)
    const rightSideX = window.innerWidth * 0.7

    // Floor
    const floorShape = new CANNON.Plane()
    const floorBody = new CANNON.Body({ mass: 0 })
    floorBody.addShape(floorShape)
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    floorBody.position.set(rightSideX / 100, -5, 0) // Convert to Three.js units
    world.addBody(floorBody)

    // Floor mesh (invisible)
    const floorGeometry = new THREE.PlaneGeometry(100, 100)
    const floorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xcccccc, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0 // Make it completely transparent
    })
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
    floorMesh.rotation.x = Math.PI / 2
    floorMesh.position.copy(floorBody.position)
    scene.add(floorMesh)

    let mesh, body

    function resetObject() {
      if (body) {
        // Random rotation
        const randomQuaternion = new CANNON.Quaternion()
        randomQuaternion.setFromEuler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )
        body.quaternion.copy(randomQuaternion)

        // Reset position
        body.position.set(rightSideX / 100, 10, 0)
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)
      }
    }

    const loader = new STLLoader()
    loader.load(url, (geometry) => {
      const material = new THREE.MeshNormalMaterial()
      mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // Center and scale the model to a fixed size
      geometry.center()
      geometry.computeBoundingBox()
      const size = new THREE.Vector3()
      geometry.boundingBox.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxDim // Set the object to always be 2 units in its largest dimension
      mesh.scale.set(scale, scale, scale)

      // Create physics body
      const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1)) // Simplified to a 2x2x2 box
      body = new CANNON.Body({ 
        mass: 1,
        material: new CANNON.Material({ restitution: 0.8 }) // Make it bouncy
      })
      body.addShape(shape)
      world.addBody(body)

      resetObject() // Initial positioning and rotation

      // Adjust camera
      camera.position.set(rightSideX / 100, 5, 15)
      camera.lookAt(rightSideX / 100, 0, 0)
    })

    const animate = () => {
      requestAnimationFrame(animate)

      world.step(1 / 60)

      if (mesh && body) {
        mesh.position.copy(body.position)
        mesh.quaternion.copy(body.quaternion)

        // Reset position if it falls off the floor
        if (body.position.y < -10) {
          resetObject()
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const newRightSideX = window.innerWidth * 0.7
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      
      // Update positions
      if (body) body.position.x = newRightSideX / 100
      floorBody.position.x = newRightSideX / 100
      floorMesh.position.copy(floorBody.position)
      camera.position.set(newRightSideX / 100, 5, 15)
      camera.lookAt(newRightSideX / 100, 0, 0)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      mountRef.current.removeChild(renderer.domElement)
    }
  }, [url])

  return <div ref={mountRef} className={className} />
}

export default App

const socialLinks = [
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
          {link.url}
        </a>
      ))}
    </nav>
  );
}