"""
the node_gene is a neuron in the genome 
only genetic information is stored in this file 
"""

# to create seperate independent copy that wont affect the original one
from copy import deepcopy

class NodeGene:
    INPUT="INPUT"
    HIDDEN="HIDDEN"
    OUTPUT="OUTPUT"
    BIAS="BIAS"
  
    VALID_NODE_TYPES={
      INPUT,HIDDEN,OUTPUT,BIAS
    }
  
    def __init__(self,node_id: int,node_type: str,layer: float=0.0):
      if node_type not in self.VALID_NODE_TYPES:
        raise ValueError(f"Invalid node type: {node_type}")
      
      self.id = node_id
      self.type = node_type
      self.layer = layer
    
    def copy(self):
      return deepcopy(self)
    
    def __repr__(self):
      return (f"NodeGene("f"id={self.id},"f"type='{self.type}',"f"layer={self.layer}"f")" )

    # check equality of 2 nodes 
    def __eq__(self,other):
       # make sure check is with another NodeGene 
      if not isinstance(other,NodeGene):
        return False
      return self.id == other.id
    
    def __hash__(self):
      return hash(self.id)
