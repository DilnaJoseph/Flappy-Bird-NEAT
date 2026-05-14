"""
Tracks global innovation numbers
"""

class InnovationTracker:
  def __init__(self):
    self.current_innovation = 0
    self.history = {}

  def get_innovation(self,in_node: int,out_node: int):
    connection = (in_node,out_node)
    if connection in self.history:
      return self.history[connection]

    self.current_innovation += 1
    self.history[connection] = self.current_innovation
    return self.current_innovation

  def reset(self):
    self.current_innovation = 0
    self.history.clear()

  def __repr__(self):
    return(f"InnovationTracker("f"current_innovation={self.current_innovation},"f"tracked_connections={len(self.history)}"f")")
    
