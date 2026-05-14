import random

class Genome:
    def __init__(self, genome_id):
        self.id = genome_id
        self.nodes = {}          # Key: node_id, Value: NodeGene object
        self.connections = {}    # Key: innovation_number, Value: ConnectionGene object
        self.fitness = 0
        self.species_id = None

    def copy(self):
        """Returns a deep copy of the genome for mutations/crossover."""
        new_genome = Genome(self.id)
        for node_id, node in self.nodes.items():
            new_genome.nodes[node_id] = node.copy()
        for innov, conn in self.connections.items():
            new_genome.connections[innov] = conn.copy()
        new_genome.fitness = self.fitness
        return new_genome