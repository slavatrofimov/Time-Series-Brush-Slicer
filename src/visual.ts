/*
 *  Time Series Brush Slicer - Power BI Custom Visual
 *  
 *  A time brush slicer that outputs the selected time range as a text string
 *  in the format: "startTimestamp|endTimestamp" for use with dynamic M query parameters.
 */
"use strict";

import powerbi from "powerbi-visuals-api";
import * as d3 from "d3";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { AdvancedFilter, IAdvancedFilterCondition } from "powerbi-models";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import DataView = powerbi.DataView;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { VisualFormattingSettingsModel } from "./settings";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import IColorPalette = powerbi.extensibility.IColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;

// Interface for time series data points
interface TimeDataPoint {
    timestamp: Date;
    value: number | null;
    min?: number;
    max?: number;
    series?: string;
    anomaly?: number;
    timelineMarker?: string;
    selectionId: ISelectionId;  // Required for conditional formatting
    lineColor?: string;  // Conditional formatting color for line
    areaColor?: string;  // Conditional formatting color for area
    index: number;       // Index in the original data array - required for conditional formatting
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private container: HTMLDivElement;
    private rangeDisplay: HTMLDivElement;
    private svgContainer: HTMLDivElement;
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    private brushGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    private markersGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    private axisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: ISelectionManager;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private events: IVisualEventService;
    private colorPalette: IColorPalette;
    
    private data: TimeDataPoint[] = [];
    private dataView: DataView | null = null;
    private xScale: d3.ScaleTime<number, number>;
    private yScale: d3.ScaleLinear<number, number>;
    private brush: d3.BrushBehavior<unknown>;
    
    private selectedStartDate: Date | null = null;
    private selectedEndDate: Date | null = null;
    private filterColumnTarget: { table: string, column: string } | null = null;
    private lastTimeRange: [number, number] | null = null;
    
    // Event handler references for cleanup
    private contextMenuHandler: (e: MouseEvent) => void;
    private lastBrushWidth: number = 0;
    private lastBrushHeight: number = 0;
    private dateFormatterCache: Map<string, (date: Date) => string> = new Map();
    private brushUpdateTimeout: number | null = null;
    private isProgrammaticBrushUpdate: boolean = false;
    
    // Margins for the chart
    private margin = { top: 10, right: 20, bottom: 30, left: 20 };

    constructor(options: VisualConstructorOptions) {
        
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
        this.colorPalette = options.host.colorPalette;
        this.events = options.host.eventService;
        this.selectionManager = options.host.createSelectionManager();
        this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element);
        
        // Create main container with explicit styles
        this.container = document.createElement("div");
        this.container.style.cssText = `
            width: 100%;
            height: 100%;
            background-color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            overflow: hidden;
        `;
        this.target.appendChild(this.container);
        
        // Create range display div at top
        this.rangeDisplay = document.createElement("div");
        this.rangeDisplay.style.cssText = `
            text-align: center;
            padding: 8px 12px;
            background-color: #f0f0f0;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
            font-weight: 500;
            color: #333;
            flex-shrink: 0;
        `;
        this.rangeDisplay.textContent = "Add a timestamp field";
        this.container.appendChild(this.rangeDisplay);
        
        // Create SVG container
        this.svgContainer = document.createElement("div");
        this.svgContainer.style.cssText = `
            flex: 1;
            background-color: #fafafa;
            position: relative;
            min-height: 50px;
            overflow: hidden;
        `;
        this.container.appendChild(this.svgContainer);
        
        // Create SVG
        this.svg = d3.select(this.svgContainer)
            .append("svg")
            .style("display", "block")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow", "visible");
            
        // Create groups for chart elements
        this.chartGroup = this.svg.append("g").attr("class", "chart-group");
        this.brushGroup = this.svg.append("g").attr("class", "brush-group");
        this.markersGroup = this.svg.append("g").attr("class", "markers-group");
        this.axisGroup = this.svg.append("g").attr("class", "axis-group");
        
