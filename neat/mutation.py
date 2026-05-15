import random 
from node_gene import NodeGene 
from connection_gene import ConnectionGene

def mutate_weights(genome):
  for connection in genome.connections.values():
    connection.mutate_weight()

def add_connection_mutation(genome,innovation_tracker):
  nodes = list(genome.nodes.values())
  if len(nodes)<2:
    return 
  max_attempts = 100
  for _ in range(max_attempts):
    node1 = random.choice(nodes)
    node2 = random.choice(nodes)

    if node1.id ==node2.id:
      continue

    if node1.layer >= node2.layer:
      continue

    exists = False 

    for connection in genome.connections.values():
      if(connection.in_node == node1.id and connection.out_node == node2.id):
        exists = True 
        break

    if exists:
      continue

    innovation = innovation_tracker.get_innovation(node1.id,node2.id)

    new_connection = ConnectionGene(in_node = node1.id,out_node = node2.id,
                                    weight = random.uniform(-1,1),innovation = innovation)

    genome.connections[innovation] = new_connection 
    return 

def add_node_mutation(genome,innovation_tracker):
  enabled_connections = [
      connection
      for connection in genome.connections.values()
      if connection.enabled
  ]
  if not enabled_connections:
    return 

  old_connection = random.choice(enabled_connections)
  old_connection.disable()
  new_node_id = max(genome.nodes.keys())+1
  
  in_node = genome.nodes[old_connection.in_node]
  out_node = genome.nodes[old_connection.out_node]
  new_layer = (in_node.layer+out_node.layer)/2
  new_node = NodeGene(node_id = new_node_id,node_type = NodeGene.HIDDEN,layer = new_layer)
  genome.nodes[new_node_id] = new_node
  
  innovation1 = innovation_tracker.get_innovation(in_node.id,new_node_id)
  connection1 = ConnectionGene(in_node = in_node.id,out_node = new_node_id,weight = 1.0,innovation = innovation1)
  innovation2 = innovation_tracker.get_innovation(new_node.id,out_node.id)
  connection2 = ConnectionGene(in_node = new_node.id,out_node = out_node.id,weight =old_connection.weight,innovation = innovation2)
  
  genome.connections[innovation1] = connection1
  genome.connections[innovation2] = connection2

def mutate(genome,innovation_tracker,weight_mutation_rate=0.8,add_connection_rate=0.05,add_node_rate=0.03):
  if random.random()<weight_mutation_rate:
    mutate_weights(genome)
  if random.random()<add_connection_rate:
    add_connection_mutation(genome,innovation_tracker)
  if random.random()<add_node_rate:
    add_node_mutation(genome,innovation_tracker)
  
