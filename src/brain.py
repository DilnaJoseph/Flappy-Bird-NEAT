from browser import window, timer
import random

class Genome:
    def __init__(self):
        self.fitness = 0
        self.dead = False
        # Placeholder for NEAT weights
        self.weights = [random.uniform(-1, 1) for _ in range(5)] 

    def decide(self, inputs):
        # A very simple 'brain' placeholder
        # In a real NEAT, this would be a neural network calculation
        score = sum(i * w for i, w in zip(inputs, self.weights))
        return score > 0

class NEATPopulation:
    def __init__(self, size=50):
        self.generation = 1
        self.population = [Genome() for _ in range(size)]
        
    def get_alive_count(self):
        return len([g for g in self.population if not g.dead])

    def evolve(self):
        self.generation += 1
        # Reset population for next gen (Placeholder for actual Crossover/Mutation)
        for g in self.population:
            g.dead = False
            g.fitness = 0
        print(f"Evolving to Generation {self.generation}")

# Initialize the global population
ai_manager = NEATPopulation(50)

def ai_decision(data, bird_index):
    """Called by JS for each bird still alive"""
    genome = ai_manager.population[bird_index]
    
    # Inputs: Bird Y, Dist to Pipe, Gap Center, Gap Top, Gap Bottom
    inputs = [data.birdY, data.distToPipe, data.pipeCenter, data.velocity]
    
    if genome.decide(inputs):
        return True
    return False

# Export to JS Bridge
window.aiBridge.decide = ai_decision
window.aiBridge.getGen = lambda: ai_manager.generation
window.aiBridge.getAlive = lambda: ai_manager.get_alive_count()
window.aiBridge.nextGen = ai_manager.evolve