        // Create and bind context menu handler (stored for cleanup)
        this.contextMenuHandler = (e: MouseEvent) => {
            this.selectionManager.showContextMenu(null, {
                x: e.clientX,
                y: e.clientY
            });
            e.preventDefault();
        };
        this.svgContainer.addEventListener("contextmenu", this.contextMenuHandler);
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);
        
        // Store the dataView for use in conditional formatting
        this.dataView = options.dataViews && options.dataViews[0] ? options.dataViews[0] : null;
        
        // Parse data first
        this.parseData(options.dataViews);
        
        // Get formatting settings
        if (options.dataViews && options.dataViews[0]) {
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
                VisualFormattingSettingsModel, 
                options.dataViews[0]
            );

            // Dynamic Series Colors
            const dataView = options.dataViews[0];
            let isMultiSeries = false;
            
            if (dataView.categorical && dataView.categorical.values && dataView.categorical.values.grouped()) {
                const groups = dataView.categorical.values.grouped();
                this.formattingSettings.seriesSettingsCard.slices = [];
                
                // Check if we have multiple series
                // If we have a "Series" field, groups will be > 1 or the group name will be meaningful
                // If no "Series" field, we might still have multiple measures which creates multiple groups?
                // Actually, multiple measures usually appear as values in a single group unless "Values" is used as a series.
                // But here we have explicit "Series" role.
                
                const seriesRole = dataView.categorical.categories?.find(c => c.source.roles && c.source.roles.series);
                isMultiSeries = !!seriesRole || groups.length > 1;

                groups.forEach((group, index) => {
                    const seriesName = group.name ? String(group.name) : "Series " + (index + 1);
                    const color = this.host.colorPalette.getColor(seriesName).value;
                    
                    // Get saved color
                    let savedColor = color;
                    if (group.objects && group.objects.seriesColor && group.objects.seriesColor.fill) {
                        savedColor = (group.objects.seriesColor.fill as any).solid.color;
                    }
                    
                    const slice = new formattingSettings.ColorPicker({
                        name: "fill",
                        displayName: seriesName,
                        value: { value: savedColor },
                        selector: group.identity
                    });
                    
                    this.formattingSettings.seriesSettingsCard.slices.push(slice);
                });
            }
            
            // Hide global color settings if multi-series
            if (isMultiSeries) {
                this.formattingSettings.lineSettingsCard.visible = false;
                this.formattingSettings.areaSettingsCard.areaColor.visible = false;
                this.formattingSettings.seriesSettingsCard.visible = true;
            } else {
                this.formattingSettings.lineSettingsCard.visible = true;
                this.formattingSettings.areaSettingsCard.areaColor.visible = true;
                this.formattingSettings.seriesSettingsCard.visible = false;
            }
        }

        
        // Identify filter target
        this.filterColumnTarget = null;
        if (options.dataViews && options.dataViews[0] && options.dataViews[0].categorical && options.dataViews[0].categorical.categories) {
            const categories = options.dataViews[0].categorical.categories;
            
            // Find the filter field by role
            let filterCategory = categories.find(c => c.source.roles && c.source.roles.filterField);
            
            // Fallback: If explicit role not found, try to find a category that isn't the timestamp
            if (!filterCategory && categories.length > 1) {
                // Assuming the first non-timestamp category is the filter field
                filterCategory = categories.find(c => !c.source.roles || !c.source.roles.timestamp);
            }

            // Fallback 2: Use the timestamp category itself if no other filter field is found
            if (!filterCategory) {
                filterCategory = categories.find(c => c.source.roles && c.source.roles.timestamp);
            }
            
            if (filterCategory && filterCategory.source.queryName) {
                const queryName = filterCategory.source.queryName;
                const dotIndex = queryName.lastIndexOf('.');
                if (dotIndex > 0) {
                    this.filterColumnTarget = {
                        table: queryName.substring(0, dotIndex),
                        column: queryName.substring(dotIndex + 1)
                    };
                } else {
                    this.filterColumnTarget = {
                        table: "", 
                        column: filterCategory.source.displayName
                    };
                }
            }
        }
        
        // Get dimensions with validation
        const width = Math.max(0, options.viewport.width || 0);
        const height = Math.max(0, options.viewport.height || 0);
        
        // Validate minimum size
        if (width < 100 || height < 50) {
            this.showNoDataMessage(width, height);
            this.events.renderingFinished(options);
            return;
        }
        
        if (this.data.length === 0) {
            this.showNoDataMessage(width, height);
            this.events.renderingFinished(options);
            return;
        }
        
        this.renderChart(width, height);
        this.events.renderingFinished(options);
    }
    
    private showNoDataMessage(width: number, height: number): void {
        // Clear chart elements
        this.chartGroup.selectAll("*").remove();
        this.brushGroup.selectAll("*").remove();
        this.markersGroup.selectAll("*").remove();
        this.axisGroup.selectAll("*").remove();
        
        // Update range display as message
        this.rangeDisplay.textContent = "Add a timestamp field and data to use the time brush slicer";
        this.rangeDisplay.style.flex = "1";
        this.rangeDisplay.style.display = "flex";
        this.rangeDisplay.style.alignItems = "center";
        this.rangeDisplay.style.justifyContent = "center";
        this.rangeDisplay.style.backgroundColor = "#f5f5f5";
        this.rangeDisplay.style.color = "#666";
        this.rangeDisplay.style.borderBottom = "none";
        
        // Hide SVG container
        this.svgContainer.style.display = "none";
    }
    
    private renderChart(width: number, height: number): void {
        // Reset display styles
        this.rangeDisplay.style.flex = "0 0 auto";
        this.rangeDisplay.style.display = "block";
        
        const isHighContrast = this.host.colorPalette.isHighContrast;
        const foreground = this.host.colorPalette.foreground.value;
        const background = this.host.colorPalette.background.value;

        // Apply formatting settings
        let bgColor = this.formattingSettings?.displaySettingsCard?.backgroundColor?.value?.value ?? "#f0f0f0";
        let fontColor = this.formattingSettings?.displaySettingsCard?.fontColor?.value?.value ?? "#333333";
        
        if (isHighContrast) {
            bgColor = background;
            fontColor = foreground;
        }

        const fontSize = this.formattingSettings?.displaySettingsCard?.fontSize?.value ?? 12;
        const fontFamily = this.formattingSettings?.displaySettingsCard?.fontFamily?.value ?? "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif";
        const alignment = this.formattingSettings?.displaySettingsCard?.alignment?.value ?? "center";
        
        this.rangeDisplay.style.backgroundColor = bgColor;
        this.rangeDisplay.style.color = fontColor;
        this.rangeDisplay.style.fontSize = `${fontSize}px`;
        this.rangeDisplay.style.fontFamily = fontFamily;
        this.rangeDisplay.style.textAlign = alignment;
        
        const rangeMarginTop = this.formattingSettings?.displaySettingsCard?.rangeTextMarginTop?.value ?? 0;
        const rangeMarginRight = this.formattingSettings?.displaySettingsCard?.rangeTextMarginRight?.value ?? 5;
        const rangeMarginBottom = this.formattingSettings?.displaySettingsCard?.rangeTextMarginBottom?.value ?? 0;
        const rangeMarginLeft = this.formattingSettings?.displaySettingsCard?.rangeTextMarginLeft?.value ?? 5;

        this.rangeDisplay.style.padding = `${rangeMarginTop}px ${rangeMarginRight}px ${rangeMarginBottom}px ${rangeMarginLeft}px`;
        
        this.rangeDisplay.style.borderBottom = "1px solid #ddd";
        this.svgContainer.style.display = "block";
        
        // Calculate dimensions
        const showRange = this.formattingSettings?.displaySettingsCard?.showSelectedRange?.value ?? true;
        const rangeHeight = showRange ? (fontSize + rangeMarginTop + rangeMarginBottom + 5) : 0;
        const showAxis = this.formattingSettings?.axisSettingsCard?.showAxis?.value ?? true;
        const axisHeight = showAxis ? 25 : 5;
        
        // Update range display visibility
        this.rangeDisplay.style.display = showRange ? "block" : "none";
        
        // Update margins from settings
        this.margin.top = this.formattingSettings?.marginSettingsCard?.marginTop?.value ?? 0;
        this.margin.right = this.formattingSettings?.marginSettingsCard?.marginRight?.value ?? 0;
        this.margin.bottom = this.formattingSettings?.marginSettingsCard?.marginBottom?.value ?? 0;
        this.margin.left = this.formattingSettings?.marginSettingsCard?.marginLeft?.value ?? 0;

        const chartWidth = Math.max(50, width - this.margin.left - this.margin.right);
        const chartHeight = Math.max(30, height - rangeHeight - this.margin.top - this.margin.bottom - axisHeight);
        
        // Update SVG size
        this.svg
            .attr("width", width)
            .attr("height", height - rangeHeight);
            
        // Create scales
        const timeExtent = d3.extent(this.data, d => d.timestamp) as [Date, Date];
        
        // Check if data range changed
        const newMin = timeExtent[0].getTime();
        const newMax = timeExtent[1].getTime();
        
        if (this.lastTimeRange) {
            const [oldMin, oldMax] = this.lastTimeRange;
            if (oldMin !== newMin || oldMax !== newMax) {
                this.selectedStartDate = null;
                this.selectedEndDate = null;
            }
        }
        this.lastTimeRange = [newMin, newMax];

        this.xScale = d3.scaleTime()
            .domain(timeExtent)
            .range([0, chartWidth]);
            
        // Group by series
        const seriesGroups = d3.group(this.data, d => d.series || "default");
        const seriesNames = Array.from(seriesGroups.keys());
        const isMultiSeries = seriesNames.length > 1 || (seriesNames.length === 1 && seriesNames[0] !== "default");
        
        // Y Scales
        const yScales = new Map<string, d3.ScaleLinear<number, number>>();
        
        seriesGroups.forEach((points, series) => {
            // Filter out null values for min/max calculation
            const validPoints = points.filter(d => d.value !== null);
            let yMin = d3.min(validPoints, d => d.value!) || 0;
            let yMax = d3.max(validPoints, d => d.value!) || 1;
            
            // Apply settings if single series
            if (!isMultiSeries) {
                const yMinSetting = this.formattingSettings?.yAxisSettingsCard?.yAxisMin?.value;
                const yMaxSetting = this.formattingSettings?.yAxisSettingsCard?.yAxisMax?.value;
                if (yMinSetting && !isNaN(parseFloat(yMinSetting))) yMin = parseFloat(yMinSetting);
                if (yMaxSetting && !isNaN(parseFloat(yMaxSetting))) yMax = parseFloat(yMaxSetting);
            }
            
            // Padding
            if (yMin === yMax) {
                yMin -= 1;
                yMax += 1;
            } else {
                const padding = (yMax - yMin) * 0.1;
                yMin -= padding;
                yMax += padding;
            }
            
            const scale = d3.scaleLinear()
                .domain([yMin, yMax])
                .range([chartHeight, 0]);
            yScales.set(series, scale);
        });
        
        if (yScales.size > 0) {
            this.yScale = yScales.values().next().value;
        } else {
            this.yScale = d3.scaleLinear().range([chartHeight, 0]);
        }
            
        // Position groups
        this.chartGroup.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        this.brushGroup.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        this.markersGroup.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        this.axisGroup.attr("transform", `translate(${this.margin.left}, ${this.margin.top + chartHeight})`);
        
        // Render Content
        this.chartGroup.selectAll("*").remove();
        this.markersGroup.selectAll("*").remove();
        
        // Background
        this.chartGroup.append("rect")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("fill", isHighContrast ? background : "#fafafa");
            
        // Render Series
        const showArea = this.formattingSettings?.areaSettingsCard?.showAreaChart?.value ?? true;
        const areaOpacity = (this.formattingSettings?.areaSettingsCard?.areaOpacity?.value ?? 50) / 100;
        const lineWidth = this.formattingSettings?.lineSettingsCard?.lineWidth?.value ?? 1.5;
        
        seriesGroups.forEach((points, series) => {
            const yScale = yScales.get(series)!;
            let defaultLineColor: string;
            let defaultAreaColor: string;
            
            // Try to find the color in the settings
            const seriesSlice = this.formattingSettings.seriesSettingsCard.slices.find(s => s.displayName === series) as formattingSettings.ColorPicker;
            if (seriesSlice && seriesSlice.value) {
                defaultLineColor = seriesSlice.value.value;
                defaultAreaColor = seriesSlice.value.value;
            } else if (isMultiSeries) {
                defaultLineColor = this.host.colorPalette.getColor(series).value;
                defaultAreaColor = this.host.colorPalette.getColor(series).value;
            } else {
                // Default line color from settings or palette
                defaultLineColor = this.formattingSettings?.lineSettingsCard?.lineColor?.value?.value || this.host.colorPalette.getColor("1").value;
                defaultAreaColor = this.formattingSettings?.areaSettingsCard?.areaColor?.value?.value || this.host.colorPalette.getColor("0").value;
                if (isHighContrast) {
                    defaultLineColor = foreground;
                    defaultAreaColor = foreground;
                }
            }
            
            // Area - render as individual segments between consecutive points
            if (showArea) {
                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    
                    // Skip if either point has null value
                    if (p1.value === null || p1.value === undefined || p2.value === null || p2.value === undefined) {
                        continue;
                    }
                    
                    // Get color for this segment - use conditional formatting color if available
                    const segmentColor = p1.areaColor || defaultAreaColor;
                    
                    // Create a small area segment between two points
                    const areaData = [p1, p2];
                    const area = d3.area<TimeDataPoint>()
                        .x(d => this.xScale(d.timestamp))
                        .y0(chartHeight)
                        .y1(d => yScale(d.value!));
                        
                    this.chartGroup.append("path")
                        .datum(areaData)
                        .attr("fill", segmentColor)
                        .attr("fill-opacity", areaOpacity)
                        .attr("d", area);
                }
            }
            
            // Line - group consecutive segments by color for better performance
            const colorSegments = new Map<string, Array<{x: number, y: number}>>();
            
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                
                // Skip null values
                if (p.value === null || p.value === undefined) {
                    continue;
                }
                
                // Get color for this point
                const color = p.lineColor || defaultLineColor;
                
                // Add point to the appropriate color segment
                if (!colorSegments.has(color)) {
                    colorSegments.set(color, []);
                }
                colorSegments.get(color)!.push({
                    x: this.xScale(p.timestamp),
                    y: yScale(p.value!)
                });
            }
            
            // Render each color segment as a single path
            colorSegments.forEach((pathPoints, color) => {
                if (pathPoints.length < 2) return; // Need at least 2 points for a line
                
                // Build path data string
                let pathData = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
                for (let i = 1; i < pathPoints.length; i++) {
                    pathData += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
                }
                
                this.chartGroup.append("path")
                    .attr("d", pathData)
                    .attr("stroke", color)
                    .attr("stroke-width", lineWidth)
                    .attr("stroke-linecap", "round")
                    .attr("fill", "none");
            });
        });
        
        // Render Anomalies
        const anomalyPoints = this.data.filter(d => d.anomaly !== undefined);
        if (anomalyPoints.length > 0) {
            const markerType = this.formattingSettings?.anomaliesSettingsCard?.markerType?.value?.value || "circle";
            const markerSize = this.formattingSettings?.anomaliesSettingsCard?.markerSize?.value || 5;
            const markerColor = this.formattingSettings?.anomaliesSettingsCard?.markerColor?.value?.value || "#FF0000";
            const markerOpacity = (this.formattingSettings?.anomaliesSettingsCard?.markerOpacity?.value ?? 60) / 100;
            
            const symbol = d3.symbol().size(markerSize * markerSize * 4);
            switch (markerType) {
                case "square": symbol.type(d3.symbolSquare); break;
                case "triangle": symbol.type(d3.symbolTriangle); break;
                case "diamond": symbol.type(d3.symbolDiamond); break;
                default: symbol.type(d3.symbolCircle); break;
            }
            
            this.chartGroup.selectAll(".anomaly-marker")
                .data(anomalyPoints)
                .enter()
                .append("path")
                .attr("class", "anomaly-marker")
                .attr("d", symbol)
                .attr("transform", d => {
                    const yScale = yScales.get(d.series || "default") || this.yScale;
                    return `translate(${this.xScale(d.timestamp)}, ${yScale(d.anomaly!)})`;
                })
                .attr("fill", markerColor)
                .style("opacity", markerOpacity)
                .attr("stroke", "none");
        }
        
        // Render Timeline Markers
        // Filter unique markers by timestamp to avoid duplicates from multiple series
        const uniqueMarkers = new Map<number, TimeDataPoint>();
        this.data.forEach(d => {
            if (d.timelineMarker !== undefined) {
                uniqueMarkers.set(d.timestamp.getTime(), d);
            }
        });
        const timelinePoints = Array.from(uniqueMarkers.values());

        if (timelinePoints.length > 0) {
            const lineColor = this.formattingSettings?.timelineMarkerSettingsCard?.lineColor?.value?.value || "#000000";
            const lineWidth = this.formattingSettings?.timelineMarkerSettingsCard?.lineWidth?.value || 1;
            const lineOpacity = (this.formattingSettings?.timelineMarkerSettingsCard?.lineOpacity?.value ?? 60) / 100;
            const markerType = this.formattingSettings?.timelineMarkerSettingsCard?.markerType?.value?.value || "triangleDown";
            const markerSize = this.formattingSettings?.timelineMarkerSettingsCard?.markerSize?.value || 8;
            const markerColor = this.formattingSettings?.timelineMarkerSettingsCard?.markerColor?.value?.value || "#000000";
            const markerOpacity = (this.formattingSettings?.timelineMarkerSettingsCard?.markerOpacity?.value ?? 60) / 100;
            const position = this.formattingSettings?.timelineMarkerSettingsCard?.markerPosition?.value?.value || "top";
            
            const markerY = position === "top" ? 0 : chartHeight;
            
            // Lines
            this.markersGroup.selectAll(".timeline-line")
                .data(timelinePoints)
                .enter()
                .append("line")
                .attr("class", "timeline-line")
                .attr("x1", d => this.xScale(d.timestamp))
                .attr("x2", d => this.xScale(d.timestamp))
                .attr("y1", 0)
                .attr("y2", chartHeight)
                .attr("stroke", lineColor)
                .attr("stroke-width", lineWidth)
                .style("opacity", lineOpacity)
                .style("pointer-events", "none"); // Allow clicking through the line
                
            // Markers
            const symbol = d3.symbol().size(markerSize * markerSize * 4);
            switch (markerType) {
                case "triangleUp": symbol.type(d3.symbolTriangle); break;
                case "circle": symbol.type(d3.symbolCircle); break;
                case "square": symbol.type(d3.symbolSquare); break;
                default: symbol.type(d3.symbolTriangle); break;
            }
            
            this.markersGroup.selectAll(".timeline-marker")
                .data(timelinePoints)
                .enter()
                .append("path")
                .attr("class", "timeline-marker")
                .attr("d", symbol)
                .attr("transform", d => {
                    let rot = 0;
                    if (markerType === "triangleDown") rot = 180;
                    return `translate(${this.xScale(d.timestamp)}, ${markerY}) rotate(${rot})`;
                })
                .attr("fill", markerColor)
                .style("opacity", markerOpacity)
                .style("cursor", "pointer"); // Show pointer cursor

            this.tooltipServiceWrapper.addTooltip(
                this.markersGroup.selectAll(".timeline-marker"),
                (tooltipEvent: TimeDataPoint) => {
                    return [{
                        displayName: "Timeline Marker",
                        value: tooltipEvent.timelineMarker || ""
                    }, {
                        displayName: "Time",
                        value: tooltipEvent.timestamp.toLocaleString()
                    }];
                }
            );
        }

        this.renderAxis(showAxis, chartWidth);
        this.setupBrush(chartWidth, chartHeight);
        
        // Initialize or restore selection
        if (this.selectedStartDate && this.selectedEndDate) {
            this.restoreBrushSelection();
        } else {
            this.selectedStartDate = timeExtent[0];
            this.selectedEndDate = timeExtent[1];
            this.updateRangeDisplay();
            
            // Force brush selection to full range to ensure filter is applied
            // This is critical when data range changes or on first load
            this.brushGroup.call(this.brush.move as any, [0, chartWidth]);
        }
    }

    private parseData(dataViews: DataView[] | undefined): void {
        this.data = [];
        
        if (!dataViews || !dataViews[0]) return;
        
        const dataView = dataViews[0];
        if (!dataView.categorical) return;
        
        const categorical = dataView.categorical;
        const categories = categorical.categories;
        const values = categorical.values;
        
        if (!categories || categories.length === 0 || !values) return;
        
        const timestampCategory = categories.find(c => c.source.roles && c.source.roles.timestamp);
        if (!timestampCategory) return;
        
        const timestamps = timestampCategory.values;
        
        // Validate timestamp data exists
        if (!timestamps || timestamps.length === 0) return;
        
        // Helper to parse dates with proper typing
        const parseDate = (ts: unknown): number | null => {
            try {
                let date: Date;
                if (ts instanceof Date) {
                    date = ts;
                } else if (typeof ts === "number") {
                    date = new Date(ts);
                } else if (typeof ts === "string") {
                    date = new Date(ts);
                } else {
                    return null;
                }
                const time = date.getTime();
                return isNaN(time) ? null : time;
            } catch (error) {
                // Invalid date format, skip this data point
                return null;
            }
        };

        // Iterate over groups (Series)
        const groups = values.grouped();
        
        // Collect all timeline markers from all groups to ensure we don't miss them
        // if they are not present in every series group
        const globalMarkers = new Map<number, string>();
        
        // First pass: find all markers
        groups.forEach(group => {
            const timelineMarkerMeasure = group.values.find(v => v.source.roles && v.source.roles.timelineMarkers);
            if (timelineMarkerMeasure) {
                for (let i = 0; i < timestamps.length; i++) {
                    const time = parseDate(timestamps[i]);
                    if (time === null) continue;
                    
                    if (timelineMarkerMeasure.values[i]) {
                        const m = String(timelineMarkerMeasure.values[i]);
                        if (m && m.trim() !== "") {
                            globalMarkers.set(time, m);
                        }
                    }
                }
            }
        });

        groups.forEach(group => {
            const seriesName = group.name ? String(group.name) : "default";
            
            // Find measures in this group
            const valueMeasure = group.values.find(v => v.source.roles && v.source.roles.values);
            const anomalyMeasure = group.values.find(v => v.source.roles && v.source.roles.anomalies);
            // We use global markers now
            
            for (let i = 0; i < timestamps.length; i++) {
                const time = parseDate(timestamps[i]);
                if (time === null) continue;
                
                let val: number | null = null;
                let hasValue = false;
                if (valueMeasure && valueMeasure.values[i] != null) {
                    const rawVal = valueMeasure.values[i];
                    if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
                        const parsed = Number(rawVal);
                        if (!isNaN(parsed)) {
                            val = parsed;
                            hasValue = true;
                        }
                    }
                }
                
                let anomaly: number | undefined = undefined;
                if (anomalyMeasure && anomalyMeasure.values[i] != null) {
                    const rawAnomaly = anomalyMeasure.values[i];
                    if (rawAnomaly !== null && rawAnomaly !== undefined && rawAnomaly !== "") {
                        anomaly = Number(rawAnomaly);
                    }
                }
                
                // Create selection ID for this data point
                const selectionId = this.host.createSelectionIdBuilder()
                    .withCategory(timestampCategory, i)
                    .createSelectionId();
                
                // Extract conditional formatting colors from category objects
                let lineColor: string | undefined = undefined;
                let areaColor: string | undefined = undefined;
                
                // Colors are stored in category.objects[index] for conditional formatting
                if (timestampCategory && timestampCategory.objects && timestampCategory.objects[i]) {
                    const obj = timestampCategory.objects[i];
                    
                    // Check for line color conditional formatting
                    if (obj && obj["dataPoint"]) {
                        const dataPointObj = obj["dataPoint"];
                        if (dataPointObj && dataPointObj["fill"]) {
                            const colorObj = dataPointObj["fill"];
                            if (colorObj && colorObj["solid"] && colorObj["solid"]["color"]) {
                                lineColor = colorObj["solid"]["color"] as string;
                            }
                        }
                    }
                    
                    // Check for area color conditional formatting
                    if (obj && obj["areaSettingsGroup"]) {
                        const areaSettingsGroupObj = obj["areaSettingsGroup"];
                        if (areaSettingsGroupObj && areaSettingsGroupObj["fill"]) {
                            const colorObj = areaSettingsGroupObj["fill"];
                            if (colorObj && colorObj["solid"] && colorObj["solid"]["color"]) {
                                areaColor = colorObj["solid"]["color"] as string;
                            }
                        }
                    }
                }
                
                // Use global marker if available for this timestamp
                const marker = globalMarkers.get(time);
                
                // Always add the point to preserve time continuity and allow for gaps (null values)
                // This ensures d3.line().defined() works correctly to show gaps
                this.data.push({
                    timestamp: new Date(time),
                    value: val,
                    series: seriesName,
                    anomaly: anomaly,
                    timelineMarker: marker,
                    selectionId: selectionId,
                    lineColor: lineColor,
                    areaColor: areaColor,
                    index: i
                });
            }
        });
        
        // Post-processing for Timeline Markers:
        // If a marker exists at a timestamp for ANY series, it should probably be shown?
        // Or should we only show it if it exists for the specific series?
        // The user says "Timeline markers appear when there are no values in the Series well, but they are not rendered when a field is dropped into the series well."
        // This suggests the marker measure is returning null within the series context.
        // We can try to consolidate markers: if we find a marker at timestamp T in ANY series, we can promote it?
        // But let's first ensure we are capturing it correctly.
        
        // Post-process to detect gaps
        // Group by series
        const seriesMap = new Map<string, TimeDataPoint[]>();
        this.data.forEach(d => {
            const s = d.series || "default";
            if (!seriesMap.has(s)) seriesMap.set(s, []);
            seriesMap.get(s)!.push(d);
        });
        
        const newData: TimeDataPoint[] = [];
        
        seriesMap.forEach((points, series) => {
            // Sort points
            points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            
            if (points.length < 2) {
                newData.push(...points);
                return;
            }
            
            // Calculate median time difference
            const diffs: number[] = [];
            for (let i = 1; i < points.length; i++) {
                const diff = points[i].timestamp.getTime() - points[i-1].timestamp.getTime();
                if (diff > 0) diffs.push(diff);
            }
            diffs.sort((a, b) => a - b);
            
            let medianDiff = 0;
            if (diffs.length > 0) {
                medianDiff = diffs[Math.floor(diffs.length / 2)];
            }
            
            // Threshold for gap (e.g., 3x median)
            // If median is 0 (duplicate timestamps), use next smallest?
            // If median is very small, 3x might be too aggressive.
            const gapThreshold = medianDiff > 0 ? medianDiff * 3 : 0; 
            
            newData.push(points[0]);
            for (let i = 1; i < points.length; i++) {
                const prev = points[i-1];
                const curr = points[i];
                const diff = curr.timestamp.getTime() - prev.timestamp.getTime();
                
                // Only insert gap if we have a valid threshold and the diff is significantly larger
                if (gapThreshold > 0 && diff > gapThreshold) {
                    // Insert null point to break the line - create a dummy selection ID
                    const gapSelectionId = this.host.createSelectionIdBuilder().createSelectionId();
                    newData.push({
                        timestamp: new Date(prev.timestamp.getTime() + medianDiff), // Just after prev
                        value: null,
                        series: series,
                        anomaly: undefined,
                        timelineMarker: undefined,
                        selectionId: gapSelectionId,
                        index: -1
                    });
                }
                newData.push(curr);
            }
        });
        
        this.data = newData;
        this.data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    private renderZeroLine(width: number, height: number): void {
        const showZeroLine = this.formattingSettings?.yAxisSettingsCard?.showZeroLine?.value ?? true;
        
        // Check if 0 is in domain
        const domain = this.yScale.domain();
        const min = Math.min(domain[0], domain[1]);
        const max = Math.max(domain[0], domain[1]);
        
        if (!showZeroLine || min > 0 || max < 0) {
            return;
        }
        
        const zeroY = this.yScale(0);
        const color = this.formattingSettings?.yAxisSettingsCard?.zeroLineColor?.value?.value ?? "#333333";
        const strokeWidth = this.formattingSettings?.yAxisSettingsCard?.zeroLineStrokeWidth?.value ?? 1;
        
        this.chartGroup.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", zeroY)
            .attr("y2", zeroY)
            .attr("stroke", color)
            .attr("stroke-width", strokeWidth)
            .style("pointer-events", "none");
    }

    private renderAreaChart(width: number, height: number): void {
        this.chartGroup.selectAll("*").remove();
        
        const showArea = this.formattingSettings?.areaSettingsCard?.showAreaChart?.value ?? true;
        const isHighContrast = this.host.colorPalette.isHighContrast;
        const foreground = this.host.colorPalette.foreground.value;
        const background = this.host.colorPalette.background.value;
        
        if (!showArea || this.data.length === 0) {
            // Draw a simple background rect for the brush area
            this.chartGroup.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", isHighContrast ? background : "#f9f9f9");
            return;
        }
        
        let areaColor = this.formattingSettings?.areaSettingsCard?.areaColor?.value?.value || this.host.colorPalette.getColor("0").value;
        const areaOpacity = (this.formattingSettings?.areaSettingsCard?.areaOpacity?.value ?? 50) / 100;
        let lineColor = this.host.colorPalette.getColor("1").value;
        
        if (isHighContrast) {
            areaColor = foreground;
            lineColor = foreground;
        }
        
        // Background
        this.chartGroup.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", isHighContrast ? background : "#fafafa");
        
        // Determine baseline for area
        const domain = this.yScale.domain();
        const min = Math.min(domain[0], domain[1]);
        const max = Math.max(domain[0], domain[1]);
        
        let y0 = height; // Default to bottom
        if (min > 0) {
            y0 = this.yScale(min); // Bottom of chart (which is height usually, but let's be safe)
        } else if (max < 0) {
            y0 = this.yScale(max); // Top of chart
        } else {
            y0 = this.yScale(0); // Zero line
        }

        // Area generator
        let area: d3.Area<TimeDataPoint>;

        area = d3.area<TimeDataPoint>()
            .x(d => this.xScale(d.timestamp))
            .y0(y0)
            .y1(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);
            
        // Draw area
        const path = this.chartGroup.append("path")
            .datum(this.data)
            .attr("fill", areaColor)
            .attr("fill-opacity", areaOpacity)
            .attr("d", area);
            
        // Draw line(s)
        const line = d3.line<TimeDataPoint>()
            .x(d => this.xScale(d.timestamp))
            .y(d => this.yScale(d.value))
            .curve(d3.curveMonotoneX);
            
        this.chartGroup.append("path")
            .datum(this.data)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Add tooltips
        this.tooltipServiceWrapper.addTooltip(
            this.chartGroup.selectAll("path"),
            (tooltipEvent: TimeDataPoint) => {
                // For area chart, we might want to show the range or just "Time Series"
                // Since it's a continuous path, this tooltip will show for the whole shape
                return [{
                    displayName: "Data Points",
                    value: this.data.length.toString()
                }];
            }
        );
    }

    private renderAxis(show: boolean, width: number): void {
        this.axisGroup.selectAll("*").remove();
        
        if (!show || !this.xScale) {
            return;
        }
        
        const xAxis = d3.axisBottom(this.xScale)
            .ticks(Math.max(2, Math.floor(width / 80)))
            .tickSizeOuter(0);
            
        this.axisGroup.call(xAxis);
        
        const isHighContrast = this.host.colorPalette.isHighContrast;
        const foreground = this.host.colorPalette.foreground.value;

        let axisColor = this.formattingSettings?.axisSettingsCard?.axisColor?.value?.value ?? "#666666";
        if (isHighContrast) {
            axisColor = foreground;
        }

        const axisFontSize = this.formattingSettings?.axisSettingsCard?.axisFontSize?.value ?? 10;
        const axisFontFamily = this.formattingSettings?.axisSettingsCard?.axisFontFamily?.value ?? "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif";
        
        // Style axis
        this.axisGroup.selectAll("text")
            .style("font-size", `${axisFontSize}px`)
            .style("font-family", axisFontFamily)
            .style("fill", axisColor);
        this.axisGroup.selectAll("line")
            .style("stroke", isHighContrast ? foreground : "#ccc");
        this.axisGroup.select(".domain")
            .style("stroke", isHighContrast ? foreground : "#999");
    }

    private setupBrush(width: number, height: number): void {
        const isHighContrast = this.host.colorPalette.isHighContrast;
        const foreground = this.host.colorPalette.foreground.value;

        let brushColor = this.formattingSettings?.brushSettingsCard?.brushColor?.value?.value || this.host.colorPalette.getColor("2").value;
        if (isHighContrast) {
            brushColor = foreground;
        }
        
        const brushOpacity = (this.formattingSettings?.brushSettingsCard?.brushOpacity?.value ?? 30) / 100;
        
        // Check if brush needs recreation
        const dimensionsChanged = Math.abs(this.lastBrushWidth - width) > 5 || 
                                 Math.abs(this.lastBrushHeight - height) > 5;
        const brushElementsExist = this.brushGroup.select(".overlay").size() > 0;
        
        if (!this.brush || dimensionsChanged || !brushElementsExist) {
            // Remove existing brush only if recreating
            this.brushGroup.selectAll("*").remove();
            
            // Store new dimensions
            this.lastBrushWidth = width;
            this.lastBrushHeight = height;
            
            // Create brush with event handlers bound once
            this.brush = d3.brushX()
                .extent([[0, 0], [width, height]])
                .on("brush", (event) => this.onBrush(event))
                .on("end", (event) => this.onBrushEnd(event));
                
            // Add brush to group
            this.brushGroup.call(this.brush);
        } else {
            // Just update the extent without recreating handlers
            this.brush.extent([[0, 0], [width, height]]);
            // Re-apply brush to ensure DOM elements exist
            this.brushGroup.call(this.brush);
        }
        
        // Always update brush styling
        const brushG = this.brushGroup;
        
        // Style the brush overlay (makes it visible)
        brushG.select(".overlay")
            .attr("fill", "transparent")
            .attr("cursor", "crosshair");
        
        // Style the brush selection
        brushG.select(".selection")
            .attr("fill", brushColor)
            .attr("fill-opacity", brushOpacity)
            .attr("stroke", brushColor)
            .attr("stroke-width", 2);
            
        // Style the handles
        brushG.selectAll(".handle")
            .attr("fill", brushColor)
            .attr("fill-opacity", 1)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);
    }

    private onBrush(event: d3.D3BrushEvent<unknown>): void {
        if (!event.selection || !this.xScale) {
            return;
        }
        
        const [x0, x1] = event.selection as [number, number];
        this.selectedStartDate = this.xScale.invert(x0);
        this.selectedEndDate = this.xScale.invert(x1);
        
        // Debounce display update to reduce CPU usage during brushing
        if (this.brushUpdateTimeout !== null) {
            clearTimeout(this.brushUpdateTimeout);
        }
        
        this.brushUpdateTimeout = setTimeout(() => {
            this.updateRangeDisplay();
            this.brushUpdateTimeout = null;
        }, 16) as any; // ~60fps = 16ms
    }

    private onBrushEnd(event: d3.D3BrushEvent<unknown>): void {
        if (!event.selection && this.xScale) {
            // If brush is cleared, select full range
            const domain = this.xScale.domain();
            this.selectedStartDate = domain[0];
            this.selectedEndDate = domain[1];
            this.updateRangeDisplay();
        }
        
        // Skip filter application if this is a programmatic update (prevents infinite loop)
        if (this.isProgrammaticBrushUpdate) {
            return;
        }
        
        // Apply filter only for user-initiated brush changes
        if (this.selectedStartDate && this.selectedEndDate && this.filterColumnTarget) {
            try {
                const delimiter = this.formattingSettings?.outputSettingsCard?.delimiter?.value ?? "|";
                const useISO = this.formattingSettings?.outputSettingsCard?.useISOFormat?.value ?? true;
                
                let outStart: string, outEnd: string;
                if (useISO) {
                    outStart = this.selectedStartDate.toISOString();
                    outEnd = this.selectedEndDate.toISOString();
                } else {
                    const outFormat = this.formattingSettings?.outputSettingsCard?.outputFormat?.value ?? "yyyy-MM-dd HH:mm:ss";
                    const outFormatter = this.createDateFormatter(outFormat);
                    outStart = outFormatter(this.selectedStartDate);
                    outEnd = outFormatter(this.selectedEndDate);
                }
                
                const filterValue = `${outStart}${delimiter}${outEnd}`;
                
                const target = {
                    table: this.filterColumnTarget.table,
                    column: this.filterColumnTarget.column
                };
            
                const conditions: IAdvancedFilterCondition[] = [
                    {
                        operator: "Is",
                        value: filterValue
                    }
                ];
            
                const filter = new AdvancedFilter(target, "And", conditions);
            
                this.host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
            } catch (error) {
                // Filter application failed - log to console for debugging but don't crash the visual
                console.error("Failed to apply filter:", error);
            }
        }
    }

    private restoreBrushSelection(): void {
        if (!this.selectedStartDate || !this.selectedEndDate || !this.brush || !this.xScale) {
            return;
        }
        
        const x0 = this.xScale(this.selectedStartDate);
        const x1 = this.xScale(this.selectedEndDate);
        
        // Set flag to prevent filter application during programmatic update
        this.isProgrammaticBrushUpdate = true;
        
        // Use call with the brush.move to set initial selection
        this.brushGroup.call(this.brush.move as any, [x0, x1]);
        this.updateRangeDisplay();
        
        // Reset flag after a short delay to allow event handlers to complete
        setTimeout(() => {
            this.isProgrammaticBrushUpdate = false;
        }, 50);
    }

    private updateRangeDisplay(): void {
        if (!this.selectedStartDate || !this.selectedEndDate) {
            this.rangeDisplay.textContent = "Select a time range";
            return;
        }
        
        const displayFormat = this.formattingSettings?.displaySettingsCard?.dateFormat?.value ?? "MMM d, yyyy HH:mm:ss";
        const prefix = this.formattingSettings?.displaySettingsCard?.prefix?.value ?? "Effective Range";
        const formatter = this.createDateFormatter(displayFormat);
        
        const startStr = formatter(this.selectedStartDate);
        const endStr = formatter(this.selectedEndDate);
        
        const prefixText = prefix ? `${prefix}: ` : "";
        this.rangeDisplay.textContent = `${prefixText}${startStr} — ${endStr}`;
    }

    private createDateFormatter(format: string): (date: Date) => string {
        // Check cache first
        if (this.dateFormatterCache.has(format)) {
            return this.dateFormatterCache.get(format)!;
        }
        
        // Create new formatter
        const formatter = (date: Date) => {
            const pad = (n: number, len: number = 2) => n.toString().padStart(len, "0");
            
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            
            let result = format;
            
            result = result.replace(/yyyy/g, date.getFullYear().toString());
            result = result.replace(/yy/g, date.getFullYear().toString().slice(-2));
            result = result.replace(/MMMM/g, fullMonths[date.getMonth()]);
            result = result.replace(/MMM/g, months[date.getMonth()]);
            result = result.replace(/MM/g, pad(date.getMonth() + 1));
            result = result.replace(/M(?![a-z])/g, (date.getMonth() + 1).toString());
            result = result.replace(/dd/g, pad(date.getDate()));
            result = result.replace(/d(?![a-z])/g, date.getDate().toString());
            result = result.replace(/HH/g, pad(date.getHours()));
            result = result.replace(/H(?![a-z])/g, date.getHours().toString());
            result = result.replace(/hh/g, pad(date.getHours() % 12 || 12));
            result = result.replace(/h(?![a-z])/g, (date.getHours() % 12 || 12).toString());
            result = result.replace(/mm/g, pad(date.getMinutes()));
            result = result.replace(/m(?![a-z])/g, date.getMinutes().toString());
            result = result.replace(/ss/g, pad(date.getSeconds()));
            result = result.replace(/s(?![a-z])/g, date.getSeconds().toString());
            result = result.replace(/fff/g, pad(date.getMilliseconds(), 3));
            result = result.replace(/tt/g, date.getHours() >= 12 ? "PM" : "AM");
            result = result.replace(/t/g, date.getHours() >= 12 ? "P" : "A");
            
            return result;
        };
        
        // Cache the formatter for reuse
        this.dateFormatterCache.set(format, formatter);
        return formatter;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
    
    public destroy(): void {
        // Clear any pending timeouts
        if (this.brushUpdateTimeout !== null) {
            clearTimeout(this.brushUpdateTimeout);
            this.brushUpdateTimeout = null;
        }
        
        // Clean up event listeners to prevent memory leaks
        if (this.svgContainer && this.contextMenuHandler) {
            this.svgContainer.removeEventListener("contextmenu", this.contextMenuHandler);
        }
        
        // Remove brush event handlers
        if (this.brush) {
            this.brush.on("brush", null);
            this.brush.on("end", null);
        }
        
        // Clear D3 selections to help garbage collection
        if (this.svg) {
            this.svg.selectAll("*").remove();
        }
        
        // Clear data references
        this.data = [];
        this.dataView = null;
        
        // Clear caches
        this.dateFormatterCache.clear();
        
        // Nullify references to help GC
        this.xScale = null as any;
        this.yScale = null as any;
        this.brush = null as any;
    }
}