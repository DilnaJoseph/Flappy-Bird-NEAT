"""
helps form species 
"""

from crossover import crossover
from mutation import mutate
from selection import tournament_selection

class Species:
  def __init__(self,representative):
    self.representative = representative
    self.members = []
    self.best_fitness=0
    self.average_fitness=0
    self.staleness=0

  def add_member(self,genome):
    self.members.append(genome)

  def calculate_average_fitness(self):
    if not self.members:
      self.average_fitness = 0
      return 0
    total_fitness = sum(
      genome.fitness
      for genome in self.members
    )
    self.average_fitness=(total_fitness/len(self.members))
    return self.average_fitness

  def sort_members(self):
    self.members.sort(
        key=lambda genome: genome.fitness,
        reverse=True
    )
    if self.members:
      best_genome = self.members[0]
      if best_genome.fitness > self.best_fitness:
        self.best_fitness = best_genome.fitness
        self.staleness = 0
      else: 
        self.staleness += 1

  def cull(self,survival_threshold=0.5):
      if len(self.members)<=2:
        return
      self.sort_members()
      survivors = max(1,int(len(self.members)*survival_threshold))
      self.members = self.members[:survivors]

  def breed_child(self,innovation_tracker):
      if len(self.members)==1:
        child = self.members[0].copy()
      else:
        parent1 = tournament_selection(self)
        parent2 = tournament_selection(self)
        if parent2.fitness>parent1.fitness:
          parent1,parent2 = parent2,parent1
        child = crossover(parent1,parent2)
      mutate(child,innovation_tracker)
      return child
    
  def reset(self):
      if self.members:
        self.representative = self.members[0]
      self.members = []

  def __len__(self):
      return len(self.members)

  def __repr__(self):
      return( f"Species("f"members={len(self.members)}, "f"best_fitness={self.best_fitness}, "f"average_fitness={self.average_fitness:.4f}, "f"staleness={self.staleness}"f")")
     
