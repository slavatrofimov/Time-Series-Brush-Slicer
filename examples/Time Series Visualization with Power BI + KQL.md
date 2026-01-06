# Time Series Visualization with Power BI and KQL Databases
Last updated: 2025-01-06

## Overview

This solution accelerator helps you analyze time series data in Power BI using an interactive brush-based selection experience combined with a KQL Database in Microsoft Fabric (or Azure Data Explorer). Simply select what metrics to analyze, select an initial time period, and choose how to lay out your charts. Then, drag the time-brushing controls to select any portion of the time range with your visuals updating instantly, even when working with billions of rows. 

https://github.com/user-attachments/assets/cdfc3887-a217-4b70-b096-5896e2596bff

This solution accelerator uses tag-based data, which is common in operational and industrial control scenarios (a *tag* is just an identifier for an instrument or device). Yet, this solution can be adapted to numerous other time-series analytics scenarios. 

This solution accelerator includes two Power BI projects:
1. [Time Series Viz - Basic](/examples/Time%20Series%20Viz%20-%20Basic/) - demonstrates the core time series visualization concepts and can be easily customized to work with your data with minimal skill and effort.
1. [Time Series Viz - Advanced](/examples/Time%20Series%20Viz%20-%20Advanced/) - demonstrates a broader range of capabilities and offers more flexibility with customization. Yet, it requires more effort and higher technical proficiency to adapt to your data.

## Capabilities and Architecture

### What You Can Do

#### Interactive Time Selection
- **Start by choosing a time period** using relative time period filters or custom date ranges.
- **Zoom into** any time range on the timeline chart.
- **See the full context** including anomalies and timeline markers for important events.
- **All visuals update** automatically when you change the time range.

#### Rich Time Series Visualization
- **Intelligent binning of high-density** time series into adaptive time spans allows working with billions of data points.
- **Compare multiple metrics** for multiple assets, metrics and tags side by side.
- **Choose aggregation** (average, sum, min, max) and time granularity.
- **Detect anomalies** and highlight them on your charts.
- **View descriptive statistics and correlations** between different time series.
- **Contextualize time series data** with details about asset hierarchies and tag metadata.
- **Intuitive chart layouts** help you identify trends, patterns and relationships in your data.

### Solution Components
- **KQL Database** in Fabric (or Azure Data Explorer) provides highly scalable and performant time series storage, processing and query capabilities.
- **Power BI Semantic Model** in DirectQuery mode delegates query execution to the KQL Database.
- **Power BI Dynamic M Query Parameters** pass user inputs from filters and slicers to the Power Query engine, which constructs custom queries that are sent to the KQL database.
- **Power Query functions** parse parameters and implement advanced logic, such as automatically computing the size of time bins over any time period.
- **Power BI Field Parameters** enable end users to customize chart layouts for more meaningful analysis.
- **Power BI Custom Visual** implements time brushing functionality to help you intuitively navigate across time.
- **Power BI Report** offers rich and highly-interactive data visualization capabilities.

### About the Time Series Brush Slicer

The [Time Series Brush Slicer](/dist/TimeSeriesBrushSlicerEFF0BAA64FAF4DC989E3AB4DE7610647.1.0.0.0.pbiviz) custom visual is the heart of the interactive experience. It displays your time series data as a Power BI chart and lets you brush (drag) to select time ranges.

#### What It Shows
- **Line and area charts** with customizable colors and styles.
- **Anomaly markers** highlighting unusual data points.
- **Timeline markers** for important events.
- **Multiple series** compared on the same chart.

#### Visual Customization
Style the visual to match your needs:
- **Chart appearance**: Line width, colors, area fill, opacity.
- **Axes**: Show/hide, fonts, colors, min/max values.
- **Brush overlay**: Selection color and transparency.
- **Conditional formatting**: Color line and area segments based on your data.

#### How It Filters Data
When you select a time range, the visual outputs a text string (such as `"2025-04-20|2025-04-30"`) that can be used as a Dynamic M Query Parameter in Power BI. This parameter is used in queries sent to the KQL database to filter all other visuals in the report, ensuring only data from your selected time period is displayed.

### How Power BI Works with the KQL Database

The report uses DirectQuery mode to query a KQL Database in real-time. Here's the simplified flow:

- **You select a time range** by brushing on the visual.
- **The visual outputs a text parameter** with your selected dates.
- **Power Query parses the parameter** and builds a KQL query with filters.
- **KQL Database processes everything** at the source—filtering, aggregating, detecting anomalies.
- **Only the results come back** to Power BI, not the raw data.

#### Why This Is Fast
- **Filtered at the source**: The KQL database only processes data in your selected time range.
- **Processed server-side**: Aggregations, binning, and calculations happen in the highly-performant KQL database.
- **Minimal data transfer**: Only summarized results flow to Power BI.
- **Automatic optimization**: The report adjusts time granularity based on your selections to keep performance smooth.

