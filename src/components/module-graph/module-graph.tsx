"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react";
import ReactFlow, { Node, Edge, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { getModule, Module, Token } from "@/lib/api/megadata"
// @ts-expect-error: no types for dagre
import dagre from "dagre";

type ModuleGraphProps = {
  token: Token;
}

// Custom node components
function TokenNode({ data, selected, isFaded }: any) {
  return (
    <div
      className={`rounded-xl px-4 py-2 font-semibold shadow-md transition-all duration-300 border bg-[var(--card)] text-[var(--primary)] text-lg flex items-center justify-center font-playfair tracking-tight ${selected ? 'scale-105 z-10 ring-2 ring-[var(--accent)] shadow-lg' : ''
        } ${isFaded ? 'opacity-30 grayscale' : ''}`}
      style={{ borderColor: 'var(--border)', fontFamily: 'Playfair Display, serif' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'var(--primary)' }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--primary)' }} />
    </div>
  );
}
function ModuleNode({ data, selected, isFaded }: any) {
  return (
    <div
      className={`rounded-xl px-4 py-2 font-medium shadow-md transition-all duration-300 border bg-accent text-[var(--primary)] flex items-center justify-center font-radio tracking-tight ${selected ? 'scale-105 z-10 ring-2 ring-[var(--primary)] shadow-lg' : ''
        } ${isFaded ? 'opacity-30 grayscale' : ''}`}
      style={{ borderColor: 'var(--border)', fontFamily: 'Radio Canada, sans-serif' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'var(--primary)' }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--primary)' }} />
    </div>
  );
}
function AttributeNode({ data, selected, isFaded }: any) {
  return (
    <div
      className={`rounded-xl px-4 py-2 font-medium shadow-md transition-all duration-300 border bg-muted text-[var(--secondary-foreground)] flex items-center justify-center font-radio tracking-tight ${selected ? 'scale-105 z-10 ring-2 ring-[var(--accent)] shadow-lg' : ''
        } ${isFaded ? 'opacity-30 grayscale' : ''}`}
      style={{ borderColor: 'var(--border)', fontFamily: 'Radio Canada, sans-serif' }}
    >
      <Handle type="target" position={Position.Bottom} style={{ background: 'var(--accent)' }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent)' }} />
    </div>
  );
}

const nodeTypes = {
  token: TokenNode,
  module: ModuleNode,
  attribute: AttributeNode,
};


function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 160, height: 60 });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 80, // center node
        y: nodeWithPosition.y - 30,
      },
      // required for dagre + React Flow
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}

export default function ModuleGraph({ token }: ModuleGraphProps) {
  const [modules, setModules] = useState<Record<string, Module>>({});
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      const foundModules: Record<string, Module> = {};
      for (const moduleId of token.modules) {
        const module = await getModule(moduleId);
        foundModules[moduleId] = module;
      }
      setModules(foundModules);
      setLoading(false);
    }
    fetchModules();
  }, [token]);

  // Map: property -> modules that use it
  const propertyModuleMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(modules).forEach(([moduleId, module]) => {
      const schemaFields = Object.keys(module.schema?.properties || {});
      schemaFields.forEach((field) => {
        if (field in token.data) {
          if (!map[field]) map[field] = [];
          map[field].push(moduleId);
        }
      });
    });
    return map;
  }, [modules, token.data]);

  const usedProperties = Object.keys(propertyModuleMap);
  const moduleIds = Object.keys(modules);

  // Prepare nodes and edges for React Flow
  const nodes: Node[] = useMemo(() => {
    const tokenNode: Node = {
      id: "token",
      type: "token",
      data: { label: token.data.name || token.id || "Token" },
      position: { x: 0, y: 0 },
    };
    const moduleNodes: Node[] = moduleIds.map((moduleId) => ({
      id: moduleId,
      type: "module",
      data: { label: modules[moduleId].name },
      position: { x: 0, y: 0 },
    }));
    const propertyNodes: Node[] = usedProperties.map((prop) => ({
      id: `property-${prop}`,
      type: "attribute",
      data: { label: prop },
      position: { x: 0, y: 0 },
    }));
    return [tokenNode, ...moduleNodes, ...propertyNodes];
  }, [modules, token, usedProperties, moduleIds]);

  const edges: Edge[] = useMemo(() => {
    const propertyToModule: Edge[] = usedProperties.flatMap((prop) =>
      propertyModuleMap[prop].map((moduleId) => ({
        id: `property-${prop}-module-${moduleId}`,
        source: `property-${prop}`,
        target: moduleId,
        type: "smoothstep",
        sourcePosition: "top",
        targetPosition: "bottom",
        style: { stroke: "#2A4A59", strokeWidth: 2 },
        data: { kind: 'propertyToModule' },
      }))
    );
    const moduleToToken: Edge[] = moduleIds.map((moduleId) => ({
      id: `module-${moduleId}-token`,
      source: moduleId,
      target: "token",
      type: "smoothstep",
      sourcePosition: "top",
      targetPosition: "bottom",
      style: { stroke: "#2A4A59", strokeDasharray: "4 2", strokeWidth: 2 },
      data: { kind: 'moduleToToken' },
    }));
    return [...propertyToModule, ...moduleToToken];
  }, [usedProperties, propertyModuleMap, moduleIds]);

  // Use dagre for layout
  const layoutedNodes = useMemo(() => getLayoutedElements(nodes, edges), [nodes, edges]);

  // Interactivity: highlight/fade logic
  const connectedNodeIds = useMemo(() => {
    if (!activeNode) return new Set();
    const connected = new Set([activeNode]);
    edges.forEach((edge) => {
      if (edge.source === activeNode) connected.add(edge.target);
      if (edge.target === activeNode) connected.add(edge.source);
    });
    return connected;
  }, [activeNode, edges]);

  const connectedEdgeIds = useMemo(() => {
    if (!activeNode) return new Set();
    const connected = new Set();
    edges.forEach((edge) => {
      if (edge.source === activeNode || edge.target === activeNode) connected.add(edge.id);
    });
    return connected;
  }, [activeNode, edges]);

  // Custom node/edge props for highlight/fade
  const styledNodes = layoutedNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      selected: activeNode === node.id,
      isFaded: activeNode && !connectedNodeIds.has(node.id),
    },
  }));
  const styledEdges = edges.map((edge) => {
    const isHighlighted = activeNode && connectedEdgeIds.has(edge.id);
    return {
      ...edge,
      style: {
        ...edge.style,
        stroke: edge.data?.kind === 'moduleToToken'
          ? isHighlighted ? 'var(--primary)' : 'var(--accent)'
          : isHighlighted ? 'var(--accent-foreground)' : 'var(--accent)',
        strokeWidth: isHighlighted ? 2.5 : 1.2,
        opacity: !activeNode || connectedEdgeIds.has(edge.id) ? 1 : 0.15,
        transition: 'all 0.3s',
      },
    };
  });

  // Handlers
  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => setActiveNode(node.id), []);
  const onNodeMouseLeave = useCallback(() => setActiveNode(null), []);
  const onPaneClick = useCallback(() => setActiveNode(null), []);

  return (
    <div className="w-full h-[600px] rounded-2xl p-6 relative overflow-hidden">
      {loading ? (
        <div className="text-center text-gray-400">Loading modules...</div>
      ) : (
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          fitView
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onPaneClick={onPaneClick}
          proOptions={{ hideAttribution: true }}
          zoomOnScroll
        >
        </ReactFlow>
      )}
    </div>
  );
}