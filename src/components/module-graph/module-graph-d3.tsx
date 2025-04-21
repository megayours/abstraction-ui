"use client"

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getModule, Module, Token } from "@/lib/api/megadata";

type ModuleGraphProps = {
  token: Token | null;
};

// Node types for D3
interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  type: "token" | "module" | "attribute" | "value";
  label: string;
  fx?: number | null;
  fy?: number | null;
}
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  kind: "propertyToModule" | "moduleToToken" | "valueToAttribute";
}

const NODE_COLORS: Record<string, string> = {
  token: "#2A4A59",
  module: "#AAC4E7",
  attribute: "#C7B29A",
  value: "#E9D973",
};

export default function ModuleGraphD3({ token }: ModuleGraphProps) {
  const [modules, setModules] = useState<Record<string, Module>>({});
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const modalSvgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 700, height: 500 });
  
  // Add state for filtering and visualization options
  const [showValueNodes, setShowValueNodes] = useState(false);
  const [showAttributeNodes, setShowAttributeNodes] = useState(false); // New state for attribute nodes
  const [nodeScale, setNodeScale] = useState(1); // Scale factor for node sizes
  const [labelSize, setLabelSize] = useState(1); // Scale factor for label sizes
  const [showAllLabels, setShowAllLabels] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDimensions, setModalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Function to open modal
  const openModal = () => {
    setIsModalOpen(true);
    // When opening modal, always show values and all labels
    setShowValueNodes(true);
    setShowAttributeNodes(true); // Show attribute nodes in modal
    setShowAllLabels(true);
    
    // Set modal dimensions based on window size
    setModalDimensions({
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.9
    });
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset to previous state when closing
    setShowValueNodes(false);
    setShowAttributeNodes(false); // Hide attribute nodes when closing modal
    setShowAllLabels(false);
  };

  // Resize observer for responsive SVG
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new window.ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    setDimensions({
      width: containerRef.current.offsetWidth || 700,
      height: containerRef.current.offsetHeight || 500,
    });
    return () => observer.disconnect();
  }, []);

  // Window resize handler for modal
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleResize = () => {
      setModalDimensions({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.9
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isModalOpen]);

  // Fetch modules
  useEffect(() => {
    if (!token) return;
    const fetchModules = async () => {
      setLoading(true);
      const foundModules: Record<string, Module> = {};
      for (const moduleId of token.modules) {
        const module = await getModule(moduleId);
        foundModules[moduleId] = module;
      }
      setModules(foundModules);
      setLoading(false);
    };
    fetchModules();
  }, [token]);

  // Ensure SVG rendering happens after container is properly sized
  useEffect(() => {
    if (containerRef.current && !isModalOpen && !loading) {
      // Force re-render when container dimensions change
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    }
  }, [containerRef.current, isModalOpen, loading]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Prepare nodes and links
  const { nodes, links, moduleToAttributes, attributeLinks } = React.useMemo(() => {
    if (!token) return { nodes: [], links: [], moduleToAttributes: {}, attributeLinks: [] };
    const moduleIds = Object.keys(modules);
    const propertyModuleMap: Record<string, string[]> = {};
    Object.entries(modules).forEach(([moduleId, module]) => {
      const schemaFields = Object.keys(module.schema?.properties || {});
      schemaFields.forEach((field) => {
        if (field in token.data) {
          if (!propertyModuleMap[field]) propertyModuleMap[field] = [];
          propertyModuleMap[field].push(moduleId);
        }
      });
    });
    const usedProperties = Object.keys(propertyModuleMap);
    // Map moduleId -> attribute keys
    const moduleToAttributes: Record<string, string[]> = {};
    moduleIds.forEach((moduleId) => {
      moduleToAttributes[moduleId] = usedProperties.filter((prop) => propertyModuleMap[prop].includes(moduleId));
    });

    // Helper to create value nodes and links recursively
    type ValueNodeResult = { nodes: D3Node[]; links: D3Link[] };
    function createValueNodes(
      prop: string,
      value: any,
      parentId: string
    ): ValueNodeResult {
      const results: ValueNodeResult = { nodes: [], links: [] };
      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          const nodeId = `value-${prop}-${idx}`;
          if (typeof item === "object" && item !== null) {
            // Recursively handle nested objects/arrays
            const sub = createValueNodes(`${prop}[${idx}]`, item, parentId);
            results.nodes.push(...sub.nodes);
            results.links.push(...sub.links);
          } else {
            results.nodes.push({
              id: nodeId,
              type: "value",
              label: String(item),
            });
            results.links.push({
              source: nodeId,
              target: parentId,
              kind: "valueToAttribute",
            });
          }
        });
      } else if (typeof value === "object" && value !== null) {
        // Serialize object for label (compact preview)
        const label = JSON.stringify(value, null, 0).slice(0, 60) + (JSON.stringify(value).length > 60 ? "..." : "");
        const nodeId = `value-${prop}-obj`;
        results.nodes.push({
          id: nodeId,
          type: "value",
          label,
        });
        results.links.push({
          source: nodeId,
          target: parentId,
          kind: "valueToAttribute",
        });
        // Optionally, recursively add sub-nodes for each key
        Object.entries(value).forEach(([k, v]) => {
          if (typeof v === "object" && v !== null) {
            const sub = createValueNodes(`${prop}.${k}`, v, nodeId);
            results.nodes.push(...sub.nodes);
            results.links.push(...sub.links);
          }
        });
      } else {
        // Primitive value
        const nodeId = `value-${prop}`;
        results.nodes.push({
          id: nodeId,
          type: "value",
          label: String(value),
        });
        results.links.push({
          source: nodeId,
          target: parentId,
          kind: "valueToAttribute",
        });
      }
      return results;
    }

    // Value nodes and links for all used properties
    let valueNodes: D3Node[] = [];
    let valueLinks: D3Link[] = [];
    
    // Only include value nodes if explicitly enabled or if modal is open
    if (showValueNodes || isModalOpen) {
      usedProperties.forEach((prop) => {
        const { nodes, links } = createValueNodes(prop, token.data[prop], `property-${prop}`);
        valueNodes.push(...nodes);
        valueLinks.push(...links);
      });
    }

    // Create base nodes array - always include token and module nodes
    const d3nodes: D3Node[] = [
      {
        id: "token",
        type: "token",
        label: token.data.name || token.id || "Token",
      },
      ...moduleIds.map((moduleId) => ({
        id: moduleId,
        type: "module" as const,
        label: modules[moduleId].name,
      }))
    ];
    
    // Only include attribute nodes if explicitly enabled or if modal is open
    if (showAttributeNodes || isModalOpen) {
      d3nodes.push(
        ...usedProperties.map((prop) => ({
          id: `property-${prop}`,
          type: "attribute" as const,
          label: prop,
        }))
      );
    }
    
    // Add value nodes if enabled
    d3nodes.push(...valueNodes);
    
    // Create base links array - always include module to token links
    const d3links: D3Link[] = [
      // Module -> Token
      ...moduleIds.map((moduleId) => ({
        source: moduleId,
        target: "token",
        kind: "moduleToToken" as const,
      }))
    ];
    
    // Only include attribute links if attributes are enabled
    if (showAttributeNodes || isModalOpen) {
      // Attribute -> Module
      d3links.push(
        ...usedProperties.flatMap((prop) =>
          propertyModuleMap[prop].map((moduleId) => ({
            source: `property-${prop}`,
            target: moduleId,
            kind: "propertyToModule" as const,
          }))
        )
      );
    }
    
    // Add value links if values are enabled
    if (showValueNodes || isModalOpen) {
      d3links.push(...valueLinks);
    }
    
    // Attribute links for forceLink (for D3 simulation)
    const attributeLinks: { source: string; target: string }[] = [];
    
    // Only include attribute links for force simulation if attributes are enabled
    if (showAttributeNodes || isModalOpen) {
      moduleIds.forEach((moduleId) => {
        (moduleToAttributes[moduleId] || []).forEach((prop) => {
          attributeLinks.push({ source: `property-${prop}`, target: moduleId });
        });
      });
    }
    
    // Add value->attribute links for forceLink if both are enabled
    if ((showAttributeNodes || isModalOpen) && (showValueNodes || isModalOpen)) {
      valueLinks.forEach((l) => {
        attributeLinks.push({ source: String(l.source), target: String(l.target) });
      });
    }
    
    return { nodes: d3nodes, links: d3links, moduleToAttributes, attributeLinks };
  }, [modules, token, showValueNodes, showAttributeNodes, isModalOpen]);

  // D3 force simulation and rendering (true hybrid)
  useEffect(() => {
    // Choose the appropriate SVG reference based on whether modal is open
    const svgElement = isModalOpen ? modalSvgRef.current : svgRef.current;
    
    if (loading || !svgElement) return;
    
    // Use modal dimensions if modal is open, otherwise use container dimensions
    const width = isModalOpen ? modalDimensions.width : dimensions.width;
    const height = isModalOpen ? modalDimensions.height : dimensions.height;
    
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    // Pan/zoom support with better defaults
    const g = svg.append("g");
    
    // Different initial zoom based on context - increase scale value to zoom in more
    const initialScale = isModalOpen ? 1.2 : 1.2;
    
    // Adjust initial transform to ensure token is centered
    const translateX = width / 2 * (1 - initialScale);
    const translateY = height / 2 * (1 - initialScale);
    
    const initialTransform = d3.zoomIdentity
      .scale(initialScale)
      .translate(translateX, translateY);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 6]) // Allow more zoom range
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    svg.call(zoom.transform, initialTransform);

    // Helper function to clamp values within boundaries
    function clamp(val: number, min: number, max: number) {
      return Math.max(min, Math.min(max, val));
    }

    // Calculate optimal rotation offset based on module and attribute distribution
    function calculateRotationOffset(moduleCount: number, attributeCount: number): number {
      // If attributes and modules are similar in number, stagger them
      if (Math.abs(moduleCount - attributeCount) <= 2) {
        return Math.PI / Math.max(moduleCount, attributeCount);
      }
      // Otherwise, use golden ratio for visually pleasing distribution
      return Math.PI * 0.618;
    }

    // 1. Position nodes, ensuring they stay within bounds and using concentric circles
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Dynamic size based on container and node count
    const totalNodes = nodes.length;
    
    // Adjust scale factor based on both node count and container size
    const baseScaleFactor = Math.max(0.5, Math.min(1.2, 50 / totalNodes));
    const containerRatio = Math.min(width, height) / 400; // Reference size of 400px (smaller reference increases relative size)
    const scaleFactor = baseScaleFactor * Math.min(1.5, containerRatio);
    
    // Adjusted node radius with dynamic scaling - increase base size
    const baseNodeRadius = 0.035 * Math.min(width, height);
    const nodeRadius = baseNodeRadius * nodeScale * scaleFactor;
    
    // Create padding to ensure nodes stay within bounds
    const padding = nodeRadius * 1.5;
    
    // Define safe area for positioning
    const safeWidth = width - padding * 2;
    const safeHeight = height - padding * 2;
    
    // Use aspect ratio to determine available space
    const aspectRatio = width / height;
    const horizontalFactor = aspectRatio > 1.2 ? 1.4 : 1.1;
    const verticalFactor = aspectRatio < 0.8 ? 1.4 : 1.1;
    
    // Calculate the maximum available radius for all circles combined
    const maxAvailableRadius = Math.min(
      safeWidth / (2 * horizontalFactor),
      safeHeight / (2 * verticalFactor)
    );
    
    // Define the radii for each concentric circle layer as a percentage of the maximum available radius
    // Layer distribution - adjust when attributes are hidden
    const moduleLayerRadius = (!showAttributeNodes && !isModalOpen) ? 
      maxAvailableRadius * 0.6 : // Larger radius for modules when attributes are hidden
      maxAvailableRadius * 0.4;  // Standard radius when all layers are shown
    const attributeLayerRadius = maxAvailableRadius * 0.7;
    const valueLayerRadius = maxAvailableRadius * 0.95;
    
    // Get nodes by type for layering
    const moduleNodes = nodes.filter((n) => n.type === "module");
    const attributeNodes = nodes.filter((n) => n.type === "attribute");
    const valueNodes = nodes.filter((n) => n.type === "value");
    const moduleCount = moduleNodes.length;
    const attributeCount = attributeNodes.length;
    const valueCount = valueNodes.length;
    
    // Clear all fixed positions first
    nodes.forEach((n) => { 
      n.fx = undefined; 
      n.fy = undefined; 
    });
    
    // Position the token node at the center
    const tokenNode = nodes.find((n) => n.id === "token");
    if (tokenNode) {
      tokenNode.fx = centerX;
      tokenNode.fy = centerY;
    }
    
    // Helper function for rotational positioning with jitter for better distribution
    function getPositionOnCircle(
      index: number, 
      totalItems: number, 
      radius: number, 
      jitterFactor: number = 0
    ) {
      // Add slight jitter to radius for more natural look
      const jitter = jitterFactor ? (Math.random() * 2 - 1) * radius * jitterFactor : 0;
      const adjustedRadius = radius + jitter;
      
      // Distribute evenly around circle with slight angle offset for visual interest
      const angleOffset = (totalItems > 1) ? Math.PI / totalItems : 0;
      const angle = (2 * Math.PI * index) / totalItems + angleOffset;
      
      // Apply aspect ratio adjustments
      const x = centerX + adjustedRadius * Math.cos(angle) * horizontalFactor;
      const y = centerY + adjustedRadius * Math.sin(angle) * verticalFactor;
      
      return { x, y };
    }
    
    // Position modules in the first circle around the token
    moduleNodes.forEach((mod, i) => {
      const pos = getPositionOnCircle(i, moduleCount, moduleLayerRadius, 0.05);
      
      // Fix module positions
      mod.fx = clamp(pos.x, padding, width - padding);
      mod.fy = clamp(pos.y, padding, height - padding);
    });
    
    // Group attributes by their related module for better organization
    const moduleRelatedAttributes = new Map<string, D3Node[]>();
    
    // Initialize map for each module
    moduleNodes.forEach(mod => {
      moduleRelatedAttributes.set(mod.id, []);
    });
    
    // Group attributes by connected module
    attributeNodes.forEach(attr => {
      const connectedModules = links
        .filter(link => {
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          return (sourceId === attr.id && targetId !== 'token') || 
                 (targetId === attr.id && sourceId !== 'token');
        })
        .map(link => {
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          return targetId === attr.id ? sourceId : targetId;
        })
        .filter(id => moduleNodes.some(mod => mod.id === id));
      
      // If connected to modules, add to each related module's group
      if (connectedModules.length > 0) {
        connectedModules.forEach(moduleId => {
          const existingGroup = moduleRelatedAttributes.get(moduleId);
          if (existingGroup) {
            existingGroup.push(attr);
          }
        });
      } else {
        // If not connected to any module, add to a random module group
        const randomModuleId = moduleNodes[Math.floor(Math.random() * moduleCount)].id;
        const existingGroup = moduleRelatedAttributes.get(randomModuleId);
        if (existingGroup) {
          existingGroup.push(attr);
        }
      }
    });
    
    // Position attributes in the second circle, grouped by their related modules
    moduleNodes.forEach((mod, moduleIndex) => {
      const relatedAttributes = moduleRelatedAttributes.get(mod.id) || [];
      const moduleAngle = (2 * Math.PI * moduleIndex) / moduleCount;
      
      // Calculate a sector around this module's angle
      const sectorStartAngle = moduleAngle - Math.PI / moduleCount;
      const sectorEndAngle = moduleAngle + Math.PI / moduleCount;
      const sectorAngleRange = sectorEndAngle - sectorStartAngle;
      
      relatedAttributes.forEach((attr, attrIndex) => {
        // Place attribute in the sector corresponding to its module
        const attrAngle = sectorStartAngle + sectorAngleRange * (attrIndex + 1) / (relatedAttributes.length + 1);
        
        // Calculate position on the attribute layer circle
        const x = centerX + attributeLayerRadius * Math.cos(attrAngle) * horizontalFactor;
        const y = centerY + attributeLayerRadius * Math.sin(attrAngle) * verticalFactor;
        
        // Set initial positions without fixing
        attr.x = clamp(x, padding * 2, width - padding * 2);
        attr.y = clamp(y, padding * 2, height - padding * 2);
      });
    });
    
    // Group value nodes by their connected attributes
    const attributeRelatedValues = new Map<string, D3Node[]>();
    
    // Initialize map for each attribute
    attributeNodes.forEach(attr => {
      attributeRelatedValues.set(attr.id, []);
    });
    
    // Group values by connected attribute
    valueNodes.forEach(val => {
      // Find the attribute this value is connected to
      const connectedAttr = links.find(link => {
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        return (sourceId === val.id) || (targetId === val.id);
      });
      
      if (connectedAttr) {
        const attrId = typeof connectedAttr.target === 'string' 
          ? connectedAttr.target 
          : connectedAttr.target.id;
          
        if (attrId.startsWith('property-')) {
          const existingGroup = attributeRelatedValues.get(attrId);
          if (existingGroup) {
            existingGroup.push(val);
          }
        }
      }
    });
    
    // Position values in the outer circle, grouped by their related attributes
    attributeNodes.forEach((attr, attrIndex) => {
      const relatedValues = attributeRelatedValues.get(attr.id) || [];
      
      // Calculate the base angle for this attribute
      const baseAngle = Math.atan2(
        (attr.y || 0) - centerY, 
        (attr.x || 0) - centerX
      );
      
      // Calculate a sector around this attribute's angle
      const sectorAngleRange = Math.PI / (attributeCount * 0.8); // Narrower sector
      
      relatedValues.forEach((val, valIndex) => {
        // Place value in the sector corresponding to its attribute
        const jitter = (Math.random() * 0.5 - 0.25) * sectorAngleRange; // Add slight angle jitter
        const valAngle = baseAngle + jitter;
        
        // Add slight radius jitter for natural distribution
        const radiusJitter = (Math.random() * 0.2) * valueLayerRadius * 0.1;
        const adjustedRadius = valueLayerRadius - radiusJitter;
        
        // Calculate position on the values layer circle
        const x = centerX + adjustedRadius * Math.cos(valAngle) * horizontalFactor;
        const y = centerY + adjustedRadius * Math.sin(valAngle) * verticalFactor;
        
        // Set initial positions without fixing
        val.x = clamp(x, padding * 3, width - padding * 3);
        val.y = clamp(y, padding * 3, height - padding * 3);
      });
    });
    
    // 2. D3 force simulation with forces optimized for concentric layout
    const simulation = d3.forceSimulation<D3Node>(nodes)
      // Link force with custom distances
      .force("link", d3.forceLink(attributeLinks)
        .id((d: any) => d.id)
        .distance((d) => {
          const source = typeof d.source === 'string' ? d.source : (d.source as any).id;
          const target = typeof d.target === 'string' ? d.target : (d.target as any).id;
          const sourceNode = nodes.find(n => n.id === source);
          const targetNode = nodes.find(n => n.id === target);
          
          if (!sourceNode || !targetNode) return nodeRadius * 2 + 20;
          
          // Radial layout distances based on layer differences
          if (sourceNode.type === 'token' && targetNode.type === 'module') {
            return moduleLayerRadius * 0.9; // Token to module
          }
          if (sourceNode.type === 'module' && targetNode.type === 'attribute') {
            return (attributeLayerRadius - moduleLayerRadius) * 0.9; // Module to attribute
          }
          if (sourceNode.type === 'attribute' && targetNode.type === 'value') {
            return (valueLayerRadius - attributeLayerRadius) * 0.9; // Attribute to value
          }
          
          // Default distance for other connections
          return nodeRadius * 3;
        })
        .strength((d) => {
          const source = typeof d.source === 'string' ? d.source : (d.source as any).id;
          const target = typeof d.target === 'string' ? d.target : (d.target as any).id;
          const sourceNode = nodes.find(n => n.id === source);
          const targetNode = nodes.find(n => n.id === target);
          
          if (!sourceNode || !targetNode) return 0.7;
          
          // Stronger links between layers to maintain the concentric structure
          if ((sourceNode.type === 'token' && targetNode.type === 'module') ||
              (targetNode.type === 'token' && sourceNode.type === 'module')) {
            return 0.8; // Strong token-module connection
          }
          
          return 0.7; // Default link strength
        }))
      // Collision detection to prevent overlap
      .force("collide", d3.forceCollide()
        .radius((d: d3.SimulationNodeDatum) => {
          // Layer-specific collision radii
          if ((d as D3Node).type === 'module') return nodeRadius * 1.6;
          if ((d as D3Node).type === 'attribute') return nodeRadius * 1.2;
          if ((d as D3Node).type === 'value') return nodeRadius * 0.8;
          return nodeRadius * 1.2;
        })
        .strength(0.8))
      // Very weak center force - concentric structure maintained by custom forces
      .force("center", d3.forceCenter(centerX, centerY).strength(0.03))
      // Custom radial forces to maintain layer structure
      .force("moduleRadial", d3.forceRadial(moduleLayerRadius, centerX, centerY)
        .strength((d: d3.SimulationNodeDatum) => {
          return (d as D3Node).type === 'module' ? 0.8 : 0;
        }))
      .force("attributeRadial", d3.forceRadial(attributeLayerRadius, centerX, centerY)
        .strength((d: d3.SimulationNodeDatum) => {
          return (d as D3Node).type === 'attribute' ? 0.6 : 0;
        }))
      .force("valueRadial", d3.forceRadial(valueLayerRadius, centerX, centerY)
        .strength((d: d3.SimulationNodeDatum) => {
          return (d as D3Node).type === 'value' ? 0.4 : 0;
        }))
      // Small charge force for slight separation
      .force("charge", d3.forceManyBody()
        .strength((d: d3.SimulationNodeDatum) => {
          // Small repulsion to prevent crowding within each layer
          return -nodeRadius * 3;
        }))
      .alpha(0.9)
      .alphaDecay(0.04);

    // Run simulation ticks before rendering to improve initial layout
    for (let i = 0; i < 60; i++) {
      simulation.tick();
    }

    // MISSING RENDERING CODE: Draw links between nodes
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", (d) => {
        // Make attribute-related links less visible when attributes are hidden
        const source = typeof d.source === "string" ? d.source : d.source.id;
        const target = typeof d.target === "string" ? d.target : d.target.id;
        
        if (!showAttributeNodes && !isModalOpen) {
          // If attribute nodes are hidden, fade out their links
          if (source.includes('property-') || target.includes('property-')) {
            return 0.1; // Nearly invisible but still technically present
          }
        }
        return 0.6; // Default opacity
      })
      .attr("stroke-width", 1.5)
      .attr("x1", (d) => {
        const source = typeof d.source === "string" ? nodes.find((n) => n.id === d.source) : d.source;
        return source ? (source.x || 0) : 0;
      })
      .attr("y1", (d) => {
        const source = typeof d.source === "string" ? nodes.find((n) => n.id === d.source) : d.source;
        return source ? (source.y || 0) : 0;
      })
      .attr("x2", (d) => {
        const target = typeof d.target === "string" ? nodes.find((n) => n.id === d.target) : d.target;
        return target ? (target.x || 0) : 0;
      })
      .attr("y2", (d) => {
        const target = typeof d.target === "string" ? nodes.find((n) => n.id === d.target) : d.target;
        return target ? (target.y || 0) : 0;
      });

    // MISSING RENDERING CODE: Draw nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => {
        // Dynamic radius based on node type and importance
        switch (d.type) {
          case "token":
            return nodeRadius * 1.4;
          case "module":
            return nodeRadius * 1.2;
          case "attribute":
            // Make attribute nodes smaller when they should be hidden
            return (!showAttributeNodes && !isModalOpen) ? nodeRadius * 0.3 : nodeRadius * 0.9;
          case "value":
            return nodeRadius * 0.6;
          default:
            return nodeRadius;
        }
      })
      .attr("fill", (d) => NODE_COLORS[d.type] || "#999")
      .attr("fill-opacity", (d) => {
        // Make attribute nodes nearly invisible when they should be hidden
        if (d.type === "attribute" && !showAttributeNodes && !isModalOpen) {
          return 0.1;
        }
        return 1;
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", (d) => {
        // Hide stroke for hidden attribute nodes
        if (d.type === "attribute" && !showAttributeNodes && !isModalOpen) {
          return 0;
        }
        return 1;
      })
      .attr("cx", (d) => d.x || 0)
      .attr("cy", (d) => d.y || 0);

    // MISSING RENDERING CODE: Add text labels to nodes
    const nodeLabels = g
      .append("g")
      .attr("class", "node-labels")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.label)
      .attr("x", (d) => d.x || 0)
      .attr("y", (d) => {
        const baseY = d.y || 0;
        // Position labels below nodes, adjusted by node type
        switch (d.type) {
          case "token":
            return baseY + nodeRadius * 1.8;
          case "module":
            return baseY + nodeRadius * 1.5;
          case "attribute":
            return baseY + nodeRadius * 1.2;
          case "value":
            return baseY + nodeRadius * 0.9;
          default:
            return baseY + nodeRadius * 1.2;
        }
      })
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => {
        // Dynamic font size based on node type and container size
        const baseSize = Math.max(8, Math.min(12, width / 60)) * labelSize;
        switch (d.type) {
          case "token":
            return baseSize * 1.1 + "px";
          case "module":
            return baseSize + "px";
          case "attribute":
            return baseSize * 0.9 + "px";
          case "value":
            return baseSize * 0.8 + "px";
          default:
            return baseSize + "px";
        }
      })
      .attr("fill", (d) => {
        // Hide labels for attribute and value nodes unless showAllLabels is true
        if (!showAllLabels && d.type === "value") {
          return "transparent";
        }
        // Always hide attribute labels when attributes are hidden
        if (d.type === "attribute" && !showAttributeNodes && !isModalOpen) {
          return "transparent";
        }
        return "#333";
      })
      .style("pointer-events", "none")
      .style("user-select", "none")
      .each(function(d) {
        // Truncate long labels
        const text = d3.select(this);
        const label = d.label;
        if (label.length > 20) {
          text.text(label.substring(0, 18) + "...");
        }
      });

    return () => {
      simulation.stop();
      if (svgElement && svgElement.parentElement) {
        d3.select(svgElement.parentElement).selectAll("style.d3-fade-style").remove();
      }
    };
    // eslint-disable-next-line
  }, [loading, nodes, links, dimensions, modalDimensions, token, nodeScale, labelSize, showAllLabels, showAttributeNodes, isModalOpen]);

  if (!token) {
    return <div className="text-center text-gray-400">No token selected</div>;
  }

  return (
    <>
      <div className="flex flex-col w-full">
        <div
          ref={containerRef}
          style={{ minHeight: 300, maxHeight: 480 }}
          className="border border-gray-100 rounded-lg overflow-hidden flex-grow relative cursor-pointer flex items-center justify-center"
          onClick={openModal}
          role="button"
          tabIndex={0}
          aria-label="Open graph in fullscreen mode"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              openModal();
            }
          }}
        >
          {loading ? (
            <div className="text-center text-gray-400">Loading modules...</div>
          ) : (
            <>
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{ display: "block", width: "100%", height: "100%", maxHeight: 480 }}
                className="overflow-visible"
              />
              <div className="absolute bottom-2 right-2 bg-white bg-opacity-70 rounded-full p-2 text-xs text-gray-600 rounded-xl bg-[#F8F1DB] text-[#2A4A59] text-base font-medium shadow-sm border border-[#E9D973]/40">
                Click to expand
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white rounded-lg w-full h-full max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium" id="modal-title">
                {token.data.name || token.id || "Token"} Graph
              </h3>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setNodeScale(Math.max(0.5, nodeScale - 0.1))}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  aria-label="Decrease node size"
                >
                  -
                </button>
                <button
                  onClick={() => setNodeScale(Math.min(1.5, nodeScale + 0.1))}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  aria-label="Increase node size"
                >
                  +
                </button>
                <button
                  onClick={closeModal}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 ml-4"
                  autoFocus
                  aria-label="Close modal"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">Loading modules...</div>
                </div>
              ) : (
                <svg
                  ref={modalSvgRef}
                  width={modalDimensions.width}
                  height={modalDimensions.height}
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 