### What Settings Users Can Adjust
Users can control the analysis experience through report filters and slicers:
- **Initial Time Range**: users can specify the initial time range using a relative period (e.g., 1min, 1hour, 1day, 30days, etc.) by selecting a value in the **Show data for the last** slicer. A user may optionally specify a **Custom Anchor Date** filter, to streamline analysis of historical data preceding the anchor date. If a user selects *custom* from the **Show data for the last** slicer, they can specify an arbitrary **Start date** and **End date** for the initial time range.
- **Time Series Brush Range**: the time series brush slicer will provide a high-level overview of the initial time range. By dragging the handles on the time series brush slicer, the user may easily zero-in on a specific portion of the time range.
- **Max Bin Count**: users can specify the maximum number of bins into which the selected time range should be split to balance detail with performance and readability. Higher values result in more detailed and granular charts, while lower values result in smoother charts that may be easier to interpret.
- **Preferred Time Grain**: users can specify preferred time grain for their analysis (such as 1sec, 1min, 1 hour, 7days, etc.) The default value is *Auto* which will intelligently determine time granularity considering the length of the selected time period and the selected **Max Bin Count** setting. Note: this setting is treated as a suggestion - if the setting specified by the user would result in more time bins than permitted by the *Max Bin Count* setting, the report will behave similarly to the *Auto* setting.
- **Aggregation Method**: users can select a suitable aggregation method to summarize raw data points in each time bin. Options include *avg, count, count_distinct, min, max, and sum*.
- **Chart Configuration**: users can select how to configure the main line chart on the report, which is important when analyzing multiple time series side by side. Chart configuration allows the user to control whether each time series (or tag) will be split out into a separate chart with an independent vertical axis and whether each time series would be differentiated by color.
- **Tag Hierarchy** and **Tags**: helps users find the right tag for analysis using a hierarchical slicer and then select one or more tags to be included in detailed analysis.
- **Toggle Statistics Tab**: users can activate the *Statistics* tab to display descriptive statistics for each tag and correlation coefficients between tags (when analyzing multiple tags).

## Getting Started with the Basic Solution
The basic solution demonstrates the concepts of time series data visualization with Power BI and KQL databases using a publicly-available KQL database. More importantly, it can be easily customized to work with your data.

### Recommended Skills
- **KQL**: Basic
- **Power BI - Power Query**: Basic
- **Power BI - Reporting**: Basic

### Prerequisites
- Power BI Desktop
- Access to a KQL database (Microsoft Fabric or Azure Data Explorer). Note: this solution uses a publicly-accessible KQL database with sample data; however, you will need your own KQL database to work with your own data.
- Access to a Fabric Workspace (to publish and share your report)

