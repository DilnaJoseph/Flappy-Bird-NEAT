import random 

def roulette_selection(species):
  total_fitness = sum(
    genome.fitness
    for genome in species.members
  )

  if total_fitness == 0:
    return random.choice(species.members)

  pick = random.uniform(0,total_fitness)
  current = 0
  for genome in species.members:
     current += genome.fitness
     if current >= pick:
       return genome
  return species.members[-1]

def tournament_selection(species,tournament_size = 3):
  tournament = random.sample(species.members,min(tournament_size,len(species.members)))
  tournament.sort(key=lambda genome: genome.fitness,reverse=True)
  return tournament[0]

def elitism_selection(species, elite_size=1):
  sorted_members = sorted(species.members,key=lambda genome: genome.fitness,reverse=True)
  return sorted_members[:elite_size]
