# Time Series Analysis with KQL Database - Power BI Project

## Overview

This solution shows how to analyze time series data in Power BI using an interactive brush-based selection combined with a KQL Database in Microsoft Fabric (or Azure Data Explorer). Simply select what metrics to analyze, select an initial time period, and choose how to lay out your charts. Then, drag the time-brushing controls to select a time range -- with your visuals updating intantly, even when working with billions of rows. This example uses tag-basd data, which is common in operational and industrial control scenarios (yet, this solution can be adapted to numerous other time-series analytics scenarios). 

![Time Series Analysis in Power BI - Report Screenshot](/assets/Time-Series-Analysis-PBI-Screenshot.png)

## What You Can Do

### Interactive Time Selection
- **Start by choosing a time period** using relative time period filters or custom date ranges.
- **Zoom into** any time range on the timeline chart
- **See the full context** including anomalies and timeline markers for important events.
- **All visuals update** automatically when you change the time range

### Rich Time Series Visualization
- **Intelligent binning of high-density** time series into adaptive time spans allow working with billions of data point.
- **Compare multiple metrics** for multiple assets, metrics and tags side by side
- **Choose aggregation** (average, sum, min, max) and time granularity
- **Detect anomalies** automatically highlighted on your charts
- **View descriptive statistics and correlations** between different time series
- **Contextutalize time series data** with details about asset hierarchies and tag metadata
- **Intuitive chart layouts** help you identify trends in your data.

## About the Time Series Brush Slicer

The [Time Series Brush Slicer](/dist/TimeSeriesBrushSlicerEFF0BAA64FAF4DC989E3AB4DE7610647.1.0.0.0.pbiviz) custom visual is the heart of the interactive experience. It displays your time series data as a chart and lets you brush (drag) to select time ranges.

### What It Shows
- **Line and area charts** with customizable colors and styles
- **Anomaly markers** highlighting unusual data points
- **Timeline markers** for important events
- **Multiple series** compared on the same chart
- **Gaps in data** automatically detected and displayed

### Visual Customization
Style the visual to match your needs:
- **Chart appearance**: Line width, colors, area fill, opacity
- **Axes**: Show/hide, fonts, colors, min/max values
- **Brush overlay**: Selection color and transparency
- **Conditional formatting**: Color segments by value thresholds

### How It Filters Data
When you select a time range, the visual outputs a text string (like `"2017-04-20|2017-04-30"`) that can be used as a Dynamic M Query Parameter in Power BI. This parameter is used in queries sent to the KQL database to filters all other visuals in the report, ensuring only data from your selected time period is displayed.

## How It Works with KQL Database

The report uses DirectQuery mode to query a KQL Database in real-time. Here's the simplified flow:

1. **You select a time range** by brushing on the visual
2. **The visual outputs a text parameter** with your selected dates
3. **Power Query parses the parameter** and builds a KQL query with filters
4. **KQL Database processes everything** at the source—filtering, aggregating, detecting anomalies
5. **Only the results come back** to Power BI, not the raw data

### Why This Is Fast
- **Filtered at the source**: The KQL Database only processes data in your selected time range
- **Processed server-side**: Aggregations, binning, and calculations happen in the database
- **Minimal data transfer**: Only summarized results flow to Power BI
- **Automatic optimization**: The report adjusts time granularity based on your selections to keep performance smooth

### Parameters You Can Adjust
Control the analysis through report parameters:
- **Time range**: Brush selection or relative periods (last 7 days, last hour, etc.)
- **Metrics**: Select which time series to analyze
- **Aggregation**: Choose how to summarize data (average, sum, min, max)
- **Time granularity**: Auto or specific (1min, 1hour, 1day, etc.)
- **Max data points**: Balance detail with performance (100-5000 points)

## Getting Started

**Prerequisites:**
- Power BI Desktop or access to the Power BI service
- Access to a KQL Database (Microsoft Fabric or Azure Data Explorer)
- This sample solution uses the publicly-accessible KQL Database with sample data:
    - Cluster: **https://help.kusto.windows.net/**
    - Database: **Trender**


**Try the Example:**
1. Open `Time Series Analysis - PBI+KQL.pbip` in Power BI Desktop
2. Provide credentials for your Microsoft account to sign into the publicly-available Azure Data Explorer cluster (https://help.kusto.windows.net/)
3. Refresh and start exploring—drag the brush to select time ranges and watch the report update
4. Publish the report to your Power BI or Fabric workspace to share with others

**Use With Your Data:**
1. Open `Time Series Analysis - PBI+KQL.pbip` in Power BI Desktop
2. Set the `p_kql_cluster` and `p_kql_db` parameters to your KQL Database
3. Update the KQL queries in the semantic model to point to your time series tables
4. Adjust the parameter tables (Tags, RelativeTime, etc.) for your metrics
5. Customize the visuals to show what matters most to you

## Learn More

- **Custom Visual**: [Time-Series-Brush-Slicer on GitHub](https://github.com/slavatrofimov/Time-Series-Brush-Slicer)
- **KQL Documentation**: [Kusto Query Language](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- **Power BI DirectQuery**: [DirectQuery Guide](https://docs.microsoft.com/power-bi/connect-data/desktop-directquery-about)
- **Advanced Parameterization**: [Power BI Dynamic M Query Parameters](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-dynamic-m-query-parameters)