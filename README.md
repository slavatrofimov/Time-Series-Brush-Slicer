# Time Series Brush Slicer

A Power BI custom visual that provides an interactive time range selector with brush interaction, specifically designed for optimizing DirectQuery experience with semantic models connected to KQL Databases in Microsoft Fabric and relational databases/data warehouses.

## Purpose

The Time Series Brush Slicer enables users to select time ranges visually using a brush interaction over a time series chart. Unlike traditional slicers that query data for every filter combination, this visual outputs the selected time range as a **single text string** that can be passed as a parameter to DirectQuery queries, enabling efficient query execution against large-scale data sources.

## Key Benefits for DirectQuery Scenarios

### Optimized for KQL Databases in Fabric

When working with KQL (Kusto Query Language) databases in Microsoft Fabric, this visual provides significant performance advantages:

- **Single Query Execution**: The visual outputs a time range as a text string (e.g., `"2024-01-01T00:00:00Z|2024-12-31T23:59:59Z"`), which can be parsed in M queries and passed to KQL queries as parameters
- **Reduced Query Load**: Instead of executing separate queries for start and end dates, a single parameterized query handles the entire time range
- **Native KQL Integration**: The output format is designed to be easily parsed and used in KQL `where` clauses with datetime filters
- **Large Dataset Handling**: Efficiently handles millions of rows by filtering at the source rather than bringing data into Power BI

### Performance Benefits for Relational Databases

For SQL Server, Azure SQL Database, Synapse, and other relational data warehouses:

- **Query Folding**: The time range parameter enables proper query folding, pushing filters to the database engine
- **Index Optimization**: Database indexes on datetime columns are effectively utilized when filters are applied as parameters
- **Reduced Data Transfer**: Only data within the selected time range is transferred from the database to Power BI
- **Connection Pooling**: Single parameterized queries work better with connection pooling mechanisms

## Features

### Interactive Time Selection

- **Brush Interaction**: Click and drag to select a time range on the chart
- **Visual Feedback**: Selected range is highlighted with a customizable brush overlay
- **Precise Selection**: Axis labels show exact timestamps for accurate range selection
- **Full Range Default**: Automatically selects the entire time range on data load

### Time Series Visualization

- **Area Chart**: Optional area chart visualization with customizable color and opacity
- **Line Chart**: Line overlay with configurable width and color (supports conditional formatting)
- **Anomaly Markers**: Display anomaly points with customizable markers (circle, square, triangle, diamond)
- **Timeline Markers**: Vertical markers for significant events with customizable position and style
- **Gap Handling**: Automatically detects and visualizes gaps in time series data

### Conditional Formatting

- **Per-Segment Line Colors**: Apply conditional formatting to line colors, with each segment colored based on the value at that time point
- **Gradient Support**: Use color gradients based on measure values
- **Rule-Based Colors**: Define color rules based on value thresholds
- **Single Control**: One color picker with fx button evaluates formatting rules per data point

### Range Output

- **ISO 8601 Format**: Default output in ISO 8601 format for international compatibility
- **Custom Format**: Support for custom date/time format strings
- **Configurable Delimiter**: Choose the delimiter between start and end timestamps
- **M Query Integration**: Output format designed for easy parsing in Power Query M

### Customization Options

The visual provides extensive formatting options organized into the following categories:

#### Brush Settings
- Brush color and opacity for the selection overlay

#### Line Settings
- Line color with conditional formatting support (fx button)
- Line width (0.5-10px)

#### Area Settings
- Show/hide area chart toggle
- Area color with conditional formatting support (fx button)
- Area opacity (0-100%)

#### Time Axis Settings
- Show/hide time axis toggle
- Axis color, font size, and font family

#### Y Axis Settings
- Y-axis minimum and maximum values (auto or custom)
- Zero line display with custom color and width

#### Margin Settings
- Chart margins (top, right, bottom, left)

#### Series Colors
- Individual color settings for multi-series data (auto-generated)

#### Display Settings
- Show/hide selected range text
- Custom date format for display (e.g., "MMM d, yyyy HH:mm:ss")
- Configurable prefix text
- Font family, size, color, and alignment
- Background color and margins

#### Output Settings
- ISO 8601 format toggle (recommended for M queries)
- Custom output date format
- Configurable delimiter between start and end timestamps

#### Anomalies Settings
- Marker type (circle, square, triangle, diamond)
- Marker size, color, and opacity

#### Timeline Markers Settings
- Line color, width, and opacity
- Marker type and position (top/bottom)
- Marker size, color, and opacity

## Data Roles

### Required
- **Timestamp**: DateTime field representing the time dimension (single field)
- **Values**: Numeric measure to visualize (single measure)

### Optional
- **Series**: Categorical field for multiple series (single field)
- **Anomalies**: Numeric field indicating anomaly values (single measure)
- **Timeline Markers**: Text field for event markers (single measure)
- **Filter Field**: Field to receive the filter (typically the same as Timestamp)

## Usage with DirectQuery

### Setting Up with KQL Database

1. **Create Parameters in Power BI**:
   ```m
   StartDate = #datetime(2024, 1, 1, 0, 0, 0) meta [IsParameterQuery=true]
   EndDate = #datetime(2024, 12, 31, 23, 59, 59) meta [IsParameterQuery=true]
   ```

2. **Add Time Series Brush Slicer** to your report

3. **Configure the Visual**:
   - Add your DateTime column to Timestamp field
   - Add your measure to Values field
   - Add the DateTime column to Filter Field
   - Set Output Settings → Use ISO 8601 Format: **On**
   - Set Delimiter: `|`

