import create from 'zustand';

export const useWorkflowStore = create((set, get) => ({
  currentWorkflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isDirty: false,

  setWorkflow: (workflow) => {
    set({
      currentWorkflow: workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNode: null,
      isDirty: false,
    });
  },

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  setSelectedNode: (node) => set({ selectedNode: node }),

  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const updated = {
            ...node,
            data: {
              ...node.data,
              ...newData,
              config: {
                ...(node.data?.config || {}),
                ...(newData?.config || {}),
              },
            },
          };
          return updated;
        }
        return node;
      }),
      selectedNode: state.selectedNode && state.selectedNode.id === nodeId
        ? {
            ...state.selectedNode,
            data: {
              ...state.selectedNode.data,
              ...newData,
              config: {
                ...(state.selectedNode.data?.config || {}),
                ...(newData?.config || {}),
              },
            },
          }
        : state.selectedNode,
      isDirty: true,
    }));
  },

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
      isDirty: true,
      selectedNode: node,
    }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true,
    }));
  },

  reset: () => set({ currentWorkflow: null, nodes: [], edges: [], selectedNode: null, isDirty: false }),
}));