### Try the Basic Solution
1. **Download or clone this GitHub repository** to your local computer.
1. **Open the `Time Series Viz - Basic.pbip` file** in the [Time Series Viz - Basic](/examples/Time%20Series%20Viz%20-%20Basic/) folder in Power BI Desktop.
1. **Provide credentials** for your Microsoft account to sign into the publicly-available Azure Data Explorer cluster (https://help.kusto.windows.net/).
1. **Start exploring** — drag the brush in the time series brush slicer to select time ranges and watch the report update.
1. Optionally, **publish the report to your Fabric workspace** to share with others.

### Adapt Basic Solution to Work With Your Data
1. **Download or clone this GitHub repository** to your local computer.
1. **Open the `Time Series Viz - Basic.pbip` file** in the [Time Series Viz - Basic](/examples/Time%20Series%20Viz%20-%20Basic/) folder in Power BI Desktop.
![Initial Power BI Report](/assets/Customize%20PBI%20Project/Initial%20Report.png)
1. Click on the **Transform Data** button to open the Power Query window:
![Click the "Transform Data" button](/assets/Customize%20PBI%20Project/Transform%20Data.png)
1. Click the **Manage Parameters** button: 
![Start managing parameters](/assets/Customize%20PBI%20Project/Manage%20Parameters.png)
1. **Update the following four parameters**:
![Update parameter values](/assets/Customize%20PBI%20Project/Configure%20Parameters.png)

    1.  **p_kql_cluster**: Update with the URL of your KQL cluster (such as https://help.kusto.windows.net/ or https://my-cluster-name.zX.kusto.fabric.microsoft.com)

    1.  **p_kql_db**: Update this parameter with the name of your KQL Database

    1.  **p_kql_query_tag_metadata**: Update with the base KQL query that will return tag metadata. The query will need to be adapted to the schema of your KQL database. It is assumed that your tags are organized hierarchically and are represented using columns, such as Level1, Level 2, etc.  
    Important: this query *must return the following 6 columns*, whose names must match exactly:
        - **Tag** (Id of a tag or of time series. Must be unique!)
        - **TagName** (User-friendly name of a tag. Must be unique!)
        - **Level1** (Top level of your tag hierarchy)
        - **Level2** (Second level of your tag hierarchy)
        - **Level3** (Third level of your tag hierarchy)
        - **Level4** (Fourth level of your tag hierarchy)  
    Example of a query:  
    `TimeseriesHierarchy | project Tag = TimeseriesId, TagName = DisplayName, Level1  = tostring(Path[0]), Level2 = tostring(Path[1]), Level3 = tostring(Path[2]), Level4 = tostring(Path[3])`  
    Please verify that the query is valid before pasting it here! 

    1.  **p_kql_query_timeseries**: Update with the base KQL query that will return your time series data. The query will need to be adapted to the schema of your KQL database.
    Important: this query must return the following 3 columns, whose names must match exactly:
        - **Tag** (Id of the tag, which will correspond to the Tag column in the query that you provided for the *p_kql_query_tag_metadata* parameter)
        - **Timestamp** (Represents the date and time of each event in your time series)
        - **Value**  (A column with a numeric value for each observation)
    Example of a query: `Timeseries | project Tag = TimeseriesId, Timestamp = Timestamp, Value = Value`  
    Please verify that the query is valid before pasting it here!

1. **Provide credentials and sign into the KQL database** specified by your parameters.
![Provide credentials and sign in](/assets/Customize%20PBI%20Project/Edit%20Credentials.png)
1. **Update default filter and slicer settings** to match your data. In particular, please note that the sample report specifies a *Custom Anchor Date* for relative date filtering, which should be either cleared or updated to match your data.
![Update filters and slicers](/assets/Customize%20PBI%20Project/Set%20Filters%20and%20Slicers.png)
1. **Start exploring** — drag the brush to select time ranges and watch the report update.
1. **Publish the report to your Fabric workspace** to share with others.

## Getting Started with the Advanced Solution
The Advanced solution builds upon the foundation of the Basic solution, while enhancing it in several ways:
1. Demonstrates the use of timeline markers to show important events.
1. Demonstrates a richer set of chart configuration options when paired with suitably-rich tag metadata.
1. Demonstrates the ability to construct more advanced KQL queries to adapt the solution to unique schemas and requirements.

### Recommended Skills
- **KQL**: Advanced
- **Power BI - Power Query**: Advanced
- **Power BI - Reporting**: Advanced

### Prerequisites
- Power BI Desktop and access to the Power BI service
- Access to a KQL Database (Microsoft Fabric or Azure Data Explorer)
- This sample solution uses the publicly-accessible KQL Database with sample data:
    - Cluster: **https://help.kusto.windows.net/**
    - Database: **Trender**

### Try the Advanced Solution
1. **Download or clone this GitHub repository** to your local computer.
1. **Open the `Time Series Viz - Advanced.pbip` file** in the [Time Series Viz - Advanced](/examples/Time%20Series%20Viz%20-%20Advanced/) folder in Power BI Desktop.
1. **Provide credentials** for your Microsoft account to sign into the publicly-available Azure Data Explorer cluster (https://help.kusto.windows.net/).
1. **Start exploring** — drag the brush to select time ranges and watch the report update.
1. **Publish the report** to your Fabric workspace to share with others.

### Adapt Advanced Solution to Work With Your Data
1. **Download or clone this GitHub repository** to your local computer.
1. **Open the `Time Series Viz - Advanced.pbip` file** in the [Time Series Viz - Advanced](/examples/Time%20Series%20Viz%20-%20Advanced/) folder in Power BI Desktop.
1. Click on the **Transform Data** button to open the Power Query window:
1. Click the **Manager Parameters** button.
1. **Update the following two parameters**:
     - **p_kql_cluster**: Update with the URL of your KQL cluster (such as https://help.kusto.windows.net/ or https://my-cluster-name.zX.kusto.fabric.microsoft.com)
     - **p_kql_db**: Update with the name of your KQL database.
1. **Update queries in the semantic model** to modify the logic for generating KQL queries used to retrieve your time series data and relevant tag metadata.  
1. **Customize report visuals** to show what matters most to you.  

Note: customizing the advanced solution requires high levels of proficiency with Power Query, KQL and Power BI visualization. While the solution can be customized in a variety of ways, specific steps for adapting this solution to your needs are beyond the scope of this tutorial. Consider using the design of the sample solution as a starting point for your customization.


## Learn More

- **Custom Visual**: [Time-Series-Brush-Slicer on GitHub](https://github.com/slavatrofimov/Time-Series-Brush-Slicer)
- **KQL Documentation**: [Kusto Query Language](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- **Power BI DirectQuery**: [DirectQuery Guide](https://docs.microsoft.com/power-bi/connect-data/desktop-directquery-about)
- **Advanced Parameterization**: [Power BI Dynamic M Query Parameters](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-dynamic-m-query-parameters)