4. **Create M Function to Parse Output**:
   ```m
   let
       ParseTimeRange = (rangeText as text) =>
           let
               parts = Text.Split(rangeText, "|"),
               startText = parts{0},
               endText = parts{1},
               startDate = DateTime.FromText(startText),
               endDate = DateTime.FromText(endText)
           in
               [Start = startDate, End = endDate]
   in
       ParseTimeRange
   ```

5. **Use in KQL Query**:
   ```m
   let
       TimeRange = ParseTimeRange(SelectedTimeRange),
       KustoQuery = "
           MyTable
           | where Timestamp >= datetime(" & DateTime.ToText(TimeRange[Start], "yyyy-MM-ddTHH:mm:ssZ") & ")
           | where Timestamp <= datetime(" & DateTime.ToText(TimeRange[End], "yyyy-MM-ddTHH:mm:ssZ") & ")
           | summarize Value = sum(Amount) by bin(Timestamp, 1h)
       ",
       Source = Kusto.Contents("https://mycluster.kusto.windows.net", "MyDatabase", KustoQuery, [])
   in
       Source
   ```

### Setting Up with SQL Database

1. **Create Table-Valued Function** in SQL:
   ```sql
   CREATE FUNCTION dbo.GetTimeSeriesData
   (
       @StartDate datetime2,
       @EndDate datetime2
   )
   RETURNS TABLE
   AS
   RETURN
   (
       SELECT 
           Timestamp,
           Value
       FROM FactTable
       WHERE Timestamp >= @StartDate 
         AND Timestamp <= @EndDate
   )
   ```

2. **Call from Power Query**:
   ```m
   let
       TimeRange = ParseTimeRange(SelectedTimeRange),
       Source = Sql.Database("server", "database"),
       FunctionCall = Source{[Schema="dbo",Item="GetTimeSeriesData"]}(TimeRange[Start], TimeRange[End])
   in
       FunctionCall
   ```

## Configuration Examples

### Basic Time Series with Anomalies
```
Timestamp: OrderDate
Values: DailySales
Anomalies: AnomalyScore
Filter Field: OrderDate
```

### Multi-Series with Events
```
Timestamp: EventTime
Series: Region
Values: ActiveUsers
Timeline Markers: DeploymentEvents
Filter Field: EventTime
```

### High-Frequency Data with Conditional Formatting
```
Timestamp: SensorTimestamp
Values: Temperature
Filter Field: SensorTimestamp

Line Settings → Line Color → fx → Gradient
- Minimum: Blue (#0000FF) at 0°C
- Maximum: Red (#FF0000) at 100°C
```

## Best Practices

### Data Volume
- Use with datasets containing 100 to 100,000+ time points
- Enable data reduction in capabilities.json (currently set to 30,000 points)
- For larger datasets, use server-side aggregation in your query

### Performance Optimization
- Always use DirectQuery mode for large datasets
- Create indexes on datetime columns in your source database
- Use the visual's filter output rather than traditional slicers for time filtering
- Consider date binning (hourly, daily) for very high-frequency data

### Visual Design
- Set appropriate Y-axis min/max values to avoid misleading scales
- Use area charts for cumulative or volume metrics
- Use line charts for trend analysis
- Enable anomaly markers when using anomaly detection models
- Add timeline markers for important events (releases, incidents, etc.)

### Conditional Formatting
- Use gradients for continuous measures (temperature, pressure, etc.)
- Use rules for discrete states (above/below threshold, status codes)
- Ensure the measure used for conditional formatting is the same as or related to the Values field

## Output Format

The visual outputs a text string in the format:
```
<start_timestamp><delimiter><end_timestamp>
```

Default output example:
```
2024-01-01T00:00:00.000Z|2024-12-31T23:59:59.999Z
```

Custom format example (with format: "yyyy-MM-dd HH:mm:ss", delimiter: ";"):
```
2024-01-01 00:00:00;2024-12-31 23:59:59
```

## Technical Specifications

- **API Version**: Power BI Visuals API 5.3.0
- **Dependencies**: 
  - D3.js v7 for SVG rendering
  - powerbi-visuals-utils-formattingmodel
  - powerbi-visuals-utils-tooltiputils
  - powerbi-visuals-utils-dataviewutils
- **Supported Browsers**: All browsers supported by Power BI
- **Maximum Data Points**: 30,000 (configurable in capabilities.json)

## Installation

1. Download the `.pbiviz` file from the `dist` folder
2. In Power BI Desktop, go to **Insert** → **More visuals** → **Import a visual from a file**
3. Select the downloaded `.pbiviz` file
4. The visual will appear in the Visualizations pane

## Development

### Building from Source
```bash
npm install
npm run package
```

### Requirements
- Node.js 16 or higher
- PowerBI-visuals-tools CLI

### Project Structure
```
src/
  ├── visual.ts          # Main visual implementation
  ├── settings.ts        # Formatting settings model
  └── style/
      └── visual.less    # Visual styles
capabilities.json         # Visual capabilities and data roles
pbiviz.json              # Visual metadata
```

## Support and Contributions

For issues, feature requests, or contributions, please visit the GitHub repository.

## License

See LICENSE file for details.

## Version History

### 1.0.0
- Initial release
- Time range brush selection
- Area and line chart visualization
- Anomaly and timeline markers
- Conditional formatting for line colors
- ISO 8601 and custom date format output
- DirectQuery optimization
- Multi-series support

