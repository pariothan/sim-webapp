/// <reference lib="webworker" />

import { Simulation, SimulationConfig } from '../core/Simulation'

let simulation: Simulation | null = null
let isRunning = false
let animationId: number | null = null

const defaultConfig: SimulationConfig = {
  world: {
    width: 30,
    height: 20,
    landProbability: 0.25,
    islandBias: 0.45,
    smoothingPasses: 3
  },
  spreadProbability: 0.22,
  borrowProbability: 0.12,
  evolutionProbability: 0.05,
  splitProbability: 0.01
}

function gameLoop(): void {
  if (!simulation || !isRunning) return

  try {
    simulation.step()
    const state = simulation.getState()
    postMessage({ type: 'STATE_UPDATE', payload: state })
  } catch (error) {
    console.error('Simulation error:', error)
    postMessage({ type: 'ERROR', payload: error.message })
    isRunning = false
    return
  }

  animationId = setTimeout(gameLoop, 300) // 300ms between steps
}

function startSimulation(): void {
  if (isRunning) return
  isRunning = true
  gameLoop()
}

function stopSimulation(): void {
  isRunning = false
  if (animationId !== null) {
    clearTimeout(animationId)
    animationId = null
  }
}

addEventListener('message', (event) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'INIT':
        const config = { ...defaultConfig, ...payload }
        simulation = new Simulation(config)
        postMessage({ type: 'STATE_UPDATE', payload: simulation.getState() })
        startSimulation()
        break

      case 'START':
        startSimulation()
        break

      case 'STOP':
        stopSimulation()
        break

      case 'RESET':
        if (simulation) {
          simulation.reset()
          postMessage({ type: 'STATE_UPDATE', payload: simulation.getState() })
        }
        break

      case 'NEW_WORLD':
        if (simulation) {
          const config = { ...defaultConfig, ...payload }
          simulation = new Simulation(config)
          postMessage({ type: 'STATE_UPDATE', payload: simulation.getState() })
        }
        break

      case 'UPDATE_CONFIG':
        // For now, require reset to apply config changes
        if (simulation && payload) {
          const config = { ...defaultConfig, ...payload }
          simulation = new Simulation(config)
          postMessage({ type: 'STATE_UPDATE', payload: simulation.getState() })
        }
        break

      case 'GET_INSPECTOR_DATA':
        if (simulation) {
          // This would be handled by the renderer, not the worker
          postMessage({ type: 'INSPECTOR_DATA', payload: null })
        }
        break

      default:
        console.warn('Unknown message type:', type)
    }
  } catch (error) {
    console.error('Worker error:', error)
    postMessage({ type: 'ERROR', payload: error.message })
  }
})

// Initialize immediately
postMessage({ type: 'READY' })