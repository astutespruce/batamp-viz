################################################################################
### Adapted from https://github.com/astutespruce/sarp-connectivity/blob/main/analysis/lib/graph/speedups/directedgraph.py
### Copyright 2024, Astute Spruce, LLC
################################################################################

from numba import types
from numba import njit
from numba.typed import List
import numpy as np


@njit("(i8[:],i8[:])", cache=True)
def make_adj_matrix(source, target):
    # NOTE: drop dups first before calling this!
    out = dict()
    for i in range(len(source)):
        key = source[i]

        # ideally, we would use a set to deduplicate targets on input instead
        # of in advance, but that is not supported by numba
        if key not in out:
            out[key] = List.empty_list(types.int64)
        out[key].append(target[i])
    return out


@njit(cache=True)
def descendants(adj_matrix, root_ids):
    out = []
    for i in range(len(root_ids)):
        node = root_ids[i]
        collected = set()  # per root node
        if node in adj_matrix:
            next_nodes = set(adj_matrix[node])
            while next_nodes:
                nodes = next_nodes
                next_nodes = set()
                for next_node in nodes:
                    if next_node not in collected:
                        collected.add(next_node)
                        if next_node in adj_matrix:
                            next_nodes.update(adj_matrix[next_node])
        out.append(collected)
    return out


@njit
def flat_components(adj_matrix):
    """Extract connected components and return as a tuple of group indexes and values"""
    groups = List.empty_list(types.int64)
    values = List.empty_list(types.int64)
    seen = set()
    group = 0
    for node in adj_matrix.keys():
        if node not in seen:
            # add current node with all descendants
            adj_nodes = {node} | descendants(adj_matrix, [node])[0]
            seen.update(adj_nodes)
            groups.extend([group] * len(adj_nodes))
            values.extend(adj_nodes)
            group += 1

    return np.asarray(groups), np.asarray(values)


class DirectedGraph(object):
    def __init__(self, source, target):
        """Create DirectedGraph from source and target ndarrays.

        source and target must be the same length

        Parameters
        ----------
        df : DataFrame,
        source : ndarray(int64)
        target : ndarray(int64)
        """

        self.adj_matrix = make_adj_matrix(source, target)
        self._size = len(self.adj_matrix)

    def __len__(self):
        return self._size

    def flat_components(self):
        return flat_components(self.adj_matrix)

    def descendants(self, sources):
        return descendants(self.adj_matrix, sources)
