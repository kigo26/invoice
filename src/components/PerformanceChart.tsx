import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Invoice } from '../types';

interface PerformanceChartProps {
  invoices: Invoice[];
}

export default function PerformanceChart({ invoices }: PerformanceChartProps) {
  const heatmapRef = useRef<SVGSVGElement>(null);
  const trendRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!invoices.length || !heatmapRef.current || !trendRef.current) return;

    // 1. DATA PREP for Last 30 Days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const filteredInvoices = invoices.filter(inv => {
      const d = new Date(inv.issueDate);
      return d >= thirtyDaysAgo && d <= now;
    });

    // Heatmap Data: Day of Week vs Week of period
    // Since it's only 30 days, we can do fixed grid
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const volumeByDay: Record<string, number> = {};
    
    // Group by date
    filteredInvoices.forEach(inv => {
      const dateStr = inv.issueDate;
      const weight = inv.items.reduce((sum, item) => sum + (item.deliveryWeight || 0), 0);
      volumeByDay[dateStr] = (volumeByDay[dateStr] || 0) + weight;
    });

    // HEATMAP VISUALIZATION
    const drawHeatmap = () => {
      const svg = d3.select(heatmapRef.current);
      svg.selectAll('*').remove();

      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const width = heatmapRef.current!.parentElement?.clientWidth || 600;
      const height = 200;
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Generate all 30 days
      const dateArray = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo);
        d.setDate(d.getDate() + i);
        dateArray.push(d.toISOString().split('T')[0]);
      }

      const cellSize = Math.min(innerWidth / 7.5, innerHeight / 5.5);
      
      const colorScale = d3.scaleSequential(d3.interpolateGreens)
        .domain([0, d3.max(Object.values(volumeByDay)) || 100]);

      // Labels for days
      g.selectAll('.dayLabel')
        .data(days)
        .enter()
        .append('text')
        .text(d => d)
        .attr('x', (d, i) => i * cellSize + cellSize / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-[10px] fill-zinc-500 font-mono font-bold uppercase');

      // Grid
      dateArray.forEach((dateStr) => {
        const date = new Date(dateStr);
        const dayIdx = date.getDay();
        const weekIdx = Math.floor((date.getTime() - thirtyDaysAgo.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const val = volumeByDay[dateStr] || 0;

        g.append('rect')
          .attr('x', dayIdx * cellSize)
          .attr('y', weekIdx * cellSize)
          .attr('width', cellSize - 2)
          .attr('height', cellSize - 2)
          .attr('rx', 4)
          .attr('fill', val === 0 ? '#1C1C1C' : colorScale(val))
          .attr('stroke', '#1F1F1F')
          .attr('stroke-width', 1)
          .append('title')
          .text(`${dateStr}: ${val.toFixed(2)} KG`);
      });
    };

    // TREND VISUALIZATION
    const drawTrend = () => {
      const svg = d3.select(trendRef.current);
      svg.selectAll('*').remove();

      const margin = { top: 20, right: 30, bottom: 40, left: 50 };
      const width = trendRef.current!.parentElement?.clientWidth || 600;
      const height = 300;
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Prepare daily volume data
      const dailyData = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        dailyData.push({
          date: d,
          value: volumeByDay[dateStr] || 0
        });
      }

      const x = d3.scaleTime()
        .domain(d3.extent(dailyData, d => d.date) as [Date, Date])
        .range([0, innerWidth]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(dailyData, d => d.value) || 100])
        .range([innerHeight, 0]);

      // Axes
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d') as any))
        .attr('class', 'text-zinc-600 font-mono text-[9px]')
        .selectAll('path, line')
        .attr('stroke', '#1F1F1F');

      g.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .attr('class', 'text-zinc-600 font-mono text-[9px]')
        .selectAll('path, line')
        .attr('stroke', '#1F1F1F');

      // Grid lines
      g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ''))
        .selectAll('path, line')
        .attr('stroke', '#1F1F1F');

      // Gradient for area
      const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#10b981')
        .attr('stop-opacity', 0.2);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#10b981')
        .attr('stop-opacity', 0);

      // Area
      const area = d3.area<any>()
        .x(d => x(d.date))
        .y0(innerHeight)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(dailyData)
        .attr('fill', 'url(#area-gradient)')
        .attr('d', area);

      // Line
      const line = d3.line<any>()
        .x(d => x(d.date))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(dailyData)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('d', line);

      // Dots
      g.selectAll('.dot')
        .data(dailyData.filter(d => d.value > 0))
        .enter()
        .append('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.value))
        .attr('r', 3)
        .attr('fill', '#10b981')
        .attr('stroke', '#0C0C0C')
        .attr('stroke-width', 1.5)
        .append('title')
        .text(d => `${d.date.toDateString()}: ${d.value.toFixed(2)} KG`);
    };

    drawHeatmap();
    drawTrend();

    const handleResize = () => {
      drawHeatmap();
      drawTrend();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [invoices]);

  return (
    <div className="space-y-8">
      {/* Heatmap Section */}
      <div className="p-6 bg-[#141414] rounded-2xl border border-[#1F1F1F] shadow-inner overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Delivery Frequency Heatmap</h3>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">Activity distribution over the last 30 days</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-600 font-mono uppercase">Less</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-sm bg-[#1C1C1C]"></div>
              <div className="w-2 h-2 rounded-sm bg-emerald-900"></div>
              <div className="w-2 h-2 rounded-sm bg-emerald-700"></div>
              <div className="w-2 h-2 rounded-sm bg-emerald-500"></div>
            </div>
            <span className="text-[9px] text-zinc-600 font-mono uppercase">More</span>
          </div>
        </div>
        <div className="w-full">
          <svg ref={heatmapRef} className="w-full h-[200px]" />
        </div>
      </div>

      {/* Trend Section */}
      <div className="p-6 bg-[#141414] rounded-2xl border border-[#1F1F1F] shadow-inner overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Meat Volume Trends</h3>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">Daily aggregate weight (KG) across session period</p>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-tighter">30 Day Trend Pulse</span>
          </div>
        </div>
        <div className="w-full">
          <svg ref={trendRef} className="w-full h-[300px]" />
        </div>
      </div>
    </div>
  );
}
