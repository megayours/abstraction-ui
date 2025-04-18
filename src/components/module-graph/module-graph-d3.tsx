"use client"

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getModule, Module, Token } from "@/lib/api/megadata";

type ModuleGraphProps = {
  token: Token;
};

// Node types for D3
interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  type: "token" | "module" | "attribute";
  label: string;
  fx?: number | null;
  fy?: number | null;
}
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  kind: "propertyToModule" | "moduleToToken";
}

const NODE_COLORS: Record<string, string> = {
  token: "#2A4A59",
  module: "#AAC4E7",
  attribute: "#C7B29A",
};

export default function ModuleGraphD3({ token }: ModuleGraphProps) {
  const [modules, setModules] = useState<Record<string, Module>>({});
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 700, height: 500 });

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

  // Fetch modules
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
    };
    fetchModules();
  }, [token]);

  // Prepare nodes and links
  const { nodes, links, moduleToAttributes, attributeLinks } = React.useMemo(() => {
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
      })),
      ...usedProperties.map((prop) => ({
        id: `property-${prop}`,
        type: "attribute" as const,
        label: prop,
      })),
    ];
    const d3links: D3Link[] = [
      ...usedProperties.flatMap((prop) =>
        propertyModuleMap[prop].map((moduleId) => ({
          source: `property-${prop}`,
          target: moduleId,
          kind: "propertyToModule" as const,
        }))
      ),
      ...moduleIds.map((moduleId) => ({
        source: moduleId,
        target: "token",
        kind: "moduleToToken" as const,
      })),
    ];
    // Attribute links for forceLink
    const attributeLinks: { source: string; target: string }[] = [];
    moduleIds.forEach((moduleId) => {
      (moduleToAttributes[moduleId] || []).forEach((prop) => {
        attributeLinks.push({ source: `property-${prop}`, target: moduleId });
      });
    });
    return { nodes: d3nodes, links: d3links, moduleToAttributes, attributeLinks };
  }, [modules, token]);

  // D3 force simulation and rendering (true hybrid)
  useEffect(() => {
    if (loading || !svgRef.current) return;
    const width = dimensions.width;
    const height = dimensions.height;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 1. Fix token and modules
    const centerX = width / 2;
    const centerY = height / 2;
    const nodeRadius = 0.045 * Math.min(width, height);
    const margin = nodeRadius + 32;
    const moduleNodes = nodes.filter((n) => n.type === "module");
    const moduleCount = moduleNodes.length;
    const moduleRadius = Math.min(width, height) / 2 - margin * 2.2;
    nodes.forEach((n) => { n.fx = undefined; n.fy = undefined; }); // clear all
    const tokenNode = nodes.find((n) => n.id === "token");
    if (tokenNode) {
      tokenNode.fx = centerX;
      tokenNode.fy = centerY;
    }
    moduleNodes.forEach((mod, i) => {
      const angle = (2 * Math.PI * i) / moduleCount;
      mod.fx = centerX + moduleRadius * Math.cos(angle);
      mod.fy = centerY + moduleRadius * Math.sin(angle);
    });
    // Attributes: do NOT set fx/fy (let them be free)

    // 2. D3 force simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force("link", d3.forceLink(attributeLinks).id((d: any) => d.id).distance(nodeRadius * 2.5 + 48).strength(1))
      .force("collide", d3.forceCollide(nodeRadius + 18))
      .force("center", d3.forceCenter(centerX, centerY))
      .alpha(0.8)
      .alphaDecay(0.08);

    // Draw links
    const link = svg
      .append("g")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 2)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => (d.kind === "moduleToToken" ? "#2A4A59" : "#C7B29A"))
      .attr("stroke-dasharray", (d) => (d.kind === "moduleToToken" ? "4 2" : null))
      .attr("class", "d3-link");

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll<SVGCircleElement, D3Node>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => NODE_COLORS[d.type])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .attr("class", "d3-node")
      .style("transition", "opacity 0.2s")
      .on("mouseenter", function (event, d) {
        node.classed("faded", (n) => n.id !== d.id && !links.some((l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          return (src === n.id && tgt === d.id) || (tgt === n.id && src === d.id);
        }));
        label.classed("faded", (n) => n.id !== d.id && !links.some((l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          return (src === n.id && tgt === d.id) || (tgt === n.id && src === d.id);
        }));
        link.classed("faded", (l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          return src !== d.id && tgt !== d.id;
        });
      })
      .on("mouseleave", function () {
        node.classed("faded", false);
        label.classed("faded", false);
        link.classed("faded", false);
      })
      .call(
        d3
          .drag<SVGCircleElement, D3Node>()
          .on("start", function (event, d) {
            d3.select(this).raise();
            simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", function (event, d) {
            d.fx = event.x;
            d.fy = event.y;
            simulation.alpha(0.3).restart();
          })
          .on("end", function (event, d) {
            if (d.type === "token" || d.type === "module") {
              // Keep fixed
              d.fx = d.fx;
              d.fy = d.fy;
            } else {
              d.fx = null;
              d.fy = null;
            }
            simulation.alphaTarget(0);
          })
      );

    // Draw labels with background
    const labelGroup = svg.append("g");
    const tempText = labelGroup
      .selectAll<SVGTextElement, D3Node>("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", Math.max(12, 0.022 * Math.min(width, height)))
      .attr("font-family", (d) =>
        d.type === "token" ? "Playfair Display, serif" : "Radio Canada, sans-serif"
      )
      .attr("class", "d3-label-measure")
      .attr("visibility", "hidden");
    const labelDims = nodes.map((d, i) => {
      const el = tempText.nodes()[i] as SVGTextElement;
      const bbox = el.getBBox();
      return { width: bbox.width, height: bbox.height };
    });
    tempText.remove();
    const labelBg = labelGroup
      .selectAll<SVGRectElement, D3Node>("rect")
      .data(nodes)
      .join("rect")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", "#fff")
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1)
      .attr("class", "d3-label-bg");
    const label = labelGroup
      .selectAll<SVGTextElement, D3Node>("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", Math.max(12, 0.022 * Math.min(width, height)))
      .attr("font-family", (d) =>
        d.type === "token" ? "Playfair Display, serif" : "Radio Canada, sans-serif"
      )
      .attr("fill", "#131516")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.5)
      .attr("paint-order", "stroke")
      .style("pointer-events", "none")
      .attr("class", "d3-label")
      .style("transition", "fill 0.2s, opacity 0.2s");

    // Add CSS for faded class
    if (svgRef.current && svgRef.current.parentElement) {
      d3.select(svgRef.current.parentElement).selectAll("style.d3-fade-style").remove();
      d3.select(svgRef.current.parentElement)
        .append("style")
        .attr("class", "d3-fade-style")
        .text(`
          .d3-node.faded { opacity: 0.2 !important; }
          .d3-label.faded { fill: #bbb !important; stroke: #fff !important; }
          .d3-link.faded { opacity: 0.15 !important; }
          .d3-label-bg.faded { fill: #f5f5f5 !important; }
        `);
    }

    // Simulation tick
    simulation.on("tick", () => {
      function getNodePos(n: any) {
        return {
          x: typeof n.fx === "number" ? n.fx : n.x ?? 0,
          y: typeof n.fy === "number" ? n.fy : n.y ?? 0,
        };
      }
      link
        .attr("x1", (d) => {
          const src = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source;
          return src ? getNodePos(src).x : 0;
        })
        .attr("y1", (d) => {
          const src = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source;
          return src ? getNodePos(src).y : 0;
        })
        .attr("x2", (d) => {
          const tgt = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target;
          return tgt ? getNodePos(tgt).x : 0;
        })
        .attr("y2", (d) => {
          const tgt = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target;
          return tgt ? getNodePos(tgt).y : 0;
        });
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      // Position label backgrounds and text ABOVE the node
      const labelGap = 8;
      label
        .attr("x", (d) => d.x ?? 0)
        .attr("y", (d, i) => (d.y ?? 0) - nodeRadius - labelGap);
      labelBg
        .attr("x", (d, i) => (d.x ?? 0) - labelDims[i].width / 2 - 8)
        .attr("y", (d, i) => (d.y ?? 0) - nodeRadius - labelGap - labelDims[i].height / 2 - 3)
        .attr("width", (d, i) => labelDims[i].width + 16)
        .attr("height", (d, i) => labelDims[i].height + 6);
    });

    return () => {
      simulation.stop();
      if (svgRef.current && svgRef.current.parentElement) {
        d3.select(svgRef.current.parentElement).selectAll("style.d3-fade-style").remove();
      }
    };
    // eslint-disable-next-line
  }, [loading, nodes, links, dimensions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] rounded-2xl p-6 relative overflow-hidden bg-white "
      style={{ minHeight: 300 }}
    >
      {loading ? (
        <div className="text-center text-gray-400">Loading modules...</div>
      ) : (
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
} 