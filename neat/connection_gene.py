"""
Represents a connection between nodes. 
"""

from copy import deepcopy
import random

class ConnectionGene:
  def __init__(self,in_node: int,out_node: int,weight: float, innovation: int,enabled: bool = True):
    self.in_node = in_node
    self.out_node = out_node
    self.weight = weight
    self.innovation = innovation
    self.enabled = enabled

  def enable(self):
    self.enabled = True

  def disable(self):
    self.enabled = False

  def mutate_weight(self,perturb_chance: float = 0.9,perturb_strength: float = 0.5):
    if random.random()<perturb_chance:
      self.weight += random.uniform(-perturb_strength,perturb_strength)
    else :
      self.weight = random.uniform(-1, 1)

  def copy(self):
    return deepcopy(self)

  def __repr__(self):
     return (
            f"ConnectionGene("f"in={self.in_node},"f"out={self.out_node},"f"weight={self.weight:.4f},"f"innovation={self.innovation},"f"enabled={self.enabled}"f")")

  def __eq__(self,other):
    if not isinstance(other,ConnectionGene):
      return False

    return self.innovation == other.innovation 

  def __hash__(self):
    return hash(self.innovation